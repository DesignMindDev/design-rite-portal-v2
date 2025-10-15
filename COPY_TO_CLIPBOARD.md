# Specialized Agents Setup - Copy This

## What I Created for You

I've set up a complete specialized agents system for your Design-Rite projects. Here's what's ready to use:

### 📁 Files Created

**In `design-rite-portal-v2`:**
```
.claude/
├── settings.local.json              # Permissions configuration
└── commands/
    ├── write-docs.md                # Documentation agent
    ├── test-runner.md               # Testing agent
    ├── git-commit-push.md           # Git automation agent
    └── deploy-render.md             # Render deployment agent

SPECIALIZED_AGENTS_GUIDE.md          # Complete documentation (15+ pages)
AGENTS_QUICK_REFERENCE.md            # One-page cheat sheet
COPY_TO_CLIPBOARD.md                 # This file
```

---

## 🚀 Quick Start

### 1. Try Your First Agent

Open Claude Code in the portal-v2 project and type:

```
/write-docs
```

Claude will automatically:
- Analyze recent git commits
- Update README.md
- Update CLAUDE.md
- Generate API documentation
- Report what was changed

### 2. Run Tests Before Committing

```
/test-runner
```

Claude will:
- Run `npm test`
- Fix any failing tests
- Re-run tests
- Generate a test report

### 3. Commit and Push Changes

```
/git-commit-push
```

Claude will:
- Review changes with `git status` and `git diff`
- Generate a semantic commit message
- Create the commit
- Push to remote (asks first if main branch)

### 4. Deploy to Production

```
/deploy-render
```

Claude will:
- Run pre-deployment checks (tests, build, etc.)
- Trigger Render deployment via API
- Monitor deployment progress
- Report success/failure

---

## 🔑 Your API Keys (Already Configured)

### Render API
```
rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS
```

### Supabase CLI Token
```
sbp_c8dda78b7694ccea9c9d5adc1c45c6ff5735a3baV6
```

These are embedded in the agent configurations, so you don't need to provide them each time.

---

## 📋 Common Workflows

### Full Development Cycle
```
1. Make code changes
2. /test-runner           → Ensure all tests pass
3. /write-docs            → Update documentation
4. /git-commit-push       → Commit with semantic message
5. /deploy-render         → Deploy to production
```

### Quick Bug Fix
```
1. Fix the bug
2. /test-runner           → Verify fix works
3. /git-commit-push       → Commit and push
```

### Documentation Update
```
1. Add new feature
2. /write-docs            → Auto-generate documentation
3. Review and refine
4. /git-commit-push       → Commit docs
```

---

## 🎯 What Each Agent Does

### `/write-docs`
**Purpose**: Automated documentation generation

**Updates**:
- README.md with new features
- CLAUDE.md with technical notes
- API documentation for endpoints
- Component documentation

**When to Use**:
- After adding features
- After changing APIs
- Before deploying
- Monthly maintenance

---

### `/test-runner`
**Purpose**: Automated testing and fixing

**Does**:
- Runs full test suite
- Identifies failures
- Fixes broken tests
- Generates coverage report

**When to Use**:
- Before every commit
- After refactoring
- Before deploying
- When tests fail

---

### `/git-commit-push`
**Purpose**: Smart git automation

**Does**:
- Reviews all changes
- Generates semantic commit messages
- Creates commits with proper format
- Pushes to remote safely

**Commit Format**:
```
feat(auth): implement PKCE flow for Supabase

Added PKCE flow for enhanced security in authentication.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**When to Use**:
- After completing features
- After bug fixes
- When ready to share code
- End of work session

---

### `/deploy-render`
**Purpose**: Automated production deployment

**Does**:
- Pre-deployment checks (tests, build, lint)
- Triggers Render API deployment
- Monitors deployment progress
- Verifies deployment success
- Generates deployment report

**When to Use**:
- After testing locally
- After code review
- For production releases
- For hotfixes

---

## 🔧 Render API Quick Reference

### List Your Services
```bash
curl https://api.render.com/v1/services \
  -H "Authorization: Bearer rnd_1u8gtAIn1U8ymoLOAGUnrRc6NqS"
```

### Trigger Deployment
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

**Find Service ID**:
- Go to Render dashboard
- Click on service
- URL will be: `https://dashboard.render.com/web/srv-XXXXX`
- `srv-XXXXX` is your service ID

---

## 💻 Supabase CLI Quick Reference

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

### Generate TypeScript Types
```bash
supabase gen types typescript --local > src/types/database.types.ts
```

---

## 🛡️ Permissions Configured

### Allowed Automatically
✅ Git operations (status, diff, log, add, commit)
✅ npm commands (run, test, install)
✅ File operations (read, write, edit)
✅ Supabase CLI commands
✅ curl for API calls

### Requires Your Confirmation
⚠️ Push to main/master branch
⚠️ Force push (with lease)
⚠️ git reset --hard
⚠️ Deleting files
⚠️ Uninstalling packages
⚠️ Database resets

### Blocked for Safety
❌ rm -rf (destructive delete)
❌ git push --force (without lease)
❌ Uninstalling React or Next.js

