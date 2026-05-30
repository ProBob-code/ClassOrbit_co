// ===== Core Types =====

export interface TeacherInput {
  contentType: string;
  grade: string;
  subject: string;
  topic: string;
  teachingStyles: string[];
  duration: string;
  studentLevel: string;
  selectedTools: string[];
  platformRequirements?: string;
}

export interface AITool {
  id: string;
  tool_name: string;
  tool_url: string;
  tool_logo?: string;
  category: ToolCategory;
  supported_outputs: string[];
  prompt_template?: string;
  description: string;
  is_free: boolean;
  pricing_info?: string;
  active: boolean;
  sort_order: number;
  created_at?: string;
}

export type ToolCategory =
  | 'text'
  | 'visual'
  | 'presentation'
  | 'audio'
  | 'video'
  | 'research'
  | 'image';

export interface ToolPrompts {
  [toolId: string]: {
    toolName: string;
    toolUrl: string;
    toolLogo?: string;
    prompt: string;
    category: ToolCategory;
  };
}

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface PromptRecord {
  id: string;
  user_id: string;
  content_type: string;
  grade: string | null;
  subject: string | null;
  topic: string | null;
  teaching_styles: string[];
  duration: string | null;
  student_level: string | null;
  generated_prompts: ToolPrompts;
  is_favorite: boolean;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  folder_name: string;
  parent_id: string | null;
  icon: string;
  created_at: string;
}

export interface FileItem {
  id: string;
  user_id: string;
  folder_id: string | null;
  file_name: string;
  file_url: string | null;
  file_type: FileType;
  file_size: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type FileType =
  | 'pdf'
  | 'ppt'
  | 'pptx'
  | 'docx'
  | 'txt'
  | 'png'
  | 'jpg'
  | 'mp4'
  | 'link'
  | 'prompt';

export interface ContentType {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface Subject {
  id: string;
  label: string;
  icon: string;
}

export interface Grade {
  id: string;
  label: string;
}

export interface TeachingStyle {
  id: string;
  label: string;
  description: string;
}

export interface StudentLevel {
  id: string;
  label: string;
}

export interface Duration {
  id: string;
  label: string;
}
