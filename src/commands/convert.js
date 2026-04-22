/**
 * skillforge convert — Convert skill between AI Agent platforms
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'path';
import { findSkillDir, loadManifest, PLATFORMS } from '../core/schema.js';
import { convertSkill, packageForAllPlatforms, getAllAdapters } from '../adapters/converter.js';

export const convertCommand = new Command('convert')
  .description('Convert skill between AI Agent platforms')
  .argument('[path]', 'Skill directory path', '.')
  .option('-t, --to <platform>', 'Target platform (claude-code, codex, cursor, openclaw)')
  .option('--all', 'Convert to all platforms', false)
  .option('-o, --output <dir>', 'Output directory')
  .option('--list-platforms', 'List supported platforms', false)
  .action(async (path, options) => {
    // List platforms
    if (options.listPlatforms) {
      console.log(chalk.cyan('\n🏗️  Supported Platforms:\n'));
      const adapters = getAllAdapters();
      for (const [key, adapter] of Object.entries(adapters)) {
        console.log(`  ${chalk.green('●')} ${chalk.bold(key.padEnd(15))} ${adapter.name} (${adapter.manifestFile})`);
      }
      console.log();
      return;
    }

    const spinner = ora('Converting skill...').start();

    try {
      const dirPath = findSkillDir(resolve(path)) || resolve(path);
      const manifest = loadManifest(dirPath);

      if (!manifest) {
        spinner.fail(chalk.red('No skillforge.yaml found — not a valid skill directory'));
        process.exit(1);
      }

      if (options.all) {
        // Convert to all platforms
        const results = packageForAllPlatforms(dirPath, options.output);
        spinner.succeed(chalk.green(`Converted "${manifest.name}" to multiple platforms`));
        console.log();
        for (const r of results) {
          if (r.success) {
            console.log(`  ${chalk.green('✓')} ${r.platform.padEnd(15)} → ${r.outputDir}`);
          } else {
            console.log(`  ${chalk.red('✗')} ${r.platform.padEnd(15)} ${chalk.red(r.error)}`);
          }
        }
        console.log();
      } else if (options.to) {
        // Convert to specific platform
        const result = convertSkill(dirPath, options.to, options.output);
        spinner.succeed(chalk.green(`Converted "${manifest.name}" → ${result.adapterName}`));
        console.log();
        console.log(`  ${chalk.gray('Platform:')}  ${result.platform}`);
        console.log(`  ${chalk.gray('Output:')}    ${result.outputDir}`);
        console.log(`  ${chalk.gray('Files:')}     ${result.files.join(', ')}`);
        console.log();
      } else {
        spinner.fail(chalk.red('Specify --to <platform> or --all'));
        console.log(chalk.gray('  Run `skillforge convert --list-platforms` for options'));
      }

    } catch (err) {
      spinner.fail(chalk.red(`Conversion failed: ${err.message}`));
      process.exit(1);
    }
  });
