import { AcademicGroup, EduLevel, SubjectConfig } from '@/types/koutuhol';

export const EDU_LEVEL_LABELS: Record<EduLevel, { labelBn: string; labelEn: string; category: 'primary' | 'junior' | 'secondary' | 'university' }> = {
  class_3: { labelBn: '৩য় শ্রেণি', labelEn: 'Class 3', category: 'primary' },
  class_4: { labelBn: '৪র্থ শ্রেণি', labelEn: 'Class 4', category: 'primary' },
  class_5: { labelBn: '৫ম শ্রেণি', labelEn: 'Class 5', category: 'primary' },
  class_6: { labelBn: '৬ষ্ঠ শ্রেণি', labelEn: 'Class 6', category: 'junior' },
  class_7: { labelBn: '৭ম শ্রেণি', labelEn: 'Class 7', category: 'junior' },
  class_8: { labelBn: '৮ম শ্রেণি', labelEn: 'Class 8', category: 'junior' },
  class_9: { labelBn: '৯ম শ্রেণি', labelEn: 'Class 9', category: 'secondary' },
  class_10: { labelBn: '১০ম শ্রেণি', labelEn: 'Class 10', category: 'secondary' },
  class_11: { labelBn: '১১শ শ্রেণি', labelEn: 'Class 11', category: 'secondary' },
  class_12: { labelBn: '১২শ শ্রেণি', labelEn: 'Class 12', category: 'secondary' },
  univ_undergrad: { labelBn: 'বিশ্ববিদ্যালয় — স্নাতক', labelEn: 'University — Undergraduate', category: 'university' },
  univ_masters: { labelBn: 'বিশ্ববিদ্যালয় — স্নাতকোত্তর', labelEn: "University — Master's", category: 'university' },
};

export const ACADEMIC_GROUP_LABELS: Record<Exclude<AcademicGroup, 'none'>, { labelBn: string; labelEn: string }> = {
  science: { labelBn: 'বিজ্ঞান (Science)', labelEn: 'Science' },
  commerce: { labelBn: 'ব্যবসায় শিক্ষা (Commerce)', labelEn: 'Commerce / Business Studies' },
  arts: { labelBn: 'মানবিক (Arts/Humanities)', labelEn: 'Arts / Humanities' },
};

