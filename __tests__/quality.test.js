/**
 * Quality Assessment Engine Tests
 */

import { describe, it, expect, afterEach } from '@jest/globals';
import { existsSync, mkdirSync, writeFileSync, rmSync, unlinkSync } from 'fs';
import { join } from 'path';
import { assessSkill } from '../src/core/quality.js';
import { saveManifest } from '../src/core/schema.js';

const TEST_DIR = join(process.cwd(), '__test_skill_tmp__');

function createTestSkill(overrides = {}) {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  mkdirSync(TEST_DIR, { recursive: true });
  mkdirSync(join(TEST_DIR, 'tests'), { recursive: true });
  mkdirSync(join(TEST_DIR, 'examples'), { recursive: true });

  const manifest = {
    name: overrides.name || 'test-skill',
    version: overrides.version || '1.0.0',
    description: overrides.description || 'A well-described test skill for quality assessment',
    author: overrides.author || 'test-author',
    platforms: overrides.platforms || ['claude-code', 'openclaw'],
    category: overrides.category || 'coding',
    license: 'MIT',
    keywords: ['test'],
    compatibility: { minAgentVersion: '1.0.0' },
    files: { skill: 'SKILL.md', tests: 'tests/', examples: 'examples/' },
    ...overrides.manifestOverrides,
  };

  saveManifest(TEST_DIR, manifest);

  const skillContent = overrides.skillContent || `# test-skill

A well-described test skill for quality assessment

## Overview

This is a comprehensive test skill with proper structure.

## Instructions

### Step 1: Initialize
- Load the configuration

### Step 2: Execute
- Process the input data

### Step 3: Output
- Return the results

## Examples

\`\`\`bash
skillforge test-skill --input data.txt
\`\`\`

## Expected Output

The skill should return:
- Processed data with proper formatting
- Error messages for invalid input

## Constraints

- Maximum input size: 10MB
- Supported formats: JSON, YAML
`;

  writeFileSync(join(TEST_DIR, 'SKILL.md'), skillContent, 'utf-8');
  writeFileSync(join(TEST_DIR, 'README.md'), '# test-skill\n\nTest description\n', 'utf-8');
  writeFileSync(join(TEST_DIR, 'tests', 'test-skill.test.md'), '# Test\n\nShould pass\n', 'utf-8');
  writeFileSync(join(TEST_DIR, 'examples', 'basic.md'), '# Example\n\nBasic usage\n', 'utf-8');

  return manifest;
}

afterEach(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
});

describe('Quality — assessSkill', () => {
  it('gives high score to a complete, well-structured skill', () => {
    createTestSkill();
    const result = assessSkill(TEST_DIR);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.grade).toMatch(/^[A-C]$/);
    expect(result.manifest).toBeDefined();
  });

  it('gives score of 0 for directory without manifest', () => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
    const result = assessSkill(TEST_DIR);
    expect(result.score).toBe(0);
    expect(result.grade).toBe('F');
  });

  it('penalizes missing SKILL.md', () => {
    createTestSkill();
    const skillPath = join(TEST_DIR, 'SKILL.md');
    if (existsSync(skillPath)) unlinkSync(skillPath);
    const result = assessSkill(TEST_DIR);
    expect(result.dimensions.completeness).toBeLessThanOrEqual(80);
  });

  it('penalizes short descriptions', () => {
    createTestSkill({ description: 'Short' });
    const result = assessSkill(TEST_DIR);
    expect(result.dimensions.clarity).toBeLessThan(100);
  });

  it('penalizes ambiguous language in SKILL.md', () => {
    createTestSkill({
      skillContent: `# test-skill\n\nMaybe this works. Perhaps it should do something. TODO: implement. FIXME: broken. TBD.\n\n## Step 1\nMaybe process the input.\n`,
    });
    const result = assessSkill(TEST_DIR);
    expect(result.dimensions.clarity).toBeLessThan(80);
  });

  it('rewards multi-platform compatibility', () => {
    createTestSkill({ platforms: ['claude-code', 'codex', 'cursor', 'openclaw'] });
    const result = assessSkill(TEST_DIR);
    expect(result.dimensions.compatibility).toBeGreaterThan(50);
  });

  it('penalizes generic-only platform', () => {
    createTestSkill({ platforms: ['generic'] });
    const result = assessSkill(TEST_DIR);
    expect(result.dimensions.compatibility).toBeLessThan(100);
  });

  it('provides issues array with actionable feedback', () => {
    createTestSkill();
    const result = assessSkill(TEST_DIR);
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it('includes all four dimensions', () => {
    createTestSkill();
    const result = assessSkill(TEST_DIR);
    expect(result.dimensions).toHaveProperty('completeness');
    expect(result.dimensions).toHaveProperty('clarity');
    expect(result.dimensions).toHaveProperty('testability');
    expect(result.dimensions).toHaveProperty('compatibility');
  });
});
