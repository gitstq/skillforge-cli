/**
 * skillforge publish — Publish skill to registry
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'path';
import { findSkillDir, loadManifest } from '../core/schema.js';
import { assessSkill } from '../core/quality.js';
import { registerSkill } from '../registry/registry.js';

export const publishCommand = new Command('publish')
  .description('Publish skill to the registry')
  .argument('[path]', 'Skill directory path', '.')
  .option('--force', 'Skip quality check and publish anyway', false)
  .option('--dry-run', 'Simulate publish without writing', false)
  .action(async (path, options) => {
    const spinner = ora('Publishing skill...').start();

    try {
      const dirPath = findSkillDir(resolve(path)) || resolve(path);
      const manifest = loadManifest(dirPath);

      if (!manifest) {
        spinner.fail(chalk.red('No skillforge.yaml found — not a valid skill directory'));
        process.exit(1);
      }

      // Quality check
      const assessment = assessSkill(dirPath);

      if (!options.force && (assessment.grade === 'D' || assessment.grade === 'F')) {
        spinner.warn(chalk.yellow(`Quality grade is ${assessment.grade} (${assessment.score}/100)`));
        console.log(chalk.yellow('\n  ⚠ Low quality skills should not be published.'));
        console.log(chalk.yellow('  Run `skillforge test` for details, or use --force to override.\n'));
        process.exit(1);
      }

      if (options.dryRun) {
        spinner.info(chalk.cyan('Dry run — would publish:'));
        console.log(`  Name: ${manifest.name}`);
        console.log(`  Version: ${manifest.version}`);
        console.log(`  Platforms: ${(manifest.platforms || []).join(', ')}`);
        console.log(`  Quality: ${assessment.grade} (${assessment.score}/100)`);
        return;
      }

      // Register
      const entry = registerSkill(dirPath);

      spinner.succeed(chalk.green(`✓ Skill "${manifest.name}" published to registry!`));
      console.log();
      console.log(`  ${chalk.gray('Name:')} ${manifest.name}`);
      console.log(`  ${chalk.gray('Version:')} ${manifest.version}`);
      console.log(`  ${chalk.gray('Platforms:')} ${(manifest.platforms || []).join(', ')}`);
      console.log(`  ${chalk.gray('Quality:')} ${assessment.grade} (${assessment.score}/100)`);
      console.log(`  ${chalk.gray('Path:')} ${entry.path}`);
      console.log();

    } catch (err) {
      spinner.fail(chalk.red(`Publish failed: ${err.message}`));
      process.exit(1);
    }
  });
