import { Grade, StudentLevel, Duration } from '@/types';

export const grades: Grade[] = [
  { id: 'kindergarten', label: 'Kindergarten / Pre-K', group: 'School' },
  { id: 'grade_1', label: 'Grade 1', group: 'School' },
  { id: 'grade_2', label: 'Grade 2', group: 'School' },
  { id: 'grade_3', label: 'Grade 3', group: 'School' },
  { id: 'grade_4', label: 'Grade 4', group: 'School' },
  { id: 'grade_5', label: 'Grade 5', group: 'School' },
  { id: 'grade_6', label: 'Grade 6', group: 'School' },
  { id: 'grade_7', label: 'Grade 7', group: 'School' },
  { id: 'grade_8', label: 'Grade 8', group: 'School' },
  { id: 'grade_9', label: 'Grade 9', group: 'School' },
  { id: 'grade_10', label: 'Grade 10', group: 'School' },
  { id: 'grade_11', label: 'Grade 11', group: 'School' },
  { id: 'grade_12', label: 'Grade 12', group: 'School' },
  { id: 'undergrad_year_1', label: 'Undergraduate — Year 1', group: 'Higher Education' },
  { id: 'undergrad_year_2', label: 'Undergraduate — Year 2', group: 'Higher Education' },
  { id: 'undergrad_year_3', label: 'Undergraduate — Year 3', group: 'Higher Education' },
  { id: 'undergrad_year_4', label: 'Undergraduate — Year 4', group: 'Higher Education' },
  { id: 'postgraduate', label: 'Postgraduate / Masters', group: 'Higher Education' },
  { id: 'doctoral', label: 'Doctoral / PhD', group: 'Higher Education' },
  { id: 'college', label: 'College (General)', group: 'Higher Education' },
  { id: 'professional_certification', label: 'Professional Certification', group: 'Professional' },
  { id: 'corporate_training', label: 'Corporate Training', group: 'Professional' },
  { id: 'competitive_exam', label: 'Competitive Exam Prep', group: 'Professional' },
  { id: 'adult_learning', label: 'Adult Learning', group: 'Professional' },
];

export const studentLevels: StudentLevel[] = [
  { id: 'weak', label: 'Weak Students' },
  { id: 'average', label: 'Average' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'mixed', label: 'Mixed' },
];

export const durations: Duration[] = [
  { id: '10_mins', label: '10 mins' },
  { id: '20_mins', label: '20 mins' },
  { id: '40_mins', label: '40 mins' },
  { id: '1_hour', label: '1 hour' },
];
