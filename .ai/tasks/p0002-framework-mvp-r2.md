# P0002 Framework MVP — R2 Engineering Task

Status: DESIGN_REVIEWED
Owner workflow: GPT → Codex
Risk: R2 (Complex)
Repository: sxtaosdo/ComposableGameFramework
Base branch: main
Execution branch: gpt/p0002-framework-mvp-r2

## 1. Goal

Advance P0002 from a mostly DESIGN_ONLY framework to a usable Framework MVP that can serve as the technical base for a first real Cocos Creator game.

“Usable” means the repository has a coherent, tested, engine-independent core; a minimal feature runtime; minimal data/save support; a minimal Cocos Creator 3.8+ adapter boundary; and one executable vertical slice proving the framework can drive a real game loop without modifying Foundation Core.

This task is NOT to finish the full Legend/Diablo/LifeSim framework.

## 2. Current baseline

At task creation time:
- Framework top-level status is DESIGN_ONLY.
- Only `core.entity-identity-registry` is IMPLEMENTED.
- Existing source is limited to the first Foundation Core slice (`EntityId`, `EntityRegistry`, `Result`) plus tests.
- Command/Query/Event, Feature Runtime, Save, Data, Cocos adapter and gameplay features are still design-only.

Codex MUST re-read the actual repository before implementation and treat Git HEAD as the source of truth.

## 3. Mandatory read order

Before editing, read:
1. `AGENTS.md`
2. `README.md`
3. `VERSION`
4. `manifest.json`
5. `package.json`
6. relevant architecture documents under `01-architecture/`, `04-infrastructure/`, `05-cocos/`, and `08-roadmap/`

Do not treat DESIGN_ONLY documentation as implemented behavior.

## 4. Architecture decisions

### 4.1 Foundation Core

Implement only the minimum reusable core required by the MVP:
- Entity Identity / Registry (preserve and extend only when necessary)
- Tag primitive
- Structured error model
- Clock abstraction suitable for deterministic headless tests
- Random source abstraction with deterministic seeded implementation for tests/runtime use
- Command / Query / Event contracts and minimal dispatch runtime
- Lifecycle contracts
- Dependency declaration and deterministic dependency resolution
- Registry/capability primitives needed by Feature Runtime

Constraints:
- No Cocos imports in Foundation Core.
- No product/gameplay vocabulary such as Combat, Inventory, Farming, Diablo, Legend.
- No speculative “universal framework” abstractions.
- Prefer explicit contracts and small composable primitives.

### 4.2 Command / Query / Event

The MVP protocol must:
- distinguish Command, Query and Event semantics;
- use typed identifiers/contracts;
- return structured failures rather than implicit exceptions for expected domain/runtime failures;
- support deterministic headless execution;
- avoid a global mutable singleton bus;
- prevent Feature internals from becoming the cross-feature API.

Do NOT add distributed messaging, networking, persistence queues or replay infrastructure in this task.

### 4.3 Feature Runtime

Implement a minimal Feature model with:
- stable Feature ID;
- explicit dependencies;
- deterministic dependency order;
- cycle detection;
- register/activate/deactivate lifecycle;
- capability registration/discovery needed by assembly;
- predictable cleanup on deactivation/failure;
- no direct dependency on Cocos Node or engine objects.

A Feature may depend on declared framework contracts/capabilities, not another Feature’s private implementation object.

### 4.4 Data / Config

Implement only the minimum boundary required for the sample:
- typed/config validation boundary;
- immutable or read-only runtime config exposure where practical;
- structured config errors;
- no editor tooling and no general-purpose DSL.

Do not introduce a large schema framework unless repository evidence shows it is necessary.

### 4.5 Save MVP

Implement a minimal coordinated save boundary:
- Framework-level snapshot coordination;
- Feature-owned save contribution/state section;
- restore from snapshot;
- deterministic serialization shape;
- structured failure handling;
- no Feature writes files/storage directly.

Out of scope:
- cloud save;
- encryption;
- full production migration framework;
- multi-slot UX;
- platform storage integrations beyond what is strictly required to prove the boundary.

### 4.6 Cocos Creator Adapter

Add the first real engine adapter for Cocos Creator 3.8+.

Required proof points:
- framework core does not import `cc`;
- adapter owns engine-specific types;
- explicit boot/shutdown boundary;
- frame/update bridge to framework clock/runtime as required;
- only minimal input/presentation/node binding required by the sample;
- game state authority remains in framework/product state, not Cocos Node state.

Do not implement a broad ECS, physics abstraction, resource framework, networking layer or editor extension in this task unless the vertical slice strictly requires a minimal seam.

### 4.7 Vertical Slice

Use a small Tile-Match / puzzle-style minigame vertical slice as the proof product because it is cheaper and less domain-specific than an ARPG while still validating composition.

The vertical slice must prove this path:

Framework Boot
→ Feature Assembly
→ level/config load
→ Command
→ Ruleset/state transition
→ Event(s)
→ Query/read model
→ Save Snapshot
→ Restore
→ Shutdown

