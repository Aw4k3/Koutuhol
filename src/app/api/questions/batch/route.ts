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
  count: z.number().min(1).max(15).default(6),
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
      return NextResponse.json(
        { questions: [], error: 'Invalid selection parameters sent to server.' },
        { status: 400 }
      );
    }

    const { level, group, subjectSlugs, customCourses, seenQuestionIds, count } = parsed.data;
    const eduLevel = level as EduLevel;
    const academicGroup = group as AcademicGroup;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const hasSupabase = Boolean(
      supabaseUrl &&
        supabaseServiceKey &&
        supabaseUrl.startsWith('http') &&
        !supabaseServiceKey.includes('paste_your')
    );

    const supabaseAdmin = hasSupabase
      ? createClient(supabaseUrl!, supabaseServiceKey!)
      : null;

    let dbQuestions: unknown[] = [];

    // 1. Check Supabase for existing unseen questions
    if (supabaseAdmin) {
      let query = supabaseAdmin
        .from('questions')
        .select('*')
        .eq('applicable_level', eduLevel)
        .eq('status', 'published');

      if (isUniversityLevel(eduLevel)) {
        if (customCourses.length > 0) {
          query = query.in('custom_course_name', customCourses);
        }
      } else if (subjectSlugs.length > 0) {
        query = query.in('subject_slug', subjectSlugs);
      }

      const { data: existingQuestions, error: dbErr } = await query.limit(30);
      if (dbErr) {
        console.error('Supabase fetch error:', dbErr.message);
      } else if (existingQuestions) {
        const seenSet = new Set(seenQuestionIds);
        dbQuestions = existingQuestions.filter((q: { id: string }) => !seenSet.has(q.id)).slice(0, count);
      }

      if (dbQuestions.length >= count) {
        return NextResponse.json({ questions: dbQuestions, source: 'database' });
      }
    }

    // 2. Generate new questions via Gemini API (using gemini-3.5-flash-lite)
    const neededCount = count - dbQuestions.length;
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey || apiKey.includes('paste_your')) {
      return NextResponse.json(
        {
          questions: dbQuestions,
          error: 'GEMINI_API_KEY is missing or invalid in .env.local.',
        },
        { status: 400 }
      );
    }

    const levelInfo = EDU_LEVEL_LABELS[eduLevel];
    const isUniv = isUniversityLevel(eduLevel);
    const targetSubjectSlug =
      !isUniv && subjectSlugs.length > 0
        ? subjectSlugs[Math.floor(Math.random() * subjectSlugs.length)]
        : null;
    const targetCourse =
      isUniv && customCourses.length > 0
        ? customCourses[Math.floor(Math.random() * customCourses.length)]
        : 'General University Course';

    const subjectMeta = INITIAL_SUBJECTS.find((s) => s.slug === targetSubjectSlug);
    const subjectLabel = isUniv
      ? targetCourse
      : `${subjectMeta?.nameBn || 'সাধারণ বিষয়'} (${subjectMeta?.nameEn || 'General'})`;
    const targetLang = isUniv ? 'en' : subjectMeta?.language || 'bn';

    const prompt = `Generate ${neededCount} unique multiple-choice questions (MCQs) for a student in Bangladesh.
Education Level: ${levelInfo?.labelEn || eduLevel}
Subject / Course: ${subjectLabel}
Language: ${targetLang === 'bn' ? 'Bengali (বাংলা)' : 'English'}

Return ONLY a raw JSON array of objects without markdown formatting. Each object must have:
- "topic": string
- "difficulty": "easy" | "medium" | "hard"
- "language": "${targetLang}"
- "question_text": string (use inline LaTeX like $x^2$ for math)
- "options": { "A": string, "B": string, "C": string, "D": string }
- "correct_option": "A" | "B" | "C" | "D"
- "explanation": string`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
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
      const errText = await geminiRes.text();
      console.error('Gemini API HTTP Error:', errText);
      return NextResponse.json(
        {
          questions: dbQuestions,
          error: `Gemini API Error (${geminiRes.status}): ${errText.slice(0, 220)}`,
        },
        { status: 500 }
      );
    }

    const geminiJson = await geminiRes.json();
    const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const cleanedJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleanedJson);
    } catch {
      return NextResponse.json(
        { questions: dbQuestions, error: 'Failed to parse JSON from AI response.' },
        { status: 500 }
      );
    }

    const validatedBatch = GeneratedBatchSchema.safeParse(parsedJson);
    if (!validatedBatch.success) {
      return NextResponse.json(
        {
          questions: dbQuestions,
          error: `AI validation failed: ${validatedBatch.error.issues[0]?.message}`,
        },
        { status: 500 }
      );
    }

    const rowsToInsert = validatedBatch.data.map((q) => ({
      id: crypto.randomUUID(),
      subject_slug: targetSubjectSlug,
      custom_course_name: isUniv ? targetCourse : null,
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
      ai_model_source: 'gemini-3.5-flash-lite',
      source_reference: `AI Generated (${subjectLabel}) — Unverified`,
      status: 'published',
      content_hash: computeHash(q.question_text),
    }));

    if (supabaseAdmin) {
      const { data: insertedQuestions, error: insertErr } = await supabaseAdmin
        .from('questions')
        .upsert(rowsToInsert, { onConflict: 'content_hash', ignoreDuplicates: true })
        .select('*');

      if (insertErr) {
        console.warn('Supabase save warning (serving from memory):', insertErr.message);
        return NextResponse.json({
          questions: [...dbQuestions, ...rowsToInsert],
          source: 'ai_memory',
        });
      }

      return NextResponse.json({
        questions: [
          ...dbQuestions,
          ...(insertedQuestions && insertedQuestions.length > 0 ? insertedQuestions : rowsToInsert),
        ],
        source: 'hybrid_ai_db',
      });
    }

    return NextResponse.json({ questions: rowsToInsert, source: 'ai_only' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown server error';
    console.error('Batch route exception:', msg);
    return NextResponse.json({ questions: [], error: msg }, { status: 500 });
  }
}