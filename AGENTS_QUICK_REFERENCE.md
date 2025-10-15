# Claude Code Agents - Quick Reference

A one-page cheat sheet for using specialized agents in the Design-Rite projects.

## Quick Start

1. **Navigate to project**:
   ```bash
   cd C:\Users\dkozi\Projects\design-rite-portal-v2
   ```

2. **Invoke an agent**:
   Type `/agent-name` in Claude Code chat

3. **Available agents**:
   - `/write-docs` - Update documentation
   - `/test-runner` - Run tests and fix failures
   - `/git-commit-push` - Commit and push changes
   - `/deploy-render` - Deploy to Render.com

---

## Agent Commands

### `/write-docs`
**What it does**: Analyzes recent changes and updates documentation

**Use when**:
- You added a new feature
- You changed the API
- You updated dependencies
- You need to document architecture

**What it updates**:
- README.md
- CLAUDE.md
- API documentation
- Component docs

**Example**:
```
You: /write-docs
Claude: [Analyzes git log]
Claude: [Updates README with new feature]
Claude: [Documents new API endpoint]
Claude: ✅ Documentation updated
```

---

### `/test-runner`
**What it does**: Runs tests, identifies failures, fixes issues, generates report

**Use when**:
- Before committing code
- After making changes
- Before deploying
- Debugging test failures

**What it does**:
1. Runs `npm test`
2. Analyzes failures
3. Fixes broken tests
4. Re-runs tests
5. Generates report

**Example**:
```
You: /test-runner
Claude: Running npm test...
Claude: Found 3 failing tests
Claude: Fixing mock in auth.test.ts
Claude: Re-running tests...
Claude: ✅ All tests passing
```

---

### `/git-commit-push`
**What it does**: Reviews changes, creates semantic commit, pushes to remote

**Use when**:
- You're ready to commit changes
- You want a proper commit message
- You need to push to remote

**What it does**:
1. Runs `git status` and `git diff`
2. Analyzes changes
3. Generates semantic commit message
4. Creates commit
5. Pushes to remote (asks first if main/master)

**Commit Format**:
```
feat(scope): Add new feature

Detailed description of changes.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Example**:
```
You: /git-commit-push
Claude: Reviewing changes...
Claude: Changes detected in auth system
Claude: Creating commit: "feat(auth): implement PKCE flow"
Claude: Push to main branch? (y/n)
You: y
Claude: ✅ Pushed to origin/main
```

---

### `/deploy-render`
**What it does**: Deploys to Render.com, monitors status, reports results

**Use when**:
- Code is tested and committed
- Ready for production deployment
- Need to update live site

**What it does**:
1. Runs pre-deployment checks
2. Triggers Render deployment via API
3. Monitors deployment progress
4. Verifies deployment success
5. Generates deployment report

**Example**:
```
You: /deploy-render
Claude: Running pre-deployment checks...
Claude: ✅ Tests pass
Claude: ✅ Git committed
Claude: Trigger deployment? (y/n)
You: y
Claude: Deploying to Render...
Claude: Build in progress...
Claude: ✅ Deploy successful
Claude: Live at: https://portal.design-rite.com
```

---

## Common Workflows

### Full Development Workflow
```
1. Make code changes
2. /test-runner           # Ensure tests pass
3. /write-docs            # Update documentation
4. /git-commit-push       # Commit and push
5. /deploy-render         # Deploy to production
```

### Quick Fix Workflow
```
1. Fix bug
2. /test-runner           # Verify fix
3. /git-commit-push       # Commit fix
```

### Documentation Update
```
1. Add new feature
2. /write-docs            # Auto-generate docs
3. Review and refine docs manually
4. /git-commit-push       # Commit docs
```

---

## API Keys Reference

### Render API
```
rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS
```

### Supabase CLI Token
```
sbp_c8dda78b7694ccea9c9d5adc1c45c6ff5735a3baV6
```

**⚠️ Security**: These keys are for your use only. Never commit them to git.

---

## Render API Quick Commands

### List Services
```bash
curl https://api.render.com/v1/services \
  -H "Authorization: Bearer rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS"
