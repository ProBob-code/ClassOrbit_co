/**
 * ClassOrbit WhatsApp community — single source of truth for the invite link
 * and the pitch, shared by the join popup and the profile page card.
 */
export const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/HNFBKZndpqj2DVOFK627Pg';

export const COMMUNITY_BENEFITS = [
  'Swap ready-made prompts with other teachers',
  'Early access to new AI tools before they launch',
  'Ask questions and get help straight from the team',
  'Vote on what we build next',
] as const;

/**
 * localStorage keys for the occasional popups.
 *
 * The community invite and the feedback prompt must never stack, so they take
 * turns: the invite fires slightly earlier and, when it does, the feedback
 * prompt stands down for that day. The invite is capped (see CommunityModal)
 * so it can't monopolise the slot and starve feedback.
 */
export const POPUP_KEYS = {
  feedbackSubmitted: 'classorbit_feedback_submitted',
  feedbackDismissed: 'classorbit_feedback_last_dismissed',
  feedbackShownToday: 'classorbit_feedback_last_shown_today',
  communityJoined: 'classorbit_community_joined',
  communityDismissed: 'classorbit_community_last_dismissed',
  communityLastShown: 'classorbit_community_last_shown',
  communityShowCount: 'classorbit_community_show_count',
} as const;

/** True when `ms since epoch` (as a stored string) falls on today's date. */
export function isToday(stored: string | null): boolean {
  if (!stored) return false;
  const ts = parseInt(stored, 10);
  if (!Number.isFinite(ts)) return false;
  return new Date(ts).toDateString() === new Date().toDateString();
}
