import { TeacherInput, ToolPrompts } from '@/types';

// Keeps an in-progress prompt alive across navigation, tab switches and
// refreshes. Everything the builder needs to redraw itself lives here; it is
// written on every change (debounced) and read once on mount.

const KEY = 'classorbit_builder_draft_v1';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // a week-old draft is stale
// localStorage is ~5MB per origin and shared with the rest of the app, so the
// draft gets a hard ceiling. Parsed PDFs are what push it over.
const MAX_BYTES = 1_500_000;

export interface BuilderAttachment {
  name: string;
  size: number;
  content: string;
  type: string;
}

export interface BuilderDraft {
  savedAt: number;
  mode: 'free' | 'guided';
  viewState: 'building' | 'ready';
  formData: TeacherInput;
  freePrompt: string;
  freeTools: string[];
  attachments: BuilderAttachment[];
  generatedPrompts: ToolPrompts | null;
  activeTab: string;
  customSubjectMode: boolean;
  customGradeMode: boolean;
  customCurriculumMode: boolean;
  customInstitutionMode: boolean;
}

export function loadDraft(): BuilderDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as BuilderDraft;
    if (!draft?.formData || typeof draft.savedAt !== 'number') return null;
    if (Date.now() - draft.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return draft;
  } catch {
    return null; // corrupt or unreadable — start clean rather than crash
  }
}

export function saveDraft(draft: Omit<BuilderDraft, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  const write = (payload: Omit<BuilderDraft, 'savedAt'>) => {
    const json = JSON.stringify({ ...payload, savedAt: Date.now() });
    if (json.length > MAX_BYTES) return false;
    localStorage.setItem(KEY, json);
    return true;
  };
  try {
    // Shed the heaviest fields first rather than losing the whole draft.
    if (write(draft)) return;
    if (write({ ...draft, attachments: [] })) return;
    write({ ...draft, attachments: [], generatedPrompts: null, viewState: 'building' });
  } catch {
    // Quota exceeded or storage blocked (private mode) — persistence is a
    // convenience, never a hard requirement.
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage blocked */
  }
}

/** True when the user has actually typed something worth restoring. */
export function draftHasContent(draft: Omit<BuilderDraft, 'savedAt'>): boolean {
  return Boolean(
    draft.formData.topic?.trim() ||
      draft.freePrompt.trim() ||
      draft.attachments.length > 0 ||
      draft.generatedPrompts
  );
}
