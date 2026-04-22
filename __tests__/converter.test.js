/**
 * Cross-Platform Converter Tests
 */

import { describe, it, expect, afterEach } from '@jest/globals';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { convertSkill, packageForAllPlatforms, getAdapter, getAllAdapters } from '../src/adapters/converter.js';
import { saveManifest, PLATFORMS } from '../src/core/schema.js';

const TEST_DIR = join(process.cwd(), '__test_convert_tmp__');
const OUTPUT_DIR = join(process.cwd(), '__test_convert_out__');

function setupTestSkill() {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  mkdirSync(TEST_DIR, { recursive: true });

  const manifest = {
    name: 'convert-test',
    version: '1.0.0',
    description: 'A test skill for conversion',
    author: 'tester',
    platforms: ['claude-code', 'openclaw'],
    category: 'testing',
    license: 'MIT',
    keywords: ['test'],
    compatibility: { minAgentVersion: '1.0.0' },
    files: { skill: 'SKILL.md' },
  };

  saveManifest(TEST_DIR, manifest);
  writeFileSync(join(TEST_DIR, 'SKILL.md'), '# convert-test\n\nTest instructions\n', 'utf-8');
}

afterEach(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  if (existsSync(OUTPUT_DIR)) rmSync(OUTPUT_DIR, { recursive: true });
});

describe('Converter — getAdapter', () => {
  it('returns adapter for known platform', () => {
    const adapter = getAdapter(PLATFORMS.CLAUDE_CODE);
    expect(adapter).not.toBeNull();
    expect(adapter.name).toBe('Claude Code');
  });

  it('returns null for unknown platform', () => {
    expect(getAdapter('unknown-platform')).toBeNull();
  });

  it('has adapters for all platforms', () => {
    for (const p of Object.values(PLATFORMS)) {
      expect(getAdapter(p)).not.toBeNull();
    }
  });
});

describe('Converter — getAllAdapters', () => {
  it('returns object with all platform keys', () => {
    const adapters = getAllAdapters();
    expect(Object.keys(adapters).length).toBeGreaterThanOrEqual(5);
    expect(adapters).toHaveProperty('claude-code');
    expect(adapters).toHaveProperty('codex');
    expect(adapters).toHaveProperty('cursor');
    expect(adapters).toHaveProperty('openclaw');
    expect(adapters).toHaveProperty('generic');
  });
});

describe('Converter — convertSkill', () => {
  it('converts to claude-code format', () => {
    setupTestSkill();
    const result = convertSkill(TEST_DIR, PLATFORMS.CLAUDE_CODE, OUTPUT_DIR);
    expect(result.success !== false).toBe(true);
    expect(result.platform).toBe('claude-code');
    expect(existsSync(join(result.outputDir, 'SKILL.md'))).toBe(true);
  });

  it('converts to cursor format (.cursorrules)', () => {
    setupTestSkill();
    const result = convertSkill(TEST_DIR, PLATFORMS.CURSOR, OUTPUT_DIR);
    expect(result.platform).toBe('cursor');
    expect(existsSync(join(result.outputDir, '.cursorrules'))).toBe(true);
  });

  it('converts to openclaw format', () => {
    setupTestSkill();
    const result = convertSkill(TEST_DIR, PLATFORMS.OPENCLAW, OUTPUT_DIR);
    expect(result.platform).toBe('openclaw');
  });

  it('throws for missing manifest', () => {
    const emptyDir = join(process.cwd(), '__test_empty__');
    if (existsSync(emptyDir)) rmSync(emptyDir, { recursive: true });
    mkdirSync(emptyDir, { recursive: true });
    expect(() => convertSkill(emptyDir, PLATFORMS.CLAUDE_CODE)).toThrow('No skillforge.yaml');
    rmSync(emptyDir, { recursive: true });
  });

  it('throws for unknown platform', () => {
    setupTestSkill();
    expect(() => convertSkill(TEST_DIR, 'bad-platform')).toThrow('Unknown platform');
  });
});

describe('Converter — packageForAllPlatforms', () => {
  it('generates packages for all platforms', () => {
    setupTestSkill();
    const results = packageForAllPlatforms(TEST_DIR, OUTPUT_DIR);
    expect(results.length).toBeGreaterThan(0);
    const successCount = results.filter(r => r.success).length;
    expect(successCount).toBeGreaterThanOrEqual(3);
  });
});
