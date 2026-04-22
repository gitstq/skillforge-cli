/**
 * skillforge info — Get detailed information about a skill
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getSkillInfo, CURATED_SKILLS } from '../registry/registry.js';

export const infoCommand = new Command('info')
  .description('Get detailed information about a skill')
  .argument('<name>', 'Skill name')
  .option('--json', 'Output as JSON', false)
  .action(async (name, options) => {
    const spinner = ora('Fetching skill info...').start();

    try {
      let info = getSkillInfo(name);

      // Fallback to curated
      if (!info) {
        info = CURATED_SKILLS.find(s => s.name === name) || null;
        if (info) info = { ...info, source: 'curated' };
      }

      if (!info) {
        spinner.fail(chalk.red(`Skill "${name}" not found`));
        console.log(chalk.gray('  Try: skillforge search <query> --curated'));
        return;
      }

      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(info, null, 2));
        return;
      }

      console.log('\n' + chalk.bold('═'.repeat(50)));
      console.log(chalk.bold(`  📦 ${info.name}`));
      console.log(chalk.bold('═'.repeat(50)));
      console.log(`  ${chalk.gray('Version:')}     ${info.version}`);
      console.log(`  ${chalk.gray('Description:')} ${info.description}`);
      console.log(`  ${chalk.gray('Author:')}      ${info.author}`);
      console.log(`  ${chalk.gray('Category:')}    ${info.category || 'N/A'}`);
      console.log(`  ${chalk.gray('Platforms:')}   ${(info.platforms || []).join(', ')}`);
      console.log(`  ${chalk.gray('Keywords:')}    ${(info.keywords || []).join(', ')}`);
      if (info.source) console.log(`  ${chalk.gray('Source:')}      ${info.source}`);
      if (info.path) console.log(`  ${chalk.gray('Path:')}        ${info.path}`);
      if (info.manifest) {
        console.log(`  ${chalk.gray('License:')}     ${info.manifest.license || 'N/A'}`);
        if (info.manifest.compatibility?.minAgentVersion) {
          console.log(`  ${chalk.gray('Min Agent:')}   ${info.manifest.compatibility.minAgentVersion}`);
        }
      }
      console.log(chalk.bold('═'.repeat(50)) + '\n');

    } catch (err) {
      spinner.fail(chalk.red(`Failed: ${err.message}`));
    }
  });
