import { Subject } from '@/types';

// `group` drives the section headers in the builder's Subject Area menu.
// Order matters: options are grouped in the order they appear here.
export const subjects: Subject[] = [
  // ─── School ───
  { id: 'math', label: 'Math', icon: 'calculate', group: 'School Subjects' },
  { id: 'science', label: 'Science', icon: 'science', group: 'School Subjects' },
  { id: 'english', label: 'English', icon: 'translate', group: 'School Subjects' },
  { id: 'biology', label: 'Biology', icon: 'biotech', group: 'School Subjects' },
  { id: 'physics', label: 'Physics', icon: 'rocket_launch', group: 'School Subjects' },
  { id: 'chemistry', label: 'Chemistry', icon: 'experiment', group: 'School Subjects' },
  { id: 'history', label: 'History', icon: 'history_edu', group: 'School Subjects' },
  { id: 'geography', label: 'Geography', icon: 'public', group: 'School Subjects' },
  { id: 'commerce', label: 'Commerce', icon: 'account_balance', group: 'School Subjects' },
  { id: 'computer_science', label: 'Computer Science', icon: 'computer', group: 'School Subjects' },
  { id: 'social_studies', label: 'Social Studies', icon: 'groups', group: 'School Subjects' },
  { id: 'environmental_science', label: 'Environmental Science', icon: 'eco', group: 'School Subjects' },
  { id: 'languages', label: 'Languages / Literature', icon: 'translate', group: 'School Subjects' },
  { id: 'art', label: 'Art & Design', icon: 'palette', group: 'School Subjects' },
  { id: 'music', label: 'Music', icon: 'music_note', group: 'School Subjects' },
  { id: 'physical_education', label: 'Physical Education', icon: 'fitness_center', group: 'School Subjects' },

  // ─── Business & management ───
  { id: 'business_studies', label: 'Business Studies', icon: 'business_center', group: 'Business & Management' },
  { id: 'mba', label: 'MBA / Management', icon: 'business_center', group: 'Business & Management' },
  { id: 'accounting', label: 'Accounting', icon: 'account_balance', group: 'Business & Management' },
  { id: 'finance', label: 'Finance & Banking', icon: 'payments', group: 'Business & Management' },
  { id: 'economics', label: 'Economics', icon: 'trending_up', group: 'Business & Management' },
  { id: 'marketing', label: 'Marketing', icon: 'campaign', group: 'Business & Management' },
  { id: 'human_resources', label: 'Human Resources', icon: 'groups', group: 'Business & Management' },
  { id: 'entrepreneurship', label: 'Entrepreneurship', icon: 'rocket_launch', group: 'Business & Management' },

  // ─── Engineering & technology ───
  { id: 'engineering', label: 'Engineering (General)', icon: 'engineering', group: 'Engineering & Technology' },
  { id: 'mechanical_engineering', label: 'Mechanical Engineering', icon: 'engineering', group: 'Engineering & Technology' },
  { id: 'civil_engineering', label: 'Civil Engineering', icon: 'engineering', group: 'Engineering & Technology' },
  { id: 'electrical_engineering', label: 'Electrical & Electronics', icon: 'engineering', group: 'Engineering & Technology' },
  { id: 'data_science', label: 'Data Science & AI', icon: 'computer', group: 'Engineering & Technology' },
  { id: 'information_technology', label: 'Information Technology', icon: 'computer', group: 'Engineering & Technology' },
  { id: 'architecture', label: 'Architecture', icon: 'architecture', group: 'Engineering & Technology' },

  // ─── Health & life sciences ───
  { id: 'medicine', label: 'Medicine (MBBS)', icon: 'medical_services', group: 'Health & Life Sciences' },
  { id: 'nursing', label: 'Nursing', icon: 'medical_services', group: 'Health & Life Sciences' },
  { id: 'pharmacy', label: 'Pharmacy', icon: 'medication', group: 'Health & Life Sciences' },
  { id: 'biotechnology', label: 'Biotechnology', icon: 'biotech', group: 'Health & Life Sciences' },
  { id: 'agriculture', label: 'Agriculture', icon: 'eco', group: 'Health & Life Sciences' },

  // ─── Humanities & social sciences ───
  { id: 'psychology', label: 'Psychology', icon: 'psychology', group: 'Humanities & Social Sciences' },
  { id: 'sociology', label: 'Sociology', icon: 'groups', group: 'Humanities & Social Sciences' },
  { id: 'political_science', label: 'Political Science', icon: 'account_balance', group: 'Humanities & Social Sciences' },
  { id: 'philosophy', label: 'Philosophy', icon: 'menu_book', group: 'Humanities & Social Sciences' },
  { id: 'law', label: 'Law', icon: 'gavel', group: 'Humanities & Social Sciences' },
  { id: 'journalism', label: 'Journalism & Mass Comm.', icon: 'newspaper', group: 'Humanities & Social Sciences' },
  { id: 'education', label: 'Education / B.Ed.', icon: 'school', group: 'Humanities & Social Sciences' },
  { id: 'hospitality', label: 'Hospitality & Tourism', icon: 'restaurant', group: 'Humanities & Social Sciences' },
  { id: 'statistics', label: 'Statistics', icon: 'calculate', group: 'Humanities & Social Sciences' },
];
