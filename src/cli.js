#!/usr/bin/env node

/**
 * SkillForge CLI — AI Agent Skill Forging, Testing & Distribution
 * Cross-platform skill compatibility, auto quality assessment, and skill registry
 */

import { program } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create.js';
import { validateCommand } from './commands/validate.js';
import { testCommand } from './commands/test.js';
import { publishCommand } from './commands/publish.js';
import { searchCommand } from './commands/search.js';
import { infoCommand } from './commands/info.js';
import { convertCommand } from './commands/convert.js';
import { listCommand } from './commands/list.js';

const VERSION = '1.0.0';

program
  .name('skillforge')
  .description(chalk.cyan('⚒️  SkillForge CLI — Forge, Test & Distribute AI Agent Skills'))
  .version(VERSION, '-v, --version', 'Show version');

// Register commands
program.addCommand(createCommand);
program.addCommand(validateCommand);
program.addCommand(testCommand);
program.addCommand(publishCommand);
program.addCommand(searchCommand);
program.addCommand(infoCommand);
program.addCommand(convertCommand);
program.addCommand(listCommand);

program.parse();
