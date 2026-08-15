/**
 * Regeneration rules for the assessment content types (Question Paper, Answer
 * Key), where the teacher attaches a sample and expects a fresh paper built to
 * the same blueprint.
 *
 * "Fresh" means different things by subject. In a language subject, reusing a
 * question is worthless — a pupil who memorised the sample gains an unfair
 * advantage — so each question has to be rebuilt around the skill it assesses.
 * In a quantitative subject the opposite holds: the same question with new
 * numbers is exactly what a teacher wants, and inventing new questions each
 * time drifts away from the syllabus the sample was calibrated to.
 */

export type RegenerationStyle = 'skill_mapped' | 'value_varied';

/**
 * Matched in order, most specific first — several labels contain a broader
 * term ("Political Science", "Computer Science", "Social Studies"). The
 * subject arrives as a free-text label (the builder lets teachers type their
 * own), so this matches on substrings rather than ids.
 */
const subjectStyles: [string, RegenerationStyle][] = [
  ['political science', 'skill_mapped'],
  ['social studies', 'skill_mapped'],
  ['computer', 'value_varied'],
  ['data science', 'value_varied'],
  ['information technology', 'value_varied'],
  ['environmental', 'value_varied'],
  ['math', 'value_varied'],
  ['statistics', 'value_varied'],
  ['physics', 'value_varied'],
  ['chemistry', 'value_varied'],
  ['biology', 'value_varied'],
  ['biotech', 'value_varied'],
  ['science', 'value_varied'],
  ['engineering', 'value_varied'],
  ['architecture', 'value_varied'],
  ['account', 'value_varied'],
  ['finance', 'value_varied'],
  ['economics', 'value_varied'],
  ['commerce', 'value_varied'],
  ['pharmacy', 'value_varied'],
  ['medicine', 'value_varied'],
  ['nursing', 'value_varied'],
  ['agriculture', 'value_varied'],
];

/**
 * Anything unrecognised — including a subject the teacher typed themselves —
 * falls back to skill mapping, which never reuses a question and so is the
 * safe default for an unknown paper.
 */
export function getRegenerationStyle(subject: string): RegenerationStyle {
  const s = (subject || '').toLowerCase();
  return subjectStyles.find(([needle]) => s.includes(needle))?.[1] ?? 'skill_mapped';
}

const SKILL_MAPPED_POLICY = `REGENERATION POLICY — SKILL MAPPING (this is a language / qualitative subject):
   - For EVERY question in the attached paper, first identify the underlying skill it assesses (for example: "understanding the explicit meaning of a word or phrase in context", "inferring a character's motive", "identifying the author's tone", "summarising a passage in one's own words").
   - Then write a NEW question that assesses that exact same skill on fresh content — a different passage, extract, word, sentence or stimulus.
   - Do NOT reproduce the original wording, passage, extract or answer options. A student who has memorised the attached paper must gain no advantage whatsoever.
   - Keep the skill coverage identical: the same skills, in the same proportion and the same number of questions each, as the attached paper.`;

const VALUE_VARIED_POLICY = `REGENERATION POLICY — VALUE VARIATION (this is a quantitative / analytical subject):
   - Reusing a question from the attached paper IS allowed and expected, provided its numbers change. Alter the given values, quantities, units and figures so that the final answer differs from the original.
   - Keep the concept, the solution method, the difficulty and the marks allocation of the original question intact.
   - For case-based or scenario-based questions, keep the overall case or scenario, but randomise the surface details — names of people, places, dates, and the minor parameters — so the case reads as fresh.
   - Where a question carries no numeric values to vary (definitions, reasoning, diagram labelling, derivations), do not reproduce it verbatim: re-ask the same concept using a different example, context or phrasing.
   - Verify that every varied question remains solvable and that the new values produce a clean, grade-appropriate answer — no negative lengths, no impossible concentrations, no eight-decimal results.`;

/**
 * Instructions appended for Question Paper and Answer Key content types.
 * `hasAttachment` says whether the teacher pasted a sample below the prompt;
 * without one there is no blueprint to follow, so only the companion answer
 * key guidance applies.
 */
export function getAssessmentInstructions(opts: {
  contentType: string;
  subject: string;
  studentLevel: string;
  hasAttachment: boolean;
}): string {
  const { contentType, subject, studentLevel, hasAttachment } = opts;
  const isAnswerKey = contentType === 'answer_key';

  if (!hasAttachment) {
    return isAnswerKey
      ? `
ANSWER KEY REQUIREMENTS:
The prompts you generate MUST command the target AI to produce a complete answer key: the accepted answer for every question, worked steps for anything calculated, a mark-by-mark breakdown that sums to each question's marks, and acceptable alternative answers where more than one response earns full credit.
`
      : `
QUESTION PAPER REQUIREMENTS:
The prompts you generate MUST command the target AI to output the paper and, after it, a complete answer key covering every question, with worked steps and a mark-by-mark breakdown.
`;
  }

  const policy = getRegenerationStyle(subject) === 'skill_mapped'
    ? SKILL_MAPPED_POLICY
    : VALUE_VARIED_POLICY;

  if (isAnswerKey) {
    return `
ANSWER KEY REQUIREMENTS (a sample is attached):
The prompts you generate MUST command the target AI to:
1. Work out what the attached document is before doing anything else. It is either a sample ANSWER KEY (mirror its house style) or a QUESTION PAPER (write the key for it) — and it may be both, a paper followed by its key.
2. When a sample answer key is attached, copy its presentation exactly: the numbering scheme, how much working is shown per answer, the mark-by-mark split, the wording conventions ("Ans.", "Sol.", "Award 1 mark for…"), and the treatment of alternative acceptable answers.
3. Produce the key for the NEW paper, not for the attached one — every answer must match the question actually being asked.
4. State the accepted answer for every question, show the working for anything calculated, break the marks down so they sum to the marks printed against that question, and list acceptable alternatives where more than one response earns full credit.
5. Adjust rigour to the targeted level: "${studentLevel}".

   ${policy}
`;
  }

  return `
QUESTION PAPER REQUIREMENTS (a sample paper is attached):
The prompts you generate MUST command the target AI to:
1. Analyse the attached paper before writing anything: question formats, section structure, marks allocation, question count and rigour. Mirror that blueprint exactly in the new paper.
2. Adjust the cognitive complexity of the new questions to match the targeted level: "${studentLevel}".
3. Apply the regeneration policy below to every question, without exception.
4. Output a complete answer key after the paper. If a sample answer key is attached alongside the paper, mirror its format — numbering, depth of working, mark-by-mark split and wording conventions. Otherwise use a clear standard key with worked steps and a mark breakdown.

   ${policy}
`;
}
