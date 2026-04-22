/**
 * skillforge test — Run quality assessment on a skill
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'path';
import { findSkillDir } from '../core/schema.js';
import { assessSkill } from '../core/quality.js';

export const testCommand = new Command('test')
  .description('Run quality assessment on a skill')
  .argument('[path]', 'Skill directory path', '.')
  .option('--json', 'Output results as JSON', false)
  .option('--verbose', 'Show detailed scoring breakdown', false)
  .action(async (path, options) => {
    const spinner = ora('Assessing skill quality...').start();

    try {
      const dirPath = findSkillDir(resolve(path)) || resolve(path);
      const result = assessSkill(dirPath);

      if (result.score === 0 && !result.manifest) {
        spinner.fail(chalk.red('Not a valid skill directory (no skillforge.yaml)'));
        process.exit(1);
      }

      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      // Grade color map
      const gradeColors = { A: 'green', B: 'cyan', C: 'yellow', D: 'yellow', F: 'red' };
      const gradeColor = gradeColors[result.grade] || 'white';

      console.log('\n' + chalk.bold('═'.repeat(50)));
      console.log(chalk.bold(`  ⚒️  SkillForge Quality Report`));
      console.log(chalk.bold('═'.repeat(50)));

      if (result.manifest) {
        console.log(`  ${chalk.gray('Skill:')} ${chalk.white(result.manifest.name)} v${result.manifest.version}`);
      }

      console.log(`  ${chalk.gray('Score:')} ${chalk[gradeColor].bold(`${result.score}/100`)}`);
      console.log(`  ${chalk.gray('Grade:')} ${chalk[gradeColor].bold(result.grade)}`);
      console.log();

      // Dimension breakdown
      console.log(chalk.cyan('  📊 Dimension Breakdown:'));
      const dims = result.dimensions;
      const dimNames = {
        completeness: 'Completeness ',
        clarity: 'Clarity      ',
        testability: 'Testability  ',
        compatibility: 'Compatibility',
      };

      for (const [key, label] of Object.entries(dimNames)) {
        const score = dims[key];
        const bar = '█'.repeat(Math.round(score / 5)) + '░'.repeat(20 - Math.round(score / 5));
        const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
        console.log(`  ${chalk.gray(label)} ${chalk[color](bar)} ${chalk.bold(score)}`);
      }

      // Issues
      if (result.issues.length > 0) {
        console.log('\n' + chalk.cyan('  📋 Issues Found:'));
        for (const issue of result.issues) {
          console.log(`  ${chalk.yellow('•')} ${issue}`);
        }
      }

      console.log('\n' + chalk.bold('═'.repeat(50)));

      if (result.grade === 'A' || result.grade === 'B') {
        console.log(chalk.green('  ✓ Skill quality is good — ready to publish!'));
      } else if (result.grade === 'C') {
        console.log(chalk.yellow('  ⚠ Skill needs improvement — address issues above'));
      } else {
        console.log(chalk.red('  ✗ Skill quality is low — significant work needed'));
      }
      console.log();

    } catch (err) {
      spinner.fail(chalk.red(`Assessment error: ${err.message}`));
      process.exit(1);
    }
  });
