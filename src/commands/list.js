/**
 * skillforge list — List all registered skills
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { listSkills, CURATED_SKILLS } from '../registry/registry.js';

export const listCommand = new Command('list')
  .description('List all registered skills')
  .option('-p, --platform <platform>', 'Filter by platform')
  .option('-c, --category <category>', 'Filter by category')
  .option('--curated', 'Include curated skills', false)
  .action(async (options) => {
    const spinner = ora('Loading skills...').start();

    try {
      const filters = {};
      if (options.platform) filters.platform = options.platform;
      if (options.category) filters.category = options.category;

      const localSkills = listSkills(filters);

      let curatedList = [];
      if (options.curated) {
        curatedList = CURATED_SKILLS;
        if (options.platform) curatedList = curatedList.filter(s => s.platforms.includes(options.platform));
        if (options.category) curatedList = curatedList.filter(s => s.category === options.category);
      }

      spinner.stop();

      // Local registry
      if (localSkills.length > 0) {
        console.log(chalk.cyan(`\n📦 Local Registry (${localSkills.length} skills):\n`));
        console.log(`  ${'Name'.padEnd(20)} ${'Version'.padEnd(10)} ${'Category'.padEnd(12)} Platforms`);
        console.log(`  ${'─'.repeat(20)} ${'─'.repeat(10)} ${'─'.repeat(12)} ${'─'.repeat(30)}`);
        for (const skill of localSkills) {
          const name = skill.name.length > 18 ? skill.name.slice(0, 18) + '..' : skill.name;
          console.log(`  ${chalk.green(name.padEnd(20))} v${skill.version.padEnd(8)} ${(skill.category || 'other').padEnd(12)} ${(skill.platforms || []).join(', ')}`);
        }
        console.log();
      }

      // Curated
      if (curatedList.length > 0) {
        console.log(chalk.cyan(`🌐 Curated Skills (${curatedList.length} available):\n`));
        console.log(`  ${'Name'.padEnd(20)} ${'Version'.padEnd(10)} ${'Category'.padEnd(12)} Platforms`);
        console.log(`  ${'─'.repeat(20)} ${'─'.repeat(10)} ${'─'.repeat(12)} ${'─'.repeat(30)}`);
        for (const skill of curatedList) {
          const name = skill.name.length > 18 ? skill.name.slice(0, 18) + '..' : skill.name;
          console.log(`  ${chalk.blue(name.padEnd(20))} v${skill.version.padEnd(8)} ${skill.category.padEnd(12)} ${skill.platforms.join(', ')}`);
        }
        console.log();
      }

      if (localSkills.length === 0 && curatedList.length === 0) {
        console.log(chalk.yellow('No skills found.'));
        console.log(chalk.gray('  Create one: skillforge create <name>'));
        console.log(chalk.gray('  Browse:      skillforge list --curated'));
      }

    } catch (err) {
      spinner.fail(chalk.red(`Failed: ${err.message}`));
    }
  });
