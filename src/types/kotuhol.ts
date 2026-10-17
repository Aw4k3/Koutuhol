export type EduLevel =
  | 'class_3' | 'class_4' | 'class_5'
  | 'class_6' | 'class_7' | 'class_8'
  | 'class_9' | 'class_10' | 'class_11' | 'class_12'
  | 'univ_undergrad' | 'univ_masters';

export type AcademicGroup = 'none' | 'science' | 'commerce' | 'arts';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface SubjectConfig {
  slug: string;
  nameBn: string;
  nameEn: string;
  applicableLevels: EduLevel[];
  applicableGroup: AcademicGroup;
  language: 'bn' | 'en';
  isActive: boolean;
}

export interface QuestionOptionMap {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface Question {
  id: string;
  subject_slug: string | null;
  custom_course_name: string | null;
  applicable_level: EduLevel;
  academic_group: AcademicGroup;
  language: 'bn' | 'en';
  difficulty: DifficultyLevel;
  topic: string | null;
  question_text: string;
  options: QuestionOptionMap;
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  is_ai_generated: boolean;
  source_reference: string | null;
}

export interface UserPreferences {
  level: EduLevel | null;
  group: AcademicGroup;
  subjectSlugs: string[];
  customCourses: string[];
  isTimed: boolean;
}