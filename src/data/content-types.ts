import { ContentType } from '@/types';

/**
 * NEW badges and the launch announcement both stop showing after this date, so
 * the release stops shouting on its own. Push it out when the next feature
 * ships rather than leaving badges up indefinitely.
 */
export const NEW_CONTENT_UNTIL = new Date('2026-10-15T00:00:00Z');

export const isNewContentLive = () => new Date() < NEW_CONTENT_UNTIL;

export const contentTypes: ContentType[] = [
  { id: 'quiz', label: 'Quiz', icon: 'quiz', description: 'Multiple choice, fill-in-the-blank, or mixed-format assessments' },
  { id: 'ppt', label: 'PPT', icon: 'slideshow', description: 'Slide-based presentations with key points and visuals' },
  { id: 'lesson_plan', label: 'Lesson Plan', icon: 'menu_book', description: 'Structured lesson plans with objectives, activities, and assessments' },
  { id: 'question_paper', label: 'Question Paper', icon: 'description', description: 'Formal exam or test papers with marking schemes', is_new: true },
  { id: 'answer_key', label: 'Answer Key', icon: 'key', description: 'Marking schemes and model answers, matched to a sample key', is_new: true },
  { id: 'worksheet', label: 'Worksheet', icon: 'assignment', description: 'Practice worksheets with exercises and problems' },
  { id: 'story', label: 'Story', icon: 'auto_stories', description: 'Educational stories and narratives for classroom use' },
  { id: 'homework', label: 'Homework', icon: 'home_work', description: 'Take-home assignments and practice sets' },
  { id: 'flashcards', label: 'Flashcards', icon: 'style', description: 'Study cards for key terms, concepts, and definitions' },
  { id: 'classroom_activity', label: 'Classroom Activity', icon: 'groups', description: 'Interactive in-class activities and group exercises' },
  { id: 'debate', label: 'Debate', icon: 'forum', description: 'Structured debate topics with pro/con arguments' },
  { id: 'interactive_game', label: 'Interactive Game', icon: 'sports_esports', description: 'Educational games and gamified learning activities' },
  { id: 'video_script', label: 'Video Script', icon: 'videocam', description: 'Scripts for educational videos and tutorials' },
  { id: 'rubric', label: 'Rubric', icon: 'grading', description: 'Assessment rubrics with criteria and performance levels' },
  { id: 'notes', label: 'Notes', icon: 'note', description: 'Comprehensive study notes and summaries' },
];
