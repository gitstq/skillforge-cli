/**
 * Registry Tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { searchSkills, registerSkill, unregisterSkill, getSkillInfo, listSkills, CURATED_SKILLS, ensureRegistry } from '../src/registry/registry.js';
import { saveManifest } from '../src/core/schema.js';

const TEST_DIR = join(process.cwd(), '__test_reg_tmp__');
const ORIGINAL_ENV = process.env.SKILLFORGE_REGISTRY;

function setupTestSkill(name = 'reg-test-skill') {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  mkdirSync(TEST_DIR, { recursive: true });
  const manifest = {
    name,
    version: '1.0.0',
    description: 'Registry test skill',
    author: 'tester',
    platforms: ['openclaw'],
    category: 'testing',
    keywords: ['test'],
  };
  saveManifest(TEST_DIR, manifest);
  writeFileSync(join(TEST_DIR, 'SKILL.md'), '# Test\n', 'utf-8');
}

beforeEach(() => {
  const tmpReg = join(process.cwd(), '__test_registry__');
  process.env.SKILLFORGE_REGISTRY = tmpReg;
  if (existsSync(tmpReg)) rmSync(tmpReg, { recursive: true });
});

afterEach(() => {
  process.env.SKILLFORGE_REGISTRY = ORIGINAL_ENV;
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  const tmpReg = join(process.cwd(), '__test_registry__');
  if (existsSync(tmpReg)) rmSync(tmpReg, { recursive: true });
});

describe('Registry — CURATED_SKILLS', () => {
  it('has curated skills available', () => {
    expect(CURATED_SKILLS.length).toBeGreaterThan(5);
  });

  it('each curated skill has required fields', () => {
    for (const skill of CURATED_SKILLS) {
      expect(skill.name).toBeTruthy();
      expect(skill.version).toBeTruthy();
      expect(skill.description).toBeTruthy();
      expect(skill.platforms.length).toBeGreaterThan(0);
    }
  });
});

describe('Registry — registerSkill', () => {
  it('registers a skill to local registry', () => {
    setupTestSkill();
    const entry = registerSkill(TEST_DIR);
    expect(entry.name).toBe('reg-test-skill');
    expect(entry.version).toBe('1.0.0');
  });

  it('throws for invalid directory', () => {
    const badDir = join(process.cwd(), '__nonexistent__');
    expect(() => registerSkill(badDir)).toThrow();
  });
});

describe('Registry — searchSkills', () => {
  it('finds skills by name', () => {
    setupTestSkill('searchable-skill');
    registerSkill(TEST_DIR);
    const results = searchSkills('searchable');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('searchable-skill');
  });

  it('finds skills by keyword', () => {
    setupTestSkill('kw-skill');
    registerSkill(TEST_DIR);
    const results = searchSkills('test');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty for no match', () => {
    const results = searchSkills('zzz-nonexistent-xyz');
    expect(results.length).toBe(0);
  });
});

describe('Registry — unregisterSkill', () => {
  it('removes a skill from registry', () => {
    setupTestSkill('remove-me');
    registerSkill(TEST_DIR);
    const removed = unregisterSkill('remove-me');
    expect(removed).toBe(true);
  });

  it('returns false for non-existent skill', () => {
    expect(unregisterSkill('non-existent')).toBe(false);
  });
});

describe('Registry — listSkills', () => {
  it('lists registered skills', () => {
    setupTestSkill('list-skill');
    registerSkill(TEST_DIR);
    const skills = listSkills();
    expect(skills.length).toBeGreaterThan(0);
  });
});
