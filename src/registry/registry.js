/**
 * SkillForge — Skill Registry (local-first, with remote discovery)
 *
 * Manages a local skill registry and provides search/discovery capabilities.
 * Can optionally connect to remote registries for skill discovery.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import YAML from 'yaml';
import { loadManifest } from '../core/schema.js';

const REGISTRY_DIR = '.skillforge-registry';
const REGISTRY_INDEX = 'index.yaml';
const LOCAL_REGISTRY_ENV = 'SKILLFORGE_REGISTRY';

// ─── Local Registry Management ──────────────────────────────────────────

export function getRegistryPath() {
  const envPath = process.env[LOCAL_REGISTRY_ENV];
  if (envPath) return resolve(envPath);
  return join(process.env.HOME || process.env.USERPROFILE || '.', REGISTRY_DIR);
}

export function ensureRegistry() {
  const regPath = getRegistryPath();
  if (!existsSync(regPath)) mkdirSync(regPath, { recursive: true });

  const indexPath = join(regPath, REGISTRY_INDEX);
  if (!existsSync(indexPath)) {
    const emptyIndex = { version: 1, skills: [], updatedAt: new Date().toISOString() };
    writeFileSync(indexPath, YAML.stringify(emptyIndex), 'utf-8');
  }

  return regPath;
}

export function loadRegistryIndex() {
  const indexPath = join(getRegistryPath(), REGISTRY_INDEX);
  if (!existsSync(indexPath)) return { version: 1, skills: [], updatedAt: null };
  return YAML.parse(readFileSync(indexPath, 'utf-8'));
}

export function saveRegistryIndex(index) {
  const regPath = ensureRegistry();
  index.updatedAt = new Date().toISOString();
  writeFileSync(join(regPath, REGISTRY_INDEX), YAML.stringify(index), 'utf-8');
}

// ─── Register a Skill ───────────────────────────────────────────────────

export function registerSkill(skillDir) {
  const dirPath = resolve(skillDir);
  const manifest = loadManifest(dirPath);

  if (!manifest) {
    throw new Error(`No skillforge.yaml found in ${dirPath}`);
  }

  const index = loadRegistryIndex();

  // Check if already registered
  const existingIdx = index.skills.findIndex(s => s.name === manifest.name);
  const entry = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author: manifest.author,
    platforms: manifest.platforms || [],
    category: manifest.category || 'other',
    keywords: manifest.keywords || [],
    path: dirPath,
    registeredAt: existingIdx >= 0 ? index.skills[existingIdx].registeredAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    index.skills[existingIdx] = entry;
  } else {
    index.skills.push(entry);
  }

  saveRegistryIndex(index);
  return entry;
}

// ─── Unregister a Skill ─────────────────────────────────────────────────

export function unregisterSkill(name) {
  const index = loadRegistryIndex();
  const idx = index.skills.findIndex(s => s.name === name);
  if (idx < 0) return false;
  index.skills.splice(idx, 1);
  saveRegistryIndex(index);
  return true;
}

// ─── Search Skills ──────────────────────────────────────────────────────

export function searchSkills(query, filters = {}) {
  const index = loadRegistryIndex();
  let results = index.skills;

  // Text search
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      (s.keywords || []).some(k => k.toLowerCase().includes(q))
    );
  }

  // Platform filter
  if (filters.platform) {
    results = results.filter(s => (s.platforms || []).includes(filters.platform));
  }

  // Category filter
  if (filters.category) {
    results = results.filter(s => s.category === filters.category);
  }

  // Author filter
  if (filters.author) {
    results = results.filter(s => s.author === filters.author);
  }

  return results;
}

// ─── Get Skill Info ─────────────────────────────────────────────────────

export function getSkillInfo(name) {
  const index = loadRegistryIndex();
  const entry = index.skills.find(s => s.name === name);
  if (!entry) return null;

  // Try to load full manifest
  const manifest = loadManifest(entry.path);
  return { ...entry, manifest };
}

// ─── List All Skills ────────────────────────────────────────────────────

export function listSkills(filters = {}) {
  return searchSkills(null, filters);
}

// ─── Built-in Skill Registry (Curated) ─────────────────────────────────

export const CURATED_SKILLS = [
  {
    name: 'code-review',
    version: '1.0.0',
    description: 'Automated code review with best practices and security checks',
    author: 'skillforge',
    platforms: ['claude-code', 'codex', 'cursor', 'openclaw'],
    category: 'coding',
    keywords: ['review', 'code-quality', 'security'],
  },
  {
    name: 'api-designer',
    version: '1.0.0',
    description: 'REST API design and documentation generator',
    author: 'skillforge',
    platforms: ['claude-code', 'codex', 'openclaw'],
    category: 'coding',
    keywords: ['api', 'rest', 'documentation'],
  },
  {
    name: 'test-writer',
    version: '1.0.0',
    description: 'Auto-generate unit tests for any codebase',
    author: 'skillforge',
    platforms: ['claude-code', 'codex', 'cursor', 'openclaw'],
    category: 'testing',
    keywords: ['testing', 'unit-test', 'coverage'],
  },
  {
    name: 'doc-generator',
    version: '1.0.0',
    description: 'Generate comprehensive documentation from code',
    author: 'skillforge',
    platforms: ['claude-code', 'codex', 'cursor', 'openclaw'],
    category: 'writing',
    keywords: ['documentation', 'readme', 'api-docs'],
  },
  {
    name: 'git-workflow',
    version: '1.0.0',
    description: 'Git branching, commit conventions, and CI/CD pipeline management',
    author: 'skillforge',
    platforms: ['claude-code', 'codex', 'openclaw'],
    category: 'devops',
    keywords: ['git', 'ci-cd', 'workflow'],
  },
  {
    name: 'sql-optimizer',
    version: '1.0.0',
    description: 'SQL query optimization and database schema analysis',
    author: 'skillforge',
    platforms: ['claude-code', 'codex', 'openclaw'],
    category: 'data',
    keywords: ['sql', 'database', 'optimization'],
  },
  {
    name: 'security-audit',
    version: '1.0.0',
    description: 'Security vulnerability scanning and remediation advice',
    author: 'skillforge',
    platforms: ['claude-code', 'codex', 'cursor', 'openclaw'],
    category: 'security',
    keywords: ['security', 'vulnerability', 'audit'],
  },
  {
    name: 'refactor-assistant',
    version: '1.0.0',
    description: 'Code refactoring suggestions with design pattern recognition',
    author: 'skillforge',
    platforms: ['claude-code', 'codex', 'cursor', 'openclaw'],
    category: 'coding',
    keywords: ['refactoring', 'design-patterns', 'clean-code'],
  },
  {
    name: 'prompt-engineer',
    version: '1.0.0',
    description: 'Craft and optimize prompts for AI agents',
    author: 'skillforge',
    platforms: ['claude-code', 'codex', 'cursor', 'openclaw'],
    category: 'productivity',
    keywords: ['prompt', 'optimization', 'ai'],
  },
  {
    name: 'data-pipeline',
    version: '1.0.0',
    description: 'ETL pipeline design and data transformation workflows',
    author: 'skillforge',
    platforms: ['claude-code', 'codex', 'openclaw'],
    category: 'data',
    keywords: ['etl', 'pipeline', 'data-transformation'],
  },
  {
    name: 'i18n-manager',
    version: '1.0.0',
    description: 'Internationalization and localization management',
    author: 'skillforge',
    platforms: ['claude-code', 'codex', 'cursor', 'openclaw'],
    category: 'coding',
    keywords: ['i18n', 'localization', 'translation'],
  },
  {
    name: 'perf-analyzer',
    version: '1.0.0',
    description: 'Performance profiling and optimization recommendations',
    author: 'skillforge',
    platforms: ['claude-code', 'codex', 'openclaw'],
    category: 'analysis',
    keywords: ['performance', 'profiling', 'optimization'],
  },
];
