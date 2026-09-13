---
name: good-readme
description: Generate and improve README files that help users understand and use their projects effectively
---

# Good README Skill

## Overview
Create or improve README files that are clear, accurate, and genuinely useful for the project's audience.

## Workflow

### Create Mode (no README exists)
1. **Read the source code** — don't guess. Examine the project structure, configuration files, entry points, and key modules.
2. **Identify the audience** — developers, end users, operators, or all of the above.
3. **Write sections** based on the Anatomy reference in order. Start with what users need first.
4. **Self-check** against the Quality Checklist before presenting.

### Improve Mode (README exists)
1. **Read the current README** — note what's good and what's missing.
2. **Read the source code** — verify every claim. Remove inaccuracies.
3. **Apply the Anatomy** — add missing sections, reorder by importance.
4. **Score it** — use the rubric. Show the before/after score.
5. **Make changes** — edit the existing file, preserving what works.

### Audit Mode (quality review only)
1. Read the README and codebase.
2. Score using the rubric below.
3. Report findings with specific, actionable recommendations. No code changes.

## Anatomy (Section Order)

1. **Title** — the project name, ideally with a short context clue
2. **One-liner** — one sentence that answers "what is this?"
3. **Badges** — only CI status and version/license. No service badges unless critical to usage.
4. **Features** — what the project does, in plain language
5. **Prerequisites** — what the user needs before installing
6. **Installation** — step-by-step, tested commands
7. **Quick Start** — get to the interesting result in under 2 minutes
8. **Usage** — how to use the project, with examples
9. **Configuration** — environment variables, config files, options
10. **API Reference** — if applicable
11. **Project Structure** — directory layout with brief descriptions
12. **Testing** — how to run tests
13. **Contributing** — how to help (or note that contributions aren't accepted)
14. **License** — which license applies
15. **Author/Owner** — who maintains this

Optional (add when relevant):
- FAQ / Troubleshooting
- Changelog (link or inline)
- Deployment
- Screenshots / Demo

## Quality Checklist

### Clarity
- [ ] One-liner answers "what is this?" without requiring code reading
- [ ] No jargon without explanation
- [ ] Each section has a clear purpose
- [ ] Examples are runnable, not pseudocode

### Accuracy
- [ ] Every claim is verified against the actual codebase
- [ ] Installation steps work from a clean clone
- [ ] Environment variables match what the code actually reads
- [ ] Commands match package.json scripts
- [ ] File paths match the actual project structure

### Completeness
- [ ] Installation works from scratch
- [ ] Usage shows the primary workflow
- [ ] Configuration covers all required and common optional variables
- [ ] License is stated
- [ ] Testing instructions work

### Brevity
- [ ] No duplicate information across sections
- [ ] No implementation details users don't need
- [ ] Each sentence earns its place

## Anti-Patterns

1. **"Coming soon" / "TBD"** — either write it or remove the section
2. **Screenshots of code** — use code blocks instead
3. **Assuming knowledge** — explain what tools/concepts are, briefly
4. **Incomplete installation** — "install dependencies" without saying how
5. **No verification** — "run the tests" without showing how to check they pass
6. **Wall of text** — use headers, lists, and code blocks to break up content

## Scoring Rubric

Rate each dimension 1-5, then average:

| Dimension | 1 (Poor) | 3 (Adequate) | 5 (Excellent) |
|-----------|----------|---------------|----------------|
| **Accuracy** | Multiple factual errors | Minor inaccuracies | All claims verified |
| **Completeness** | Missing critical sections | Most sections present | All relevant sections covered |
| **Clarity** | Confusing, jargon-heavy | Readable with some unclear parts | Crystal clear to target audience |
| **Brevity** | Redundant, verbose | Some bloat | Every sentence earns its place |
| **Freshness** | Outdated info | Mostly current | Matches current codebase |

**Quality Score**: average of all dimensions. Below 3 needs work, 3-4 is good, 4+ is excellent.
