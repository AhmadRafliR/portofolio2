@AGENTS.md

## Claude Code extras

- File lookups: delegate "where is X / what does Y do" to the `scout` subagent (`.claude/agents/scout.md`, Haiku,
  read-only, answers from `docs/agent/codemap.md` first) instead of reading files into the main context.
- Before reporting work done: use the `verify` skill (`.claude/skills/verify/SKILL.md`).
- Preview servers: `.claude/launch.json` → `portfolio` (dev :5173), `portfolio-prod` (preview :4173, build first).
