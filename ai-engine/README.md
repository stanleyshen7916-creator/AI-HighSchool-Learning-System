# AI Engine

Status: Foundation (EO-MIG-002) — no service is implemented yet.

## Purpose

The single entry point for every AI feature in the platform. Per the
locked Architecture (`Platform -> AI Engine -> Provider -> LLM`), the
Platform layer never calls an LLM provider directly; it always goes
through `AHS.AIEngine.AIEngine`.

## Folder Structure

```
ai-engine/
  README.md
  src/
    core/
      AIEngine.js          — provider/service registry, the entry point
      AIEngineFactory.js    — single-instance access to AIEngine
      AIService.js          — abstract base for every service
    providers/
      BaseProvider.js       — abstract Provider interface (no LLM connection)
    services/
      summary/   question/  review/  explanation/
      tutor/     knowledge/ prompt/
      (empty — one future EO per service)
    common/
      Constants.js           — reserved service/provider ids
      Errors.js               — shared error types
      Version.js               — AI Engine layer version
```

## Public API (Reserved)

Foundation-only surface; no provider or service is registered yet.

- `AHS.AIEngine.AIEngineFactory.getInstance()` — returns the singleton `AIEngine`
- `AIEngine.registerProvider(provider)` / `AIEngine.getProvider(id)`
- `AIEngine.registerService(service)` / `AIEngine.getService(id)`
- `AHS.AIEngine.BaseProvider` — interface every provider extends
- `AHS.AIEngine.AIService` — interface every service extends

## Version

`AHS.AIEngine.VERSION` — see `src/common/Version.js`.
