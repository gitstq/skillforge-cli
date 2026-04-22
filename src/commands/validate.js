/**
 * skillforge validate — Validate skill format and completeness
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'path';
import { loadManifest, validateManifestFields, findSkillDir, REQUIRED_FIELDS } from '../core/schema.js';

export const validateCommand = new Command('validate')
  .description('Validate skill format and completeness')
  .argument('[path]', 'Skill directory path', '.')
  .option('--strict', 'Enable strict validation (warnings as errors)', false)
  .action(async (path, options) => {
    const spinner = ora('Validating skill...').start();

    try {
      const dirPath = findSkillDir(resolve(path)) || resolve(path);
      const manifest = loadManifest(dirPath);

      if (!manifest) {
        spinner.fail(chalk.red('No skillforge.yaml found — not a valid skill directory'));
        process.exit(1);
      }

      const errors = [];
      const warnings = [];

      // Check required fields
      const { missing } = validateManifestFields(manifest);
      for (const field of missing) {
        errors.push(`Missing required field: ${field}`);
      }

      // Validate name format
      if (manifest.name && !/^[a-z][a-z0-9-]*$/.test(manifest.name)) {
        errors.push('Name must be kebab-case (lowercase, numbers, hyphens)');
      }

      // Validate version format
      if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
        errors.push('Version must follow semver (e.g., 1.0.0)');
      }

      // Validate platforms
      if (manifest.platforms) {
        const validPlatforms = ['claude-code', 'codex', 'cursor', 'openclaw', 'generic'];
        for (const p of manifest.platforms) {
          if (!validPlatforms.includes(p)) {
            warnings.push(`Unknown platform: "${p}". Valid: ${validPlatforms.join(', ')}`);
          }
        }
      } else {
        warnings.push('No platforms specified — add a platforms field');
      }

      // Check description quality
      if (manifest.description && manifest.description.length < 10) {
        warnings.push('Description is very short — provide more detail');
      }

      // Check SKILL.md
      const { existsSync } = await import('fs');
      const { join } = await import('path');
      if (!existsSync(join(dirPath, 'SKILL.md'))) {
        errors.push('SKILL.md not found — required skill instruction file');
      }

      // Check test directory
      if (!existsSync(join(dirPath, 'tests'))) {
        warnings.push('tests/ directory not found — recommended for quality');
      }

      // Process results
      if (options.strict) {
        for (const w of warnings) errors.push(w);
      }

      if (errors.length === 0) {
        spinner.succeed(chalk.green(`✓ Skill "${manifest.name}" is valid!`));
        if (warnings.length > 0) {
          console.log(chalk.yellow(`\n⚠ ${warnings.length} warning(s):`));
          warnings.forEach(w => console.log(chalk.yellow(`  • ${w}`)));
        }
      } else {
        spinner.fail(chalk.red(`✗ Validation failed for "${manifest.name}"`));
        console.log(chalk.red(`\n❌ ${errors.length} error(s):`));
        errors.forEach(e => console.log(chalk.red(`  • ${e}`)));
        if (warnings.length > 0 && !options.strict) {
          console.log(chalk.yellow(`\n⚠ ${warnings.length} warning(s):`));
          warnings.forEach(w => console.log(chalk.yellow(`  • ${w}`)));
        }
        process.exit(1);
      }

    } catch (err) {
      spinner.fail(chalk.red(`Validation error: ${err.message}`));
      process.exit(1);
    }
  });
