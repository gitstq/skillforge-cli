# SkillForge CLI ⚒️

> AI Agent Skill Forging, Testing & Distribution CLI

Cross-platform skill compatibility, automatic quality assessment, and skill registry for AI coding agents.

## Why SkillForge?

AI coding agents (Claude Code, Codex, Cursor, OpenClaw) each have their own skill/plugin formats. **SkillForge bridges them** — write a skill once, run it everywhere.

| Feature | Description |
|---------|-------------|
| 🔄 **Cross-Platform** | Write once, convert to Claude Code / Codex / Cursor / OpenClaw formats |
| 📊 **Quality Engine** | Auto-assess skills on completeness, clarity, testability, compatibility |
| 📦 **Skill Registry** | Publish, discover, and search skills like npm but for AI agents |
| 🏗️ **Scaffolding** | `skillforge create` generates complete skill project in seconds |

## Quick Start

```bash
# Install
npm install -g skillforge-cli

# Create a new skill
skillforge create my-awesome-skill

# Validate it
skillforge validate my-awesome-skill

# Run quality assessment
skillforge test my-awesome-skill

# Convert to other platforms
skillforge convert my-awesome-skill --to cursor
skillforge convert my-awesome-skill --all

# Publish to registry
skillforge publish my-awesome-skill

# Search skills
skillforge search "code review" --curated
```

## Commands

### `skillforge create <name>`
Create a new skill project with template files.

```bash
skillforge create my-skill --platforms claude-code,openclaw --category coding
```

Options:
- `-d, --description` — Skill description
- `-a, --author` — Author name
- `-p, --platforms` — Target platforms (comma-separated)
- `-c, --category` — Skill category
- `-o, --output` — Output directory

### `skillforge validate [path]`
Validate skill format and completeness.

```bash
skillforge validate ./my-skill --strict
```

### `skillforge test [path]`
Run quality assessment with detailed scoring.

```bash
skillforge test ./my-skill --verbose
skillforge test ./my-skill --json
```

Outputs a grade (A-F) based on:
- **Completeness (35%)** — All required files and fields present
- **Clarity (30%)** — Clear instructions, no ambiguity
- **Testability (20%)** — Examples and test cases provided
- **Compatibility (15%)** — Cross-platform support

### `skillforge convert [path]`
Convert skill between AI Agent platforms.

```bash
# Convert to specific platform
skillforge convert ./my-skill --to cursor

# Convert to all platforms
skillforge convert ./my-skill --all

# List supported platforms
skillforge convert --list-platforms
```

Supported platforms:
| Platform | Output Format |
|----------|---------------|
| claude-code | SKILL.md |
| codex | codex.yaml + SKILL.md |
| cursor | .cursorrules |
| openclaw | SKILL.md |

### `skillforge publish [path]`
Publish skill to the local registry.

```bash
skillforge publish ./my-skill
skillforge publish ./my-skill --dry-run
skillforge publish ./my-skill --force  # Skip quality check
```

### `skillforge search <query>`
Search skills in the registry.

```bash
skillforge search "code review"
skillforge search "testing" --platform claude-code --curated
```

### `skillforge info <name>`
Get detailed information about a skill.

```bash
skillforge info code-review
```

### `skillforge list`
List all registered skills.

```bash
skillforge list --curated
skillforge list --category coding
```

## Skill Structure

A skillforge-compatible skill has this structure:

```
my-skill/
├── skillforge.yaml    # Skill manifest
├── SKILL.md           # Skill instructions (agent reads this)
├── README.md          # Documentation
├── tests/             # Test cases
│   └── my-skill.test.md
├── examples/          # Usage examples
│   └── basic.md
├── adapters/          # Platform-specific adapters
└── .gitignore
```

### skillforge.yaml

```yaml
name: my-skill
version: 1.0.0
description: A powerful skill for AI agents
author: your-name
license: MIT
platforms:
  - claude-code
  - codex
  - cursor
  - openclaw
category: coding
keywords:
  - automation
  - productivity
dependencies: {}
compatibility:
  minAgentVersion: "1.0.0"
files:
  skill: SKILL.md
  tests: tests/
  examples: examples/
```

## Quality Grades

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90-100 | Production-ready, publish with confidence |
| B | 80-89 | Good quality, minor improvements possible |
| C | 70-79 | Needs work, address issues before publishing |
| D | 60-69 | Significant gaps, major improvements needed |
| F | 0-59 | Not ready, fundamental issues present |

## Architecture

```
src/
├── cli.js              # CLI entry point
├── index.js            # Library exports
├── core/
│   ├── schema.js       # Skill manifest schema & validation
│   └── quality.js      # Quality assessment engine
├── adapters/
│   └── converter.js    # Cross-platform conversion
├── commands/
│   ├── create.js       # skillforge create
│   ├── validate.js     # skillforge validate
│   ├── test.js         # skillforge test
│   ├── publish.js      # skillforge publish
│   ├── search.js       # skillforge search
│   ├── info.js         # skillforge info
│   ├── convert.js      # skillforge convert
│   └── list.js         # skillforge list
├── registry/
│   └── registry.js     # Local skill registry
└── utils/              # Utilities
```

## License

MIT
