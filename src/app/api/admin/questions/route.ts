import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';
import crypto from 'crypto';

const AdminQuestionItemSchema = z.object({
  subject_slug: z.string().nullable().default(null),
  custom_course_name: z.string().nullable().default(null),
  applicable_level: z.enum([
    'class_3', 'class_4', 'class_5',
    'class_6', 'class_7', 'class_8',
    'class_9', 'class_10', 'class_11', 'class_12',
    'univ_undergrad', 'univ_masters',
  ]),
  academic_group: z.enum(['none', 'science', 'commerce', 'arts']).default('none'),
  language: z.enum(['bn', 'en']).default('bn'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  topic: z.string().default('General'),
  question_text: z.string().min(5),
  options: z.object({
    A: z.string().min(1),
    B: z.string().min(1),
    C: z.string().min(1),
    D: z.string().min(1),
  }),
  correct_option: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().default(''),
  source_reference: z.string().default('Admin Imported'),
});

const BulkImportSchema = z.object({
  questions: z.array(AdminQuestionItemSchema).min(1).max(200),
});

function computeHash(text: string): string {
  return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}

export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in first.' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Server-side role check
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Your account does not have admin privileges.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = BulkImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: `Validation Error on item: ${parsed.error.issues[0]?.path.join('.')} — ${parsed.error.issues[0]?.message}`,
        },
        { status: 400 }
      );
    }

    const rows = parsed.data.questions.map((q) => ({
      ...q,
      is_ai_generated: false,
      status: 'published',
      content_hash: computeHash(q.question_text),
    }));

    const { data: inserted, error: dbErr } = await supabaseAdmin
      .from('questions')
      .upsert(rows, { onConflict: 'content_hash', ignoreDuplicates: true })
      .select('id');

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({
      importedCount: inserted?.length || 0,
      message: `Successfully validated and imported ${inserted?.length || 0} unique questions.`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}