export const INITIAL_SUBJECTS: SubjectConfig[] = [
  // Class 3-5
  { slug: 'amar-bangla-boi-3-5', nameBn: 'আমার বাংলা বই', nameEn: 'Amar Bangla Boi', applicableLevels: ['class_3', 'class_4', 'class_5'], applicableGroup: 'none', language: 'bn', isActive: true },
  { slug: 'english-for-today-3-5', nameBn: 'English For Today', nameEn: 'English For Today', applicableLevels: ['class_3', 'class_4', 'class_5'], applicableGroup: 'none', language: 'en', isActive: true },
  { slug: 'prathomik-gonit-3-5', nameBn: 'প্রাথমিক গণিত', nameEn: 'Elementary Mathematics', applicableLevels: ['class_3', 'class_4', 'class_5'], applicableGroup: 'none', language: 'bn', isActive: true },
  { slug: 'prathomik-biggan-3-5', nameBn: 'প্রাথমিক বিজ্ঞান', nameEn: 'Elementary Science', applicableLevels: ['class_3', 'class_4', 'class_5'], applicableGroup: 'none', language: 'bn', isActive: true },
  { slug: 'bgs-3-5', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয়', nameEn: 'Bangladesh and Global Studies', applicableLevels: ['class_3', 'class_4', 'class_5'], applicableGroup: 'none', language: 'bn', isActive: true },

  // Class 6-8
  { slug: 'charupath-6-8', nameBn: 'চারুপাঠ', nameEn: 'Charupath', applicableLevels: ['class_6', 'class_7', 'class_8'], applicableGroup: 'none', language: 'bn', isActive: true },
  { slug: 'bangla-grammar-6-8', nameBn: 'বাংলা ব্যাকরণ ও নির্মিতি', nameEn: 'Bangla Grammar and Composition', applicableLevels: ['class_6', 'class_7', 'class_8'], applicableGroup: 'none', language: 'bn', isActive: true },
  { slug: 'english-for-today-6-8', nameBn: 'English For Today', nameEn: 'English For Today', applicableLevels: ['class_6', 'class_7', 'class_8'], applicableGroup: 'none', language: 'en', isActive: true },
  { slug: 'english-grammar-6-8', nameBn: 'English Grammar and Composition', nameEn: 'English Grammar and Composition', applicableLevels: ['class_6', 'class_7', 'class_8'], applicableGroup: 'none', language: 'en', isActive: true },
  { slug: 'math-6-8', nameBn: 'গণিত (Mathematics)', nameEn: 'Mathematics', applicableLevels: ['class_6', 'class_7', 'class_8'], applicableGroup: 'none', language: 'bn', isActive: true },
  { slug: 'science-6-8', nameBn: 'বিজ্ঞান (Science)', nameEn: 'Science', applicableLevels: ['class_6', 'class_7', 'class_8'], applicableGroup: 'none', language: 'bn', isActive: true },
  { slug: 'bgs-6-8', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয়', nameEn: 'Bangladesh and Global Studies', applicableLevels: ['class_6', 'class_7', 'class_8'], applicableGroup: 'none', language: 'bn', isActive: true },
  { slug: 'ict-6-8', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)', nameEn: 'ICT', applicableLevels: ['class_6', 'class_7', 'class_8'], applicableGroup: 'none', language: 'bn', isActive: true },

  // Class 9-12 General
  { slug: 'bangla-sahitya-9-12', nameBn: 'বাংলা সাহিত্য', nameEn: 'Bangla Literature', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'none', language: 'bn', isActive: true },
  { slug: 'bangla-sohopath-9-12', nameBn: 'বাংলা সহপাঠ', nameEn: 'Bangla Co-curriculum', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'none', language: 'bn', isActive: true },
  { slug: 'bangla-grammar-9-12', nameBn: 'বাংলা ভাষার ব্যাকরণ ও নির্মিতি', nameEn: 'Bangla Grammar', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'none', language: 'bn', isActive: true },
  { slug: 'english-for-today-9-12', nameBn: 'English for Today', nameEn: 'English for Today', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'none', language: 'en', isActive: true },
  { slug: 'english-grammar-9-12', nameBn: 'English Grammar and Composition', nameEn: 'English Grammar', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'none', language: 'en', isActive: true },
  { slug: 'general-math-9-12', nameBn: 'গণিত', nameEn: 'General Mathematics', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'none', language: 'bn', isActive: true },
  { slug: 'ict-9-12', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)', nameEn: 'ICT', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'none', language: 'bn', isActive: true },

  // Class 9-12 Science
  { slug: 'physics-9-12', nameBn: 'পদার্থবিজ্ঞান', nameEn: 'Physics', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'science', language: 'bn', isActive: true },
  { slug: 'chemistry-9-12', nameBn: 'রসায়ন', nameEn: 'Chemistry', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'science', language: 'bn', isActive: true },
  { slug: 'biology-9-12', nameBn: 'জীববিজ্ঞান', nameEn: 'Biology', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'science', language: 'bn', isActive: true },
  { slug: 'higher-math-9-12', nameBn: 'উচ্চতর গণিত', nameEn: 'Higher Mathematics', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'science', language: 'bn', isActive: true },

  // Class 9-12 Commerce
  { slug: 'accounting-9-12', nameBn: 'হিসাববিজ্ঞান', nameEn: 'Accounting', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'commerce', language: 'bn', isActive: true },
  { slug: 'finance-banking-9-12', nameBn: 'ফিন্যান্স ও ব্যাংকিং', nameEn: 'Finance and Banking', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'commerce', language: 'bn', isActive: true },
  { slug: 'business-ent-9-12', nameBn: 'ব্যবসায় উদ্যোগ', nameEn: 'Business Entrepreneurship', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'commerce', language: 'bn', isActive: true },

  // Class 9-12 Arts
  { slug: 'geography-9-12', nameBn: 'ভূগোল ও পরিবেশ', nameEn: 'Geography and Environment', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'arts', language: 'bn', isActive: true },
  { slug: 'economics-9-12', nameBn: 'অর্থনীতি', nameEn: 'Economics', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'arts', language: 'bn', isActive: true },
  { slug: 'civics-9-12', nameBn: 'পৌরনীতি ও নাগরিকতা', nameEn: 'Civics and Citizenship', applicableLevels: ['class_9', 'class_10', 'class_11', 'class_12'], applicableGroup: 'arts', language: 'bn', isActive: true },
];

export function requiresAcademicGroup(level: EduLevel): boolean {
  return ['class_9', 'class_10', 'class_11', 'class_12'].includes(level);
}

export function isUniversityLevel(level: EduLevel): boolean {
  return level === 'univ_undergrad' || level === 'univ_masters';
}

export function getEligibleSubjects(level: EduLevel, group: AcademicGroup = 'none'): {
  general: SubjectConfig[];
  groupSpecific: SubjectConfig[];
} {
  if (isUniversityLevel(level)) {
    return { general: [], groupSpecific: [] };
  }

  const levelSubjects = INITIAL_SUBJECTS.filter(
    (s) => s.isActive && s.applicableLevels.includes(level)
  );

  return {
    general: levelSubjects.filter((s) => s.applicableGroup === 'none'),
    groupSpecific:
      requiresAcademicGroup(level) && group !== 'none'
        ? levelSubjects.filter((s) => s.applicableGroup === group)
        : [],
  };
}

export function validateSelection(
  level: EduLevel | null,
  group: AcademicGroup,
  subjectSlugs: string[],
  customCourses: string[]
): { valid: boolean; error?: string } {
  if (!level) {
    return { valid: false, error: 'Please select an education level.' };
  }

  if (isUniversityLevel(level)) {
    const cleaned = customCourses.map((c) => c.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      return { valid: false, error: 'Please add at least 1 university course name.' };
    }
    if (cleaned.length > 3) {
      return { valid: false, error: 'You can select at most 3 university courses per session.' };
    }
    return { valid: true };
  }

  if (requiresAcademicGroup(level) && group === 'none') {
    return { valid: false, error: 'Please select an academic group (Science, Commerce, or Arts).' };
  }

  if (subjectSlugs.length === 0) {
    return { valid: false, error: 'Please select at least one subject.' };
  }

  const eligible = getEligibleSubjects(level, group);
  const allowedSlugs = new Set([
    ...eligible.general.map((s) => s.slug),
    ...eligible.groupSpecific.map((s) => s.slug),
  ]);

  for (const slug of subjectSlugs) {
    if (!allowedSlugs.has(slug)) {
      return {
        valid: false,
        error: `Subject "${slug}" is not compatible with the selected class or group.`,
      };
    }
  }

  return { valid: true };
}