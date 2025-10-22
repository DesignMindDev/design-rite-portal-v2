# Specialized Agents Guide for Design-Rite Projects

This guide teaches you how to create and use specialized AI agents in Claude Code to automate specific tasks across both the `design-rite-portal-v2` and `design-rite-v4` repositories.

## Table of Contents

1. [Understanding Claude Code Agents](#understanding-claude-code-agents)
2. [Repository Structure Overview](#repository-structure-overview)
3. [Setting Up Your Agent Infrastructure](#setting-up-your-agent-infrastructure)
4. [Creating Specialized Agents](#creating-specialized-agents)
5. [Using Slash Commands](#using-slash-commands)
6. [Integration with Render API](#integration-with-render-api)
7. [Integration with Supabase CLI](#integration-with-supabase-cli)
8. [Best Practices](#best-practices)

---

## Understanding Claude Code Agents

### What Are Agents?

Claude Code agents are specialized autonomous AI assistants that can be invoked to perform specific tasks. Each agent has:

- **Defined Purpose**: A specific task or workflow (testing, writing, deploying, etc.)
- **Tool Access**: Permissions to use specific tools (Bash, Read, Write, etc.)
- **Autonomy**: Can work independently on multi-step tasks
- **Context Awareness**: Understands your codebase and project structure

### Types of Agents You Can Create

1. **Writing Agent**: Documentation, README files, API docs
2. **Testing Agent**: Run tests, generate test reports, fix failing tests
3. **Git Agent**: Automated commits, pushes, branch management
4. **Deployment Agent**: Deploy to Render, manage environment variables
5. **Database Agent**: Run Supabase migrations, manage schemas
6. **Code Review Agent**: Review PRs, check code quality
7. **Monitoring Agent**: Watch for errors, performance issues

---

## Repository Structure Overview

### Design-Rite Portal V2 (Port 3001)
```
design-rite-portal-v2/
├── src/
│   ├── app/          # Next.js 15 pages (App Router)
│   ├── components/   # React components
│   ├── hooks/        # Custom hooks (useAuth, etc.)
│   └── lib/          # Utilities (Supabase client)
├── supabase/         # Database migrations
├── CLAUDE.md         # Project documentation for Claude
└── package.json      # Dependencies
```

**Key Features**:
- Customer portal for Design-Rite platform
- Supabase authentication (PKCE flow)
- Session transfer to main platform (v4)
- Subscription management with Stripe

### Design-Rite V4 (Port 3000)
```
design-rite-v4/
├── app/              # Next.js 14 pages
├── components/       # React components
├── lib/              # Utilities and helpers
├── scripts/          # Automation scripts
├── supabase/         # Database migrations
├── .ai_agents/       # AI agent coordination (existing)
├── .claude/          # Claude settings (existing)
└── CLAUDE.md         # Project documentation
```

**Key Features**:
- Main security estimation platform
- AI-powered proposal generation
- System Surveyor integration
- Spatial Studio for floorplan analysis

### Integration Points

Both repositories share:
- **Same Supabase Project**: Shared database backend
- **Cross-domain auth**: Session transfer via URL hash
- **Render deployment**: Both hosted on Render.com
- **Stripe integration**: Subscription system

---

## Setting Up Your Agent Infrastructure

### Step 1: Create .claude Directory

For `design-rite-portal-v2`, create the Claude configuration:

```bash
cd C:\Users\dkozi\Projects\design-rite-portal-v2
mkdir .claude
```

### Step 2: Create settings.local.json

This file controls what Claude can do automatically:

```json
{
  "permissions": {
    "allow": [
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(npm run:*)",
      "Bash(npm test:*)",
      "Read(**)",
      "Write(**)",
      "Edit(**)"
    ],
    "deny": [],
    "ask": [
      "Bash(git push origin main:*)",
      "Bash(rm -rf:*)"
    ]
  }
}
```

**Permission Levels**:
- `allow`: Claude executes immediately without asking
- `deny`: Claude is blocked from running these
- `ask`: Claude asks for confirmation first

### Step 3: Create .claude/commands Directory

Slash commands are custom prompts you can invoke quickly:

```bash
mkdir .claude/commands
```

---

## Creating Specialized Agents

### 1. Writing Agent

**Purpose**: Generate documentation, README updates, API documentation

Create `.claude/commands/write-docs.md`:

```markdown
# Write Documentation Agent

You are a specialized documentation agent for the Design-Rite projects.

## Your Tasks:
1. Analyze the codebase to understand recent changes
2. Update README.md files with new features
3. Generate API documentation for new endpoints
4. Create user guides for new functionality
5. Update CLAUDE.md with implementation notes

## Guidelines:
- Use clear, concise language
- Include code examples
- Follow existing documentation style
- Update table of contents
- Add diagrams when helpful (Mermaid syntax)

## Focus Areas:
- Authentication flows
- API endpoints
- Component usage
- Database schema changes
- Deployment procedures

Execute this task autonomously and provide a summary when complete.
```

**Usage**:
```bash
/write-docs
```

### 2. Testing Agent

**Purpose**: Run tests, identify failures, fix issues, generate reports

Create `.claude/commands/test-runner.md`:

```markdown
# Testing Agent

You are a specialized testing agent for Design-Rite projects.

## Your Tasks:
1. Run the test suite: `npm test`
2. Identify failing tests and error messages
3. Analyze root causes of failures
4. Fix broken tests (update mocks, assertions, etc.)
5. Re-run tests to verify fixes
6. Generate a test report

## Test Types:
- Unit tests (Jest)
- Integration tests (API routes)
- Component tests (React Testing Library)
- E2E tests (if configured)

## Test Report Format:
```
# Test Report - [Date]

## Summary
- Total Tests: X
- Passed: X
- Failed: X
- Coverage: X%

## Failed Tests
[List of failed tests with root causes]

## Fixes Applied
[Changes made to resolve failures]

## Recommendations
[Suggestions for improving test coverage]
```

Execute autonomously and provide the report when complete.
```

**Usage**:
```bash
/test-runner
```

### 3. Git Commit & Push Agent

**Purpose**: Automated git operations with smart commit messages

Create `.claude/commands/git-commit-push.md`:

```markdown
# Git Commit & Push Agent

You are a specialized Git automation agent.

## Your Tasks:
1. Run `git status` to see current changes
2. Run `git diff` to review changes
3. Stage relevant files with `git add`
4. Generate a semantic commit message based on changes
5. Create commit with proper format
6. Push to remote repository

## Commit Message Format:
```
<type>(<scope>): <subject>

<body>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Commit Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation only
- style: Formatting, missing semicolons
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance tasks

## Guidelines:
- Never commit secrets or .env files
- Review all changes before committing
- Use descriptive commit messages
- Follow conventional commits standard
- Ask before force pushing

Execute autonomously, but ask before pushing to main/master.
```

**Usage**:
```bash
/git-commit-push
```

### 4. Render Deployment Agent

**Purpose**: Automate deployments using Render API

Create `.claude/commands/deploy-render.md`:

```markdown
# Render Deployment Agent

You are a specialized deployment agent for Render.com.

## Your API Key
`rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS`

## Your Tasks:
1. Trigger deployment via Render API
2. Monitor deployment status
3. Verify deployment success
4. Update environment variables if needed
5. Report deployment status

## Render API Endpoints:

### Trigger Deploy
```bash
curl -X POST https://api.render.com/v1/services/{service_id}/deploys \
  -H "Authorization: Bearer rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS" \
  -H "Content-Type: application/json"
```

### Check Deploy Status
```bash
curl https://api.render.com/v1/services/{service_id}/deploys/{deploy_id} \
  -H "Authorization: Bearer rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS"
```

### Update Environment Variable
```bash
curl -X PUT https://api.render.com/v1/services/{service_id}/env-vars/{key} \
  -H "Authorization: Bearer rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS" \
  -H "Content-Type: application/json" \
  -d '{"value": "new-value"}'
```

## Service IDs:
- Portal V2: [Find in Render dashboard]
- Main V4: [Find in Render dashboard]

## Deployment Checklist:
1. ✅ All tests passing
2. ✅ Git changes committed
3. ✅ Environment variables updated
4. ✅ Database migrations run
5. ✅ Trigger deploy
6. ✅ Monitor logs
7. ✅ Verify deployment

Execute autonomously and provide deployment status.
```

**Usage**:
```bash
/deploy-render
```

### 5. Supabase Migration Agent

**Purpose**: Manage database migrations and schema changes

Create `.claude/commands/supabase-migrate.md`:

```markdown
# Supabase Migration Agent

You are a specialized database migration agent.

## Your Supabase CLI Token
`sbp_c8dda78b7694ccea9c9d5adc1c45c6ff5735a3baV6`

## Your Tasks:
1. Review pending SQL migration files in `supabase/` directory
2. Validate SQL syntax
3. Run migrations using Supabase CLI
4. Verify migration success
5. Generate migration report

## Supabase CLI Commands:

### Login
```bash
supabase login --token sbp_c8dda78b7694ccea9c9d5adc1c45c6ff5735a3baV6
```

### Link Project
```bash
supabase link --project-ref [project-ref]
```

### Run Migration
```bash
supabase db push
```

### Generate Migration
```bash
supabase db diff -f [migration-name]
```

### Check Migration Status
```bash
supabase migration list
```

## Migration Checklist:
1. ✅ Backup existing data
2. ✅ Review SQL changes
3. ✅ Check for breaking changes
4. ✅ Test migration locally
5. ✅ Run migration on production
6. ✅ Verify data integrity
7. ✅ Update RLS policies if needed

## Safety Rules:
- Never drop tables without explicit confirmation
- Always create backups before destructive operations
- Test migrations on local/staging first
- Document schema changes in CLAUDE.md

Execute autonomously but ask before running destructive migrations.
```

**Usage**:
```bash
/supabase-migrate
```

---

## Using Slash Commands

### How Slash Commands Work

1. **Create Command File**: Add `.md` file to `.claude/commands/`
2. **Write Prompt**: Define what the agent should do
3. **Invoke Command**: Type `/command-name` in Claude Code chat
4. **Agent Executes**: Claude reads prompt and executes autonomously

### Example Workflow

```
You: /test-runner
Claude: [Reading test-runner.md prompt]
Claude: Running tests...
Claude: [Executes npm test]
Claude: [Analyzes failures]
Claude: [Fixes broken tests]
Claude: [Re-runs tests]
Claude: [Generates report]
Claude: ✅ Test Report Complete - All tests passing
```

### Advanced: Chaining Commands

Create a master workflow command `.claude/commands/deploy-workflow.md`:

```markdown
# Full Deployment Workflow

Execute these commands in sequence:

1. /test-runner - Ensure all tests pass
2. /git-commit-push - Commit and push changes
3. /supabase-migrate - Run database migrations
4. /deploy-render - Trigger deployment
5. /write-docs - Update documentation

After each step, verify success before proceeding.
Provide a final summary of the entire deployment.
```

---

## Integration with Render API

### Finding Your Service IDs

1. Go to https://dashboard.render.com
2. Click on a service (e.g., "design-rite-portal-v2")
3. Look at the URL: `https://dashboard.render.com/web/srv-XXXXX`
4. `srv-XXXXX` is your service ID

### Common Render API Operations

#### List All Services
```bash
curl https://api.render.com/v1/services \
  -H "Authorization: Bearer rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS"
```

#### Get Service Details
```bash
curl https://api.render.com/v1/services/srv-XXXXX \
  -H "Authorization: Bearer rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS"
```

#### Trigger Deploy
```bash
curl -X POST https://api.render.com/v1/services/srv-XXXXX/deploys \
  -H "Authorization: Bearer rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS"
```

#### Get Deploy Logs
```bash
curl https://api.render.com/v1/services/srv-XXXXX/deploys/dep-XXXXX/logs \
  -H "Authorization: Bearer rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS"
```

### Environment Variable Management

Create a script to update env vars: `scripts/update-render-env.js`

```javascript
const RENDER_API_KEY = 'rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS';
const SERVICE_ID = 'srv-XXXXX'; // Replace with actual service ID

async function updateEnvVar(key, value) {
  const response = await fetch(
    `https://api.render.com/v1/services/${SERVICE_ID}/env-vars/${key}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value })
    }
  );

  return response.json();
}

// Usage
updateEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'https://xxx.supabase.co');
```

---

## Integration with Supabase CLI

### Setting Up Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login with your token
supabase login --token sbp_c8dda78b7694ccea9c9d5adc1c45c6ff5735a3baV6

# Link to your project
supabase link --project-ref ickwrbdpuorzdpzqbqpf
```

### Common Supabase Operations

#### Create Migration
```bash
supabase migration new add_user_roles_table
```

#### Push Migrations
```bash
supabase db push
```

#### Pull Remote Schema
```bash
supabase db pull
```

#### Reset Database (Local)
```bash
supabase db reset
```

#### Generate TypeScript Types
```bash
supabase gen types typescript --local > src/types/database.types.ts
```

### Migration Workflow Script

Create `scripts/run-migration.sh`:

```bash
#!/bin/bash

# Login to Supabase
supabase login --token sbp_c8dda78b7694ccea9c9d5adc1c45c6ff5735a3baV6

# Link project
supabase link --project-ref ickwrbdpuorzdpzqbqpf

# Check pending migrations
echo "Pending migrations:"
supabase migration list

# Push migrations
read -p "Push migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  supabase db push
  echo "✅ Migrations applied"
else
  echo "❌ Migration cancelled"
fi
```

---

## Best Practices

### 1. Security

**DO**:
- ✅ Store API keys in environment variables
- ✅ Use `.gitignore` to exclude sensitive files
- ✅ Rotate API keys periodically
- ✅ Use read-only tokens when possible

**DON'T**:
- ❌ Commit API keys to git
- ❌ Share tokens in documentation
- ❌ Use production keys in local development
- ❌ Grant more permissions than needed

### 2. Agent Design

**DO**:
- ✅ Create single-purpose agents
- ✅ Provide clear task descriptions
- ✅ Include error handling guidelines
- ✅ Specify success criteria

**DON'T**:
- ❌ Create overly complex agents
- ❌ Mix unrelated tasks in one agent
- ❌ Skip safety checks
- ❌ Assume agent context from previous runs

### 3. Testing Agents

**DO**:
- ✅ Test agents on feature branches first
- ✅ Verify agent output manually
- ✅ Start with dry-run mode
- ✅ Review changes before committing

**DON'T**:
- ❌ Run untested agents on main branch
- ❌ Auto-deploy without verification
- ❌ Skip code review
- ❌ Ignore agent errors

### 4. Documentation

**DO**:
- ✅ Document all custom agents
- ✅ Include usage examples
- ✅ Specify prerequisites
- ✅ List required permissions

**DON'T**:
- ❌ Create undocumented agents
- ❌ Assume others know how to use them
- ❌ Skip troubleshooting guides
- ❌ Forget to update docs when agents change

### 5. Git Workflow

**DO**:
- ✅ Use semantic commit messages
- ✅ Review git diff before committing
- ✅ Create feature branches
- ✅ Test before pushing

**DON'T**:
- ❌ Commit directly to main
- ❌ Force push without team agreement
- ❌ Commit build artifacts
- ❌ Skip commit message descriptions

---

## Example Agent Configurations

### Quick Test & Deploy Agent

`.claude/commands/quick-deploy.md`:

```markdown
# Quick Test & Deploy

1. Run `npm test` - ensure all tests pass
2. If tests fail, STOP and report errors
3. If tests pass, run `git status` and `git diff`
4. Create commit with semantic message
5. Push to current branch
6. Ask user if they want to trigger Render deployment
7. If yes, use Render API to deploy
8. Monitor deployment and report status
```

### Database Backup Agent

`.claude/commands/db-backup.md`:

```markdown
# Database Backup Agent

1. Use Supabase CLI to export current schema
2. Save to `supabase/backups/backup-[date].sql`
3. Create a git commit with the backup
4. Report backup location and size
```

### Code Quality Agent

`.claude/commands/code-quality.md`:

```markdown
# Code Quality Agent

1. Run ESLint: `npm run lint`
2. Run TypeScript check: `npx tsc --noEmit`
3. Check for unused dependencies: `npx depcheck`
4. Report all issues found
5. Offer to fix auto-fixable issues
```

---

## Troubleshooting

### Agent Not Responding

**Cause**: Slash command file not found
**Solution**: Verify file exists in `.claude/commands/` and has `.md` extension

### Permission Denied

**Cause**: Command not in `allow` list in `settings.local.json`
**Solution**: Add command to `allow` array or move to `ask` for confirmation

### API Authentication Failed

**Cause**: Invalid or expired API token
**Solution**: Verify token is correct and hasn't expired

### Git Push Rejected

**Cause**: Remote has changes not in local branch
**Solution**: Run `git pull` before pushing, or use `git push --force-with-lease`

---

## Next Steps

1. **Set up infrastructure**: Create `.claude/` directory in portal-v2
2. **Create your first agent**: Start with the writing agent
3. **Test the agent**: Run `/write-docs` and verify output
4. **Expand gradually**: Add more agents as you identify repetitive tasks
5. **Share with team**: Document agents and workflow in README

---

## Resources

- **Render API Docs**: https://render.com/docs/api
- **Supabase CLI Docs**: https://supabase.com/docs/reference/cli
- **Claude Code Docs**: https://docs.claude.com/en/docs/claude-code
- **Conventional Commits**: https://www.conventionalcommits.org

---

**Created**: 2025-10-14
**Author**: Claude Code
**Version**: 1.0
