import { Grade, StudentLevel, Duration } from '@/types';

export const grades: Grade[] = [
  { id: 'grade_1', label: 'Grade 1' },
  { id: 'grade_2', label: 'Grade 2' },
  { id: 'grade_3', label: 'Grade 3' },
  { id: 'grade_4', label: 'Grade 4' },
  { id: 'grade_5', label: 'Grade 5' },
  { id: 'grade_6', label: 'Grade 6' },
  { id: 'grade_7', label: 'Grade 7' },
  { id: 'grade_8', label: 'Grade 8' },
  { id: 'grade_9', label: 'Grade 9' },
  { id: 'grade_10', label: 'Grade 10' },
  { id: 'grade_11', label: 'Grade 11' },
  { id: 'grade_12', label: 'Grade 12' },
  { id: 'college', label: 'College' },
  { id: 'adult_learning', label: 'Adult Learning' },
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