```

### Trigger Deploy
```bash
curl -X POST https://api.render.com/v1/services/{service_id}/deploys \
  -H "Authorization: Bearer rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS" \
  -H "Content-Type: application/json"
```

### Check Status
```bash
curl https://api.render.com/v1/services/{service_id}/deploys/{deploy_id} \
  -H "Authorization: Bearer rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS"
```

---

## Supabase CLI Quick Commands

### Login
```bash
supabase login --token sbp_c8dda78b7694ccea9c9d5adc1c45c6ff5735a3baV6
```

### Link Project
```bash
supabase link --project-ref ickwrbdpuorzdpzqbqpf
```

### Push Migrations
```bash
supabase db push
```

### Generate Types
```bash
supabase gen types typescript --local > src/types/database.types.ts
```

---

## Git Commit Types

| Type | When to Use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code formatting |
| `refactor` | Code restructuring |
| `test` | Adding/updating tests |
| `chore` | Maintenance (deps, config) |
| `perf` | Performance improvement |

---

## Permissions Reference

### Allowed Automatically
- Git status/diff/log/branch
- Git add/commit
- npm run/test/install
- File read/write/edit
- curl commands
- Supabase commands

### Requires Confirmation
- Push to main/master
- Force push
- git reset --hard
- git clean
- npm uninstall
- supabase db reset

### Blocked
- rm -rf
- git push --force (without lease)
- Uninstall react/next

---

## Troubleshooting

### Agent Not Responding
**Cause**: Command file not found
**Fix**: Check `.claude/commands/` directory

### Permission Denied
**Cause**: Command not in allow list
**Fix**: Update `.claude/settings.local.json`

### Push Rejected
**Cause**: Remote has changes
**Fix**: Run `git pull` first

### API Authentication Failed
**Cause**: Invalid token
**Fix**: Verify API key is correct

---

## File Locations

```
design-rite-portal-v2/
├── .claude/
│   ├── settings.local.json          # Permissions config
│   └── commands/
│       ├── write-docs.md            # Documentation agent
│       ├── test-runner.md           # Testing agent
│       ├── git-commit-push.md       # Git agent
│       └── deploy-render.md         # Deployment agent
├── SPECIALIZED_AGENTS_GUIDE.md      # Full documentation
└── AGENTS_QUICK_REFERENCE.md        # This file
```

---

## Tips & Best Practices

1. **Test before committing**: Always run `/test-runner` first
2. **Document as you go**: Use `/write-docs` after adding features
3. **Semantic commits**: Let agents generate proper commit messages
4. **Review changes**: Check agent output before confirming
5. **Chain agents**: Run multiple agents in sequence for workflows
6. **Ask questions**: Agents can explain what they're doing

---

## Getting Help

- **Full Guide**: See `SPECIALIZED_AGENTS_GUIDE.md`
- **Project Docs**: See `CLAUDE.md` and `README.md`
- **Render Docs**: https://render.com/docs/api
- **Supabase Docs**: https://supabase.com/docs/reference/cli
- **Claude Code**: https://docs.claude.com/en/docs/claude-code

---

## Creating Custom Agents

1. Create file: `.claude/commands/my-agent.md`
2. Add front matter:
   ```markdown
   ---
   description: What this agent does
   ---
   ```
3. Write instructions for what agent should do
4. Save file
5. Use with `/my-agent`

**Example**:
```markdown
---
description: Check for security vulnerabilities
---

# Security Scan Agent

Run npm audit and report vulnerabilities.
Check for hardcoded secrets.
Verify dependencies are up to date.
```

---

**Last Updated**: 2025-10-14
**Version**: 1.0
**For**: Design-Rite Portal V2 & V4
