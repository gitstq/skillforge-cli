/**
 * Schema Core Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateManifestFields,
  normalizePlatforms,
  createDefaultManifest,
  REQUIRED_FIELDS,
  PLATFORMS,
  CATEGORIES,
  PLATFORM_ALIASES,
} from '../src/core/schema.js';

describe('Schema — validateManifestFields', () => {
  it('returns valid for complete manifest', () => {
    const manifest = { name: 'test', version: '1.0.0', description: 'A test', author: 'me', platforms: ['generic'] };
    const result = validateManifestFields(manifest);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('detects missing required fields', () => {
    const manifest = { name: 'test' };
    const result = validateManifestFields(manifest);
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it('detects all missing fields', () => {
    const manifest = {};
    const result = validateManifestFields(manifest);
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(expect.arrayContaining(REQUIRED_FIELDS));
  });
});

describe('Schema — normalizePlatforms', () => {
  it('normalizes alias to full platform name', () => {
    expect(normalizePlatforms(['cc'])).toEqual(['claude-code']);
    expect(normalizePlatforms(['oc'])).toEqual(['openclaw']);
    expect(normalizePlatforms(['cx'])).toEqual(['codex']);
    expect(normalizePlatforms(['cr'])).toEqual(['cursor']);
  });

  it('handles string input', () => {
    expect(normalizePlatforms('claude')).toEqual(['claude-code']);
  });

  it('passes through unknown platforms', () => {
    expect(normalizePlatforms(['custom'])).toEqual(['custom']);
  });

  it('handles multiple platforms', () => {
    const result = normalizePlatforms(['cc', 'oc', 'codex']);
    expect(result).toEqual(['claude-code', 'openclaw', 'codex']);
  });
});

describe('Schema — createDefaultManifest', () => {
  it('creates manifest with required fields', () => {
    const m = createDefaultManifest({ name: 'my-skill' });
    expect(m.name).toBe('my-skill');
    expect(m.version).toBe('1.0.0');
    expect(m.description).toContain('my-skill');
    expect(m.platforms).toEqual(['generic']);
  });

  it('uses provided values', () => {
    const m = createDefaultManifest({
      name: 'cool-skill',
      description: 'Very cool',
      author: 'alice',
      platforms: ['claude-code'],
      category: 'coding',
    });
    expect(m.name).toBe('cool-skill');
    expect(m.description).toBe('Very cool');
    expect(m.author).toBe('alice');
    expect(m.platforms).toEqual(['claude-code']);
    expect(m.category).toBe('coding');
  });
});

describe('Schema — constants', () => {
  it('has correct platform identifiers', () => {
    expect(PLATFORMS.CLAUDE_CODE).toBe('claude-code');
    expect(PLATFORMS.CODEX).toBe('codex');
    expect(PLATFORMS.CURSOR).toBe('cursor');
    expect(PLATFORMS.OPENCLAW).toBe('openclaw');
    expect(PLATFORMS.GENERIC).toBe('generic');
  });

  it('has categories array', () => {
    expect(CATEGORIES.length).toBeGreaterThan(5);
    expect(CATEGORIES).toContain('coding');
    expect(CATEGORIES).toContain('other');
  });

  it('has platform aliases', () => {
    expect(PLATFORM_ALIASES['cc']).toBe('claude-code');
    expect(PLATFORM_ALIASES['claude']).toBe('claude-code');
    expect(PLATFORM_ALIASES['oc']).toBe('openclaw');
  });
});
