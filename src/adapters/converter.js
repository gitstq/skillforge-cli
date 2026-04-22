/**
 * SkillForge — Cross-Platform Adapter System
 *
 * Converts skills between AI Agent platforms:
 *   Claude Code, Codex, Cursor, OpenClaw
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import YAML from 'yaml';
import { PLATFORMS, loadManifest, saveManifest } from '../core/schema.js';

// ─── Adapter Registry ───────────────────────────────────────────────────

const adapters = {
  [PLATFORMS.CLAUDE_CODE]: {
    name: 'Claude Code',
    manifestFile: 'SKILL.md',
    configKey: 'claude',
    transformManifest(manifest) {
      return {
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        instructions: manifest.files?.skill || 'SKILL.md',
      };
    },
    transformSkill(content, manifest) {
      return `# ${manifest.name}\n\n${content}\n\n## Platform: Claude Code\n> This skill is compatible with Claude Code via SKILL.md format.`;
    },
  },

  [PLATFORMS.CODEX]: {
    name: 'Codex',
    manifestFile: 'codex.yaml',
    configKey: 'codex',
    transformManifest(manifest) {
      return {
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        agent: 'codex',
        instructions_file: manifest.files?.skill || 'SKILL.md',
      };
    },
    transformSkill(content, manifest) {
      return content; // Codex reads SKILL.md directly
    },
  },

  [PLATFORMS.CURSOR]: {
    name: 'Cursor',
    manifestFile: '.cursorrules',
    configKey: 'cursor',
    transformManifest(manifest) {
      return null; // Cursor uses .cursorrules file
    },
    transformSkill(content, manifest) {
      const rules = [`# ${manifest.name}`, `# Version: ${manifest.version}`, ''];
      // Convert SKILL.md to rules format
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.startsWith('# ')) continue; // Skip top-level headers
        rules.push(line);
      }
      return rules.join('\n');
    },
  },

  [PLATFORMS.OPENCLAW]: {
    name: 'OpenClaw',
    manifestFile: 'SKILL.md',
    configKey: 'openclaw',
    transformManifest(manifest) {
      return {
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        trigger: manifest.keywords?.join(', ') || '',
        instructions: manifest.files?.skill || 'SKILL.md',
      };
    },
    transformSkill(content, manifest) {
      return content; // OpenClaw natively reads SKILL.md
    },
  },

  [PLATFORMS.GENERIC]: {
    name: 'Generic',
    manifestFile: 'skillforge.yaml',
    configKey: 'generic',
    transformManifest(manifest) {
      return manifest; // Pass through as-is
    },
    transformSkill(content, manifest) {
      return content;
    },
  },
};

// ─── Get Adapter ────────────────────────────────────────────────────────

export function getAdapter(platform) {
  return adapters[platform] || null;
}

export function getAllAdapters() {
  return { ...adapters };
}

// ─── Convert Skill to Target Platform ───────────────────────────────────

export function convertSkill(sourceDir, targetPlatform, outputDir) {
  const dirPath = resolve(sourceDir);
  const manifest = loadManifest(dirPath);

  if (!manifest) {
    throw new Error(`No skillforge.yaml found in ${dirPath}`);
  }

  const adapter = getAdapter(targetPlatform);
  if (!adapter) {
    throw new Error(`Unknown platform: ${targetPlatform}. Supported: ${Object.keys(adapters).join(', ')}`);
  }

  // Read source SKILL.md
  const skillPath = join(dirPath, manifest.files?.skill || 'SKILL.md');
  let skillContent = '';
  if (existsSync(skillPath)) {
    skillContent = readFileSync(skillPath, 'utf-8');
  }

  // Transform
  const convertedSkill = adapter.transformSkill(skillContent, manifest);
  const convertedManifest = adapter.transformManifest(manifest);

  // Determine output directory
  const outPath = outputDir ? resolve(outputDir) : join(dirPath, 'dist', targetPlatform);
  if (!existsSync(outPath)) mkdirSync(outPath, { recursive: true });

  // Write converted files
  writeFileSync(join(outPath, adapter.manifestFile), convertedSkill, 'utf-8');

  if (convertedManifest) {
    const ext = adapter.manifestFile.endsWith('.yaml') ? 'yaml' : 'json';
    const manifestContent = ext === 'yaml'
      ? YAML.stringify(convertedManifest)
      : JSON.stringify(convertedManifest, null, 2);
    writeFileSync(join(outPath, `manifest.${ext}`), manifestContent, 'utf-8');
  }

  return {
    platform: targetPlatform,
    adapterName: adapter.name,
    outputDir: outPath,
    files: [adapter.manifestFile, convertedManifest ? 'manifest' : null].filter(Boolean),
  };
}

// ─── Generate Multi-Platform Package ────────────────────────────────────

export function packageForAllPlatforms(sourceDir, outputDir) {
  const results = [];
  for (const platform of Object.keys(adapters)) {
    if (platform === PLATFORMS.GENERIC) continue;
    try {
      const result = convertSkill(sourceDir, platform, outputDir);
      results.push({ platform, ...result, success: true });
    } catch (err) {
      results.push({ platform, success: false, error: err.message });
    }
  }
  return results;
}
