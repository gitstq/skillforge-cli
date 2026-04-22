/**
 * SkillForge — Core skill schema, format definition & utilities
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import YAML from 'yaml';

// ─── Skill Manifest Schema (skillforge.yaml) ────────────────────────────
export const SKILL_MANIFEST_FILE = 'skillforge.yaml';

export const REQUIRED_FIELDS = ['name', 'version', 'description', 'author', 'platforms'];

export const OPTIONAL_FIELDS = [
  'license', 'keywords', 'homepage', 'repository',
  'dependencies', 'compatibility', 'examples', 'tags',
  'minAgentVersion', 'category'
];

// ─── Platform Identifiers ───────────────────────────────────────────────
export const PLATFORMS = {
  CLAUDE_CODE: 'claude-code',
  CODEX: 'codex',
  CURSOR: 'cursor',
  OPENCLAW: 'openclaw',
  GENERIC: 'generic',
};

export const PLATFORM_ALIASES = {
  'claude': PLATFORMS.CLAUDE_CODE,
  'claude-code': PLATFORMS.CLAUDE_CODE,
  'cc': PLATFORMS.CLAUDE_CODE,
  'codex': PLATFORMS.CODEX,
  'cx': PLATFORMS.CODEX,
  'cursor': PLATFORMS.CURSOR,
  'cr': PLATFORMS.CURSOR,
  'openclaw': PLATFORMS.OPENCLAW,
  'oc': PLATFORMS.OPENCLAW,
  'generic': PLATFORMS.GENERIC,
  'all': 'all',
};

// ─── Skill Category Taxonomy ────────────────────────────────────────────
export const CATEGORIES = [
  'coding', 'writing', 'analysis', 'automation', 'data',
  'devops', 'security', 'testing', 'design', 'communication',
  'research', 'productivity', 'integration', 'other',
];

// ─── Quality Scoring Weights ────────────────────────────────────────────
export const QUALITY_WEIGHTS = {
  completeness: 0.35,
  clarity: 0.30,
  testability: 0.20,
  compatibility: 0.15,
};

// ─── Load / Save Manifest ───────────────────────────────────────────────

export function loadManifest(dir) {
  const filePath = join(resolve(dir), SKILL_MANIFEST_FILE);
  if (!existsSync(filePath)) {
    return null;
  }
  const raw = readFileSync(filePath, 'utf-8');
  return YAML.parse(raw);
}

export function saveManifest(dir, manifest) {
  const filePath = join(resolve(dir), SKILL_MANIFEST_FILE);
  writeFileSync(filePath, YAML.stringify(manifest), 'utf-8');
  return filePath;
}

// ─── Validation Helpers ─────────────────────────────────────────────────

export function validateManifestFields(manifest) {
  const missing = REQUIRED_FIELDS.filter(f => !manifest[f]);
  return { valid: missing.length === 0, missing };
}

export function normalizePlatforms(platforms) {
  if (!Array.isArray(platforms)) platforms = [platforms];
  return platforms.map(p => PLATFORM_ALIASES[p.toLowerCase()] || p);
}

// ─── Skill Directory Detection ──────────────────────────────────────────

export function findSkillDir(startDir) {
  let dir = resolve(startDir);
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, SKILL_MANIFEST_FILE))) return dir;
    const parent = join(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

// ─── Default Manifest Template ──────────────────────────────────────────

export function createDefaultManifest({ name, description, author, platforms, category }) {
  return {
    name,
    version: '1.0.0',
    description: description || `A ${name} skill for AI agents`,
    author: author || 'anonymous',
    license: 'MIT',
    platforms: platforms || [PLATFORMS.GENERIC],
    category: category || 'other',
    keywords: [],
    dependencies: {},
    compatibility: {
      minAgentVersion: '1.0.0',
    },
    files: {
      skill: 'SKILL.md',
      tests: 'tests/',
      examples: 'examples/',
    },
  };
}
