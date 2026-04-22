/**
 * SkillForge — Quality Assessment Engine
 *
 * Scores a skill on 4 dimensions:
 *   1. Completeness (35%) — all required files and fields present
 *   2. Clarity (30%) — instructions clear, no ambiguity, proper structure
 *   3. Testability (20%) — examples provided, testable outcomes defined
 *   4. Compatibility (15%) — cross-platform markers, version constraints
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, extname } from 'path';
import { loadManifest, validateManifestFields, REQUIRED_FIELDS, OPTIONAL_FIELDS, QUALITY_WEIGHTS } from './schema.js';

// ─── Main Scoring Entry ─────────────────────────────────────────────────

export function assessSkill(dir) {
  const dirPath = resolve(dir);
  const manifest = loadManifest(dirPath);

  if (!manifest) {
    return {
      score: 0,
      grade: 'F',
      dimensions: { completeness: 0, clarity: 0, testability: 0, compatibility: 0 },
      issues: ['No skillforge.yaml found — not a valid skill directory'],
    };
  }

  const completeness = scoreCompleteness(dirPath, manifest);
  const clarity = scoreClarity(dirPath, manifest);
  const testability = scoreTestability(dirPath, manifest);
  const compatibility = scoreCompatibility(dirPath, manifest);

  const weightedScore =
    completeness.score * QUALITY_WEIGHTS.completeness +
    clarity.score * QUALITY_WEIGHTS.clarity +
    testability.score * QUALITY_WEIGHTS.testability +
    compatibility.score * QUALITY_WEIGHTS.compatibility;

  const totalScore = Math.round(weightedScore);
  const grade = scoreToGrade(totalScore);

  return {
    score: totalScore,
    grade,
    dimensions: {
      completeness: completeness.score,
      clarity: clarity.score,
      testability: testability.score,
      compatibility: compatibility.score,
    },
    issues: [
      ...completeness.issues,
      ...clarity.issues,
      ...testability.issues,
      ...compatibility.issues,
    ],
    manifest,
  };
}

// ─── Dimension: Completeness ────────────────────────────────────────────

function scoreCompleteness(dir, manifest) {
  const issues = [];
  let score = 100;

  // Check required manifest fields
  const { missing } = validateManifestFields(manifest);
  if (missing.length > 0) {
    score -= missing.length * 15;
    issues.push(`Missing required fields: ${missing.join(', ')}`);
  }

  // Check SKILL.md exists
  if (!existsSync(join(dir, 'SKILL.md'))) {
    score -= 20;
    issues.push('SKILL.md not found — skill instruction file is required');
  }

  // Check README exists
  if (!existsSync(join(dir, 'README.md'))) {
    score -= 5;
    issues.push('README.md not found — documentation recommended');
  }

  // Check examples directory
  if (!existsSync(join(dir, 'examples'))) {
    score -= 5;
    issues.push('examples/ directory not found — usage examples recommended');
  }

  // Check tests directory
  if (!existsSync(join(dir, 'tests'))) {
    score -= 5;
    issues.push('tests/ directory not found — test cases recommended');
  }

  return { score: Math.max(0, score), issues };
}

// ─── Dimension: Clarity ────────────────────────────────────────────────

function scoreClarity(dir, manifest) {
  const issues = [];
  let score = 100;

  // Check description length
  if (manifest.description && manifest.description.length < 20) {
    score -= 15;
    issues.push('Description too short (under 20 chars) — provide more context');
  }

  // Check SKILL.md quality
  const skillPath = join(dir, 'SKILL.md');
  if (existsSync(skillPath)) {
    const content = readFileSync(skillPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    if (lines.length < 5) {
      score -= 20;
      issues.push('SKILL.md is too short (under 5 lines) — add detailed instructions');
    }

    // Check for structured headers
    const headers = lines.filter(l => l.startsWith('#'));
    if (headers.length < 2) {
      score -= 10;
      issues.push('SKILL.md lacks structured headers — use ## sections for clarity');
    }

    // Check for ambiguity markers
    const ambiguityPatterns = [/maybe/i, /perhaps/i, /might/i, /probably/i, /todo:/i, /fixme:/i, /tbd/i];
    let ambiguityCount = 0;
    for (const pattern of ambiguityPatterns) {
      const matches = content.match(pattern);
      if (matches) ambiguityCount += matches.length;
    }
    if (ambiguityCount > 2) {
      score -= Math.min(20, ambiguityCount * 5);
      issues.push(`Found ${ambiguityCount} ambiguity markers (maybe/todo/tbd) — resolve them`);
    }

    // Check for code examples in SKILL.md
    if (!content.includes('```')) {
      score -= 10;
      issues.push('No code examples in SKILL.md — add usage examples');
    }
  } else {
    score = 0;
    issues.push('SKILL.md missing — cannot assess clarity');
  }

  return { score: Math.max(0, score), issues };
}

// ─── Dimension: Testability ─────────────────────────────────────────────

function scoreTestability(dir, manifest) {
  const issues = [];
  let score = 100;

  // Check for test files
  const testsDir = join(dir, 'tests');
  if (existsSync(testsDir) && statSync(testsDir).isDirectory()) {
    const testFiles = readdirSync(testsDir).filter(f =>
      f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.test.md')
    );
    if (testFiles.length === 0) {
      score -= 30;
      issues.push('tests/ directory exists but contains no test files');
    }
  } else {
    score -= 40;
    issues.push('No tests/ directory — testability cannot be verified');
  }

  // Check for examples
  const examplesDir = join(dir, 'examples');
  if (existsSync(examplesDir) && statSync(examplesDir).isDirectory()) {
    const exampleFiles = readdirSync(examplesDir);
    if (exampleFiles.length === 0) {
      score -= 15;
      issues.push('examples/ directory is empty');
    }
  } else {
    score -= 15;
    issues.push('No examples/ directory — examples improve testability');
  }

  // Check SKILL.md for testable outcomes
  const skillPath = join(dir, 'SKILL.md');
  if (existsSync(skillPath)) {
    const content = readFileSync(skillPath, 'utf-8').toLowerCase();
    const hasExpectedOutput = content.includes('expected') || content.includes('should') || content.includes('output');
    if (!hasExpectedOutput) {
      score -= 15;
      issues.push('SKILL.md lacks expected output descriptions — add "should" or "expected" statements');
    }
  }

  return { score: Math.max(0, score), issues };
}

// ─── Dimension: Compatibility ───────────────────────────────────────────

function scoreCompatibility(dir, manifest) {
  const issues = [];
  let score = 100;

  // Check platforms field
  if (!manifest.platforms || manifest.platforms.length === 0) {
    score -= 30;
    issues.push('No platforms specified — declare target platforms');
  } else if (manifest.platforms.length === 1 && manifest.platforms[0] === 'generic') {
    score -= 10;
    issues.push('Only "generic" platform declared — specify concrete platforms for better compatibility');
  }

  // Check compatibility constraints
  if (!manifest.compatibility || !manifest.compatibility.minAgentVersion) {
    score -= 10;
    issues.push('No minAgentVersion specified — add compatibility constraints');
  }

  // Check for platform-specific adapters
  const adaptersDir = join(dir, 'adapters');
  if (manifest.platforms && manifest.platforms.length > 1) {
    if (!existsSync(adaptersDir)) {
      score -= 15;
      issues.push('Multiple platforms declared but no adapters/ directory — add platform-specific code');
    }
  }

  return { score: Math.max(0, score), issues };
}

// ─── Grade Calculation ──────────────────────────────────────────────────

function scoreToGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
