/**
 * skillforge search — Search skills in the registry
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { searchSkills, CURATED_SKILLS } from '../registry/registry.js';

export const searchCommand = new Command('search')
  .description('Search skills in the registry')
  .argument('<query>', 'Search query')
  .option('-p, --platform <platform>', 'Filter by platform')
  .option('-c, --category <category>', 'Filter by category')
  .option('-a, --author <author>', 'Filter by author')
  .option('--curated', 'Include curated skill suggestions', false)
  .action(async (query, options) => {
    const spinner = ora('Searching skills...').start();

    try {
      const filters = {};
      if (options.platform) filters.platform = options.platform;
      if (options.category) filters.category = options.category;
      if (options.author) filters.author = options.author;

      // Search local registry
      const localResults = searchSkills(query, filters);

      // Search curated skills
      let curatedResults = [];
      if (options.curated || localResults.length === 0) {
        const q = query.toLowerCase();
        curatedResults = CURATED_SKILLS.filter(s =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.keywords.some(k => k.toLowerCase().includes(q))
        );
        if (options.platform) {
          curatedResults = curatedResults.filter(s => s.platforms.includes(options.platform));
        }
        if (options.category) {
          curatedResults = curatedResults.filter(s => s.category === options.category);
        }
      }

      spinner.stop();

      if (localResults.length === 0 && curatedResults.length === 0) {
        console.log(chalk.yellow(`No skills found matching "${query}"`));
        console.log(chalk.gray('  Try: skillforge search <query> --curated'));
        return;
      }

      // Display local results
      if (localResults.length > 0) {
        console.log(chalk.cyan(`\n📦 Local Registry (${localResults.length} results):\n`));
        for (const skill of localResults) {
          console.log(`  ${chalk.green('●')} ${chalk.bold(skill.name)} ${chalk.gray(`v${skill.version}`)}`);
          console.log(`    ${skill.description}`);
          console.log(`    ${chalk.gray('Platforms:')} ${(skill.platforms || []).join(', ')}  ${chalk.gray('Category:')} ${skill.category}`);
          console.log();
        }
      }

      // Display curated results
      if (curatedResults.length > 0) {
        console.log(chalk.cyan(`🌐 Curated Skills (${curatedResults.length} results):\n`));
        for (const skill of curatedResults) {
          console.log(`  ${chalk.blue('●')} ${chalk.bold(skill.name)} ${chalk.gray(`v${skill.version}`)}`);
          console.log(`    ${skill.description}`);
          console.log(`    ${chalk.gray('Platforms:')} ${skill.platforms.join(', ')}  ${chalk.gray('Category:')} ${skill.category}`);
          console.log();
        }
      }

      if (curatedResults.length > 0 && localResults.length === 0) {
        console.log(chalk.gray('  💡 Curated skills are templates. Use `skillforge create` to scaffold from them.'));
      }

    } catch (err) {
      spinner.fail(chalk.red(`Search failed: ${err.message}`));
    }
  });
