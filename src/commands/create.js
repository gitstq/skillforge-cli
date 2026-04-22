/**
 * skillforge create — Scaffold a new skill from template
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import YAML from 'yaml';
import { createDefaultManifest, PLATFORMS, CATEGORIES, normalizePlatforms, saveManifest } from '../core/schema.js';

export const createCommand = new Command('create')
  .description('Create a new skill from template')
  .argument('<name>', 'Skill name (kebab-case)')
  .option('-d, --description <desc>', 'Skill description')
  .option('-a, --author <author>', 'Author name')
  .option('-p, --platforms <platforms>', 'Target platforms (comma-separated)', 'generic')
  .option('-c, --category <category>', 'Skill category', 'other')
  .option('-o, --output <dir>', 'Output directory', '.')
  .action(async (name, options) => {
    const spinner = ora('Creating skill...').start();

    try {
      // Validate name
      if (!/^[a-z][a-z0-9-]*$/.test(name)) {
        spinner.fail('Invalid skill name. Use kebab-case (lowercase, numbers, hyphens)');
        return;
      }

      const outputDir = resolve(join(options.output, name));
      if (existsSync(outputDir)) {
        spinner.fail(`Directory ${name} already exists`);
        return;
      }

      // Parse platforms
      const platforms = normalizePlatforms(options.platforms.split(','));

      // Create directory structure
      mkdirSync(outputDir, { recursive: true });
      mkdirSync(join(outputDir, 'tests'), { recursive: true });
      mkdirSync(join(outputDir, 'examples'), { recursive: true });
      mkdirSync(join(outputDir, 'adapters'), { recursive: true });

      // Create manifest
      const manifest = createDefaultManifest({
        name,
        description: options.description,
        author: options.author,
        platforms,
        category: options.category,
      });
      saveManifest(outputDir, manifest);

      // Create SKILL.md template
      const skillContent = `# ${name}

${options.description || `A ${name} skill for AI agents`}

## Overview

Describe what this skill does and when it should be triggered.

## Instructions

### Step 1: Initialization
- Describe the first step the agent should take

### Step 2: Main Operation
- Describe the core logic

### Step 3: Output
- Describe the expected output format

## Examples

\`\`\`
# Example usage
skillforge ${name} --input example.txt
\`\`\`

## Expected Output

The skill should produce:
- Item 1: Description of first output
- Item 2: Description of second output

## Constraints

- List any limitations or constraints
- Platform-specific notes

## Platform Compatibility

${platforms.map(p => `- ${p}`).join('\n')}
`;
      writeFileSync(join(outputDir, 'SKILL.md'), skillContent, 'utf-8');

      // Create README.md
      const readmeContent = `# ${name}

${options.description || `A ${name} skill for AI agents`}

## Installation

\`\`\`bash
skillforge install ${name}
\`\`\`

## Usage

\`\`\`bash
# Use with your AI agent
# The skill will be automatically loaded when relevant
\`\`\`

## Platforms

${platforms.map(p => `- ${p}`).join('\n')}

## License

MIT
`;
      writeFileSync(join(outputDir, 'README.md'), readmeContent, 'utf-8');

      // Create test template
      const testContent = `# ${name} — Test Cases

## Test 1: Basic Functionality
- Input: Standard input
- Expected: Correct output

## Test 2: Edge Case
- Input: Boundary condition
- Expected: Graceful handling
`;
      writeFileSync(join(outputDir, 'tests', `${name}.test.md`), testContent, 'utf-8');

      // Create example
      const exampleContent = `# ${name} — Example

\`\`\`
Input: Example scenario
Output: Expected result
\`\`\`
`;
      writeFileSync(join(outputDir, 'examples', 'basic.md'), exampleContent, 'utf-8');

      // Create .gitignore
      writeFileSync(join(outputDir, '.gitignore'), 'node_modules/\ndist/\n.skillforge-registry/\n*.log\n', 'utf-8');

      spinner.succeed(chalk.green(`Skill "${name}" created successfully!`));

      console.log('\n' + chalk.cyan('📁 Project structure:'));
      console.log(`  ${name}/`);
      console.log(`  ├── skillforge.yaml    ${chalk.gray('# Skill manifest')}`);
      console.log(`  ├── SKILL.md           ${chalk.gray('# Skill instructions')}`);
      console.log(`  ├── README.md          ${chalk.gray('# Documentation')}`);
      console.log(`  ├── tests/             ${chalk.gray('# Test cases')}`);
      console.log(`  ├── examples/          ${chalk.gray('# Usage examples')}`);
      console.log(`  ├── adapters/          ${chalk.gray('# Platform adapters')}`);
      console.log(`  └── .gitignore`);

      console.log('\n' + chalk.cyan('📋 Next steps:'));
      console.log(`  1. Edit ${chalk.yellow('SKILL.md')} — Write your skill instructions`);
      console.log(`  2. Run ${chalk.yellow(`skillforge validate ${name}`)} — Check your skill`);
      console.log(`  3. Run ${chalk.yellow(`skillforge test ${name}`)} — Quality assessment`);
      console.log(`  4. Run ${chalk.yellow(`skillforge publish ${name}`)} — Publish to registry`);

    } catch (err) {
      spinner.fail(chalk.red(`Failed: ${err.message}`));
    }
  });