The sample must:
- be data-driven at the level-definition boundary;
- run core rules headlessly;
- avoid RPG Features;
- avoid modifying Foundation Core for product-specific behavior;
- demonstrate at least one replaceable ruleset/policy seam;
- include a minimal Cocos-facing integration demonstrating the engine adapter boundary.

The sample does NOT need production art, monetization, menus, progression meta, ads, analytics or multiple polished levels.

## 5. Public API

Create a stable package-facing API so product code does not import arbitrary framework internals by relative path.

Requirements:
- explicit exports;
- no accidental export of private implementation helpers;
- preserve layer direction;
- update manifest public API only for capabilities actually implemented.

## 6. Implementation strategy

This is one R2 run, not multiple GPT/Codex rounds.

Codex may internally implement in milestones:
1. Foundation Core MVP
2. CQE + Feature Runtime
3. Data + Save MVP
4. Cocos Adapter
5. Tile-Match vertical slice
6. documentation / manifest / evidence closure

Codex should test continuously, but should not return to GPT after every milestone unless a true architecture contradiction is discovered.

## 7. Explicit non-goals

Do NOT implement in this task:
- full Hybrid ECS;
- complete Combat/AI/Quest/Loot/Farming/Relationship systems;
- Legend/Diablo/LifeSim vertical slices;
- multiplayer/networking/server framework;
- editor tools;
- generic scripting language;
- full save migration system;
- large-scale open-world streaming;
- AI Game Studio production integration beyond keeping existing contracts compatible;
- unrelated refactors.

## 8. Acceptance criteria

The task can be marked implementation-complete only if ALL applicable criteria have evidence.

### A. Build/Test
- Node.js 22 environment used.
- `pnpm typecheck` passes.
- `pnpm test` passes.
- `pnpm build` passes.
- `git diff --check` passes.

### B. Foundation Core
- no `cc` import in core;
- deterministic Clock and Random behavior covered by tests;
- CQE semantics covered by tests;
- dependency cycle failure covered by tests;
- deterministic dependency resolution covered by tests;
- structured expected failures covered by tests.

### C. Feature Runtime
- feature register/activate/deactivate covered by tests;
- dependency order covered by tests;
- cycle detection covered by tests;
- deactivate/reactivate or equivalent lifecycle restoration covered;
- cleanup/failure path covered;
- cross-feature interaction uses declared contracts/capabilities rather than private implementation references.

### D. Save/Data
- valid config accepted and invalid config produces structured error;
- snapshot captures Feature-owned state without Feature direct storage writes;
- restore reproduces expected headless game state;
- serialization is deterministic for the tested state.

### E. Vertical Slice
- headless sample can execute a complete playable-rule flow;
- command causes deterministic state transition;
- at least one event/query is exercised;
- snapshot then restore reproduces the expected state;
- ruleset/policy seam can be replaced without modifying Foundation Core;
- no RPG Feature dependency;
- Cocos adapter integration exists and demonstrates boot/update-or-input/presentation/shutdown boundary as appropriate.

### F. Architecture
- Foundation Core contains no product-specific logic;
- Cocos-specific code is isolated to adapter/integration area;
- no circular layer dependency;
- product/sample does not need to modify protected Core to work;
- public API is explicit and minimal.

### G. Manifest / Evidence / Docs
- `VERSION`, `manifest.json.framework.version`, and `CHANGELOG.md` remain consistent;
- only actually implemented capabilities are promoted from DESIGN_ONLY;
- IMPLEMENTED/VERIFIED claims have evidence paths and source revision/receipt data consistent with repository conventions;
- framework top-level status must not be promoted beyond what the evidence supports;
- README/roadmap/acceptance docs are updated only where implementation status materially changed;
- quick-start documentation explains how a new product consumes the Framework MVP.

## 9. Evidence package for GPT final review

Before final GPT review, freeze the implementation state and provide:
- base SHA;
- review HEAD SHA or immutable review commit/reference;
- changed paths;
- final diff or `base..head` reference;
- exact Node/pnpm versions;
- outputs/results for typecheck/test/build/diff-check;
- headless vertical-slice execution evidence;
- Cocos adapter verification evidence, clearly distinguishing compile/static verification from actual Creator runtime verification;
- acceptance-criterion → evidence mapping;
- manifest status changes;
- known limitations and residual risks;
- confirmation that no commit/push/deploy beyond the agreed review branch was performed unless explicitly authorized.

## 10. GPT review gate

After Codex reaches FREEZE, GPT performs one independent final review.

Decision:
- PASS: no P0/P1 findings and acceptance evidence is sufficient.
- BLOCK: any P0/P1, unsupported implementation claim, architecture boundary violation, or missing critical evidence.

P2 improvements do not block Framework MVP unless they invalidate an acceptance criterion.

## 11. Codex execution instruction

Run this as one R2 task using the installed `$gpt-codex-engineering` workflow.

Codex is the only code implementer and repository execution agent. GPT owns design challenge and final evidence review. Do not ask GPT to write implementation patches by default.

Stop at FREEZE and return the evidence package for final GPT review. Do not merge, deploy, or publish.