---

## 📖 Documentation Reference

### Full Guide
See `SPECIALIZED_AGENTS_GUIDE.md` for:
- Detailed agent explanations
- Creating custom agents
- Advanced workflows
- Troubleshooting
- Best practices
- Security guidelines

### Quick Reference
See `AGENTS_QUICK_REFERENCE.md` for:
- One-page cheat sheet
- Command syntax
- Common workflows
- API quick reference

---

## 🎨 Creating Your Own Agents

### Example: Security Scan Agent

1. Create file: `.claude/commands/security-scan.md`

2. Add content:
```markdown
---
description: Scan for security vulnerabilities and secrets
---

# Security Scan Agent

## Your Tasks
1. Run `npm audit` to check for vulnerabilities
2. Scan code for hardcoded secrets (API keys, passwords)
3. Check for .env files in git
4. Verify dependencies are up to date
5. Generate security report

## Report Format
- List all vulnerabilities found
- Severity levels (critical, high, medium, low)
- Recommended fixes
- Files containing potential secrets

Execute autonomously and provide report.
```

3. Save file

4. Use with: `/security-scan`

---

## 🔥 Example Session

```
You: /test-runner

Claude: Running test suite...
Claude: Found 2 failing tests:
  - auth.test.ts - Mock not returning expected data
  - dashboard.test.tsx - Component not rendering

Claude: Fixing auth.test.ts...
Claude: Updated mock implementation

Claude: Fixing dashboard.test.tsx...
Claude: Added missing provider wrapper

Claude: Re-running tests...
Claude: ✅ All 47 tests passing

Claude: Test Report:
  Total: 47 tests
  Passed: 47 (100%)
  Failed: 0
  Coverage: 82%

You: /git-commit-push

Claude: Reviewing changes...
Claude: Detected changes in:
  - src/__tests__/auth.test.ts
  - src/__tests__/dashboard.test.tsx

Claude: Generating commit message...

Claude: Commit created:
  "test: fix mock implementations in auth and dashboard tests

  Updated mock return values to match expected data structure.
  Added provider wrapper to dashboard component test.

  🤖 Generated with Claude Code
  Co-Authored-By: Claude <noreply@anthropic.com>"

Claude: Push to main branch? (y/n)

You: y

Claude: ✅ Pushed to origin/main

You: Great! Now let's deploy

You: /deploy-render

Claude: Running pre-deployment checks...
Claude: ✅ Tests passed
Claude: ✅ Build successful
Claude: ✅ Git committed
Claude: ✅ Environment variables verified

Claude: Trigger deployment to production? (y/n)

You: y

Claude: Triggering Render deployment...
Claude: Service ID: srv-abc123
Claude: Deploy ID: dep-xyz789

Claude: Monitoring deployment...
Claude: [10s] Build in progress...
Claude: [30s] Build completed
Claude: [45s] Deploying to production...
Claude: [60s] Deployment live!

Claude: ✅ Deployment successful
Claude: Live at: https://portal.design-rite.com
Claude: Status: 200 OK
```

---

## 💡 Pro Tips

1. **Chain commands**: Run multiple agents in sequence
   ```
   /test-runner && /write-docs && /git-commit-push
   ```

2. **Ask for help**: Agents can explain what they're doing
   ```
   You: Explain what /deploy-render will do
   Claude: [Provides detailed explanation]
   ```

3. **Customize agents**: Edit .md files to change behavior

4. **Review output**: Always review what agents did before confirming critical actions

5. **Use for learning**: Watch agents work to learn best practices

---

## 🚨 Important Notes

1. **API Keys**: Already embedded in agents, don't share publicly
2. **Safety**: Agents ask before destructive operations
3. **Review**: Always review changes before confirming pushes
4. **Backups**: Git history is your backup, commit often
5. **Testing**: Test locally before deploying to production

---

## 📞 Getting Help

### Documentation
- Full guide: `SPECIALIZED_AGENTS_GUIDE.md`
- Quick reference: `AGENTS_QUICK_REFERENCE.md`
- Project docs: `CLAUDE.md` and `README.md`

### External Resources
- Render API: https://render.com/docs/api
- Supabase CLI: https://supabase.com/docs/reference/cli
- Claude Code: https://docs.claude.com/en/docs/claude-code

### Ask Claude
Claude can help you:
- Understand what agents do
- Troubleshoot issues
- Create custom agents
- Optimize workflows

---

## ✅ Next Steps

1. **Try /write-docs**
   - See how documentation is auto-generated
   - Review the output

2. **Run /test-runner**
   - Experience automated testing
   - See how Claude fixes failures

3. **Use /git-commit-push**
   - Let Claude generate semantic commits
   - See proper git workflow

4. **Deploy with /deploy-render**
   - Experience automated deployment
   - Watch deployment monitoring

5. **Create custom agent**
   - Make your own agent for a specific task
   - Experiment with automation

6. **Share with team**
   - Show team the agent system
   - Create team-specific agents

---

**Created**: 2025-10-14
**For**: Design-Rite Portal V2 & V4
**By**: Claude Code

**Ready to use!** Just type `/agent-name` in Claude Code.
