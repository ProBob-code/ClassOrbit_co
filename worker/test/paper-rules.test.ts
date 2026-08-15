import { describe, it, expect } from 'vitest';
import { getRegenerationStyle, getAssessmentInstructions } from '../src/lib/paper-rules';

describe('getRegenerationStyle', () => {
  it('maps language and qualitative subjects to skill mapping', () => {
    for (const s of ['English', 'Languages / Literature', 'History', 'Philosophy', 'Law']) {
      expect(getRegenerationStyle(s)).toBe('skill_mapped');
    }
  });

  it('maps quantitative subjects to value variation', () => {
    for (const s of ['Math', 'Science', 'Physics', 'Chemistry', 'Statistics', 'Accounting']) {
      expect(getRegenerationStyle(s)).toBe('value_varied');
    }
  });

  // "Political Science" and "Social Studies" both contain a broader needle, so
  // the ordering of subjectStyles is what keeps them out of value variation.
  it('does not let a broader needle swallow a more specific label', () => {
    expect(getRegenerationStyle('Political Science')).toBe('skill_mapped');
    expect(getRegenerationStyle('Social Studies')).toBe('skill_mapped');
    expect(getRegenerationStyle('Computer Science')).toBe('value_varied');
    expect(getRegenerationStyle('Environmental Science')).toBe('value_varied');
  });

  it('is case-insensitive and matches the builder label verbatim', () => {
    expect(getRegenerationStyle('MATHEMATICS')).toBe('value_varied');
    expect(getRegenerationStyle('english')).toBe('skill_mapped');
  });

  // Teachers can type their own subject, and an empty draft starts blank.
  it('falls back to skill mapping for unknown or empty subjects', () => {
    expect(getRegenerationStyle('Underwater Basket Weaving')).toBe('skill_mapped');
    expect(getRegenerationStyle('')).toBe('skill_mapped');
  });
});

describe('getAssessmentInstructions', () => {
  const base = { subject: 'Math', studentLevel: 'Intermediate', hasAttachment: true };

  it('gives a question paper in a quantitative subject the value-variation policy', () => {
    const out = getAssessmentInstructions({ ...base, contentType: 'question_paper' });
    expect(out).toContain('VALUE VARIATION');
    expect(out).not.toContain('SKILL MAPPING');
    expect(out).toContain('randomise the surface details');
  });

  it('gives a question paper in a language subject the skill-mapping policy', () => {
    const out = getAssessmentInstructions({ ...base, subject: 'English', contentType: 'question_paper' });
    expect(out).toContain('SKILL MAPPING');
    expect(out).not.toContain('VALUE VARIATION');
    expect(out).toContain('underlying skill');
  });

  it('always asks a question paper for a companion answer key', () => {
    for (const hasAttachment of [true, false]) {
      const out = getAssessmentInstructions({ ...base, hasAttachment, contentType: 'question_paper' });
      expect(out).toContain('answer key');
    }
  });

  it('tells the answer key type to identify what was attached', () => {
    const out = getAssessmentInstructions({ ...base, contentType: 'answer_key' });
    expect(out).toContain('sample ANSWER KEY');
    expect(out).toContain('QUESTION PAPER');
  });

  it('drops the regeneration policy when nothing is attached', () => {
    for (const contentType of ['question_paper', 'answer_key']) {
      const out = getAssessmentInstructions({ ...base, hasAttachment: false, contentType });
      expect(out).not.toContain('REGENERATION POLICY');
    }
  });

  it('carries the difficulty target into the attached-sample instructions', () => {
    const out = getAssessmentInstructions({ ...base, studentLevel: 'Advanced', contentType: 'question_paper' });
    expect(out).toContain('"Advanced"');
  });
});
