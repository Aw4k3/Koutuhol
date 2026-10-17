import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import crypto from 'crypto';
import { EDU_LEVEL_LABELS, INITIAL_SUBJECTS, isUniversityLevel } from '@/config/curriculum';
import { EduLevel, AcademicGroup } from '@/types/koutuhol';

const RequestSchema = z.object({
  level: z.string(),
  group: z.string().default('none'),
  subjectSlugs: z.array(z.string()).default([]),
  customCourses: z.array(z.string()).default([]),
  seenQuestionIds: z.array(z.string()).default([]),
  count: z.number().min(1).max(15).default(8),
});

const GeneratedQuestionSchema = z.object({
  topic: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  language: z.enum(['bn', 'en']),
  question_text: z.string().min(5),
  options: z.object({
    A: z.string().min(1),
    B: z.string().min(1),
    C: z.string().min(1),
    D: z.string().min(1),
  }),
  correct_option: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(5),
});

const GeneratedBatchSchema = z.array(GeneratedQuestionSchema);

function computeHash(text: string): string {
  return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const { level, group, subjectSlugs, customCourses, seenQuestionIds, count } = parsed.data;
    const eduLevel = level as EduLevel;
    const academicGroup = group as AcademicGroup;

    // Admin client to read & insert into shared question bank safely on the server
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Query existing unseen questions from Supabase
    let query = supabaseAdmin
      .from('questions')
      .select('*')
      .eq('applicable_level', eduLevel)
      .eq('status', 'published');

    if (isUniversityLevel(eduLevel)) {
      query = query.in('custom_course_name', customCourses);
    } else {
      query = query.in('subject_slug', subjectSlugs);
    }

    if (seenQuestionIds.length > 0) {
      query = query.not('id', 'in', `(${seenQuestionIds.join(',')})`);
    }

    const { data: existingQuestions } = await query.limit(count);
    const dbQuestions = existingQuestions || [];

    // If we already have enough unseen questions in DB, return them immediately (0 AI calls!)
    if (dbQuestions.length >= count) {
      return NextResponse.json({ questions: dbQuestions, source: 'database' });
    }

    // 2. Otherwise, generate new questions using Gemini Free Tier to grow the bank
    const neededCount = count - dbQuestions.length;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        questions: dbQuestions,
        exhausted: dbQuestions.length === 0,
        message: 'GEMINI_API_KEY not configured; returning existing DB questions only.',
      });
    }

    const levelInfo = EDU_LEVEL_LABELS[eduLevel];
    const isUniv = isUniversityLevel(eduLevel);
    const targetSubjectSlug = !isUniv
      ? subjectSlugs[Math.floor(Math.random() * subjectSlugs.length)]
      : null;
    const targetCourse = isUniv
      ? customCourses[Math.floor(Math.random() * customCourses.length)]
      : null;

    const subjectMeta = INITIAL_SUBJECTS.find((s) => s.slug === targetSubjectSlug);
    const subjectLabel = isUniv
      ? targetCourse
      : `${subjectMeta?.nameBn} (${subjectMeta?.nameEn})`;
    const targetLang = isUniv ? 'en' : subjectMeta?.language || 'bn';

    const prompt = `Generate ${neededCount} unique, high-quality multiple-choice questions (MCQs) for a student in Bangladesh.
Education Level: ${levelInfo.labelEn} (${levelInfo.labelBn})
Subject / Course: ${subjectLabel}
Language to write questions & explanations in: ${targetLang === 'bn' ? 'Bengali (বাংলা)' : 'English'}

Rules:
1. Align strictly with the Bangladeshi NCTB curriculum (or standard university syllabus if University level).
2. Wrap all mathematical formulas, fractions, exponents, physics symbols, or equations in single dollar signs for inline LaTeX like $x^2 + y^2 = r^2$ or $\\frac{a}{b}$. Never escape normal text as LaTeX.
3. Ensure only one option (A, B, C, or D) is unambiguously correct.
4. Return ONLY a valid JSON array matching the requested schema.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      return NextResponse.json({ questions: dbQuestions, source: 'database_partial' });
    }

    const geminiJson = await geminiRes.json();
    const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const validatedBatch = GeneratedBatchSchema.safeParse(JSON.parse(rawText));

    if (!validatedBatch.success) {
      return NextResponse.json({ questions: dbQuestions, source: 'validation_fallback' });
    }

    // 3. Prepare and store validated questions in Supabase shared bank
    const rowsToInsert = validatedBatch.data.map((q) => ({
      subject_slug: targetSubjectSlug,
      custom_course_name: targetCourse,
      applicable_level: eduLevel,
      academic_group: academicGroup,
      language: q.language,
      difficulty: q.difficulty,
      topic: q.topic,
      question_text: q.question_text,
      options: q.options,
      correct_option: q.correct_option,
      explanation: q.explanation,
      is_ai_generated: true,
      ai_model_source: 'gemini-2.5-flash',
      source_reference: `AI Generated (${subjectLabel}) — Unverified`,
      status: 'published',
      content_hash: computeHash(q.question_text),
    }));

    const { data: insertedQuestions } = await supabaseAdmin
      .from('questions')
      .upsert(rowsToInsert, { onConflict: 'content_hash', ignoreDuplicates: true })
      .select('*');

    const combined = [...dbQuestions, ...(insertedQuestions || [])];
    return NextResponse.json({ questions: combined, source: 'hybrid_ai_db' });
  } catch (err) {
    console.error('Batch question error:', err);
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }
}