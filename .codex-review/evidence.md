{
  "delivery_commit": null,
  "fingerprint": {
    "acceptance_status": "PASS",
    "changed_paths": [
      "CHANGELOG.md",
      "README.md",
      "VERSION",
      "assets/adapters/cocos/index.ts",
      "assets/data/config.ts",
      "assets/data/index.ts",
      "assets/examples/tile-match/run.ts",
      "assets/examples/tile-match/tileMatch.ts",
      "assets/foundation-core/entityId.ts",
      "assets/foundation-core/entityRegistry.ts",
      "assets/foundation-core/index.ts",
      "assets/foundation-core/messaging.ts",
      "assets/index.ts",
      "assets/minigame/index.ts",
      "assets/runtime/capabilityRegistry.ts",
      "assets/runtime/featureRuntime.ts",
      "assets/runtime/index.ts",
      "assets/save/index.ts",
      "assets/save/saveCoordinator.ts",
      "manifest.json",
      "package.json",
      "scripts/normalize-dist-imports.mjs",
      "scripts/validate-engineering-standards.mjs",
      "tests/examples/tileMatch.test.ts"
    ],
    "child_run_files": [],
    "child_run_hash": "6ccfa728f92c40f657a283b4b65ec34b11af0ee6556a548934234f4ae5fa6b08",
    "diff_hash": "358d808baeab275b3703cc35af27d2923d53055878867f1fdb7500d431cc3492",
    "evidence_files": [
      "/Users/sxt/.codex/workflow-runs/b87d57e6dc5b/p0002-creator-resolver-validation.md"
    ],
    "evidence_hash": "d8fef55d39a57c113083ea9d3a57d51b6f88fe8c472894dbd3cf6c3139c00804",
    "frozen_at": "2026-09-10T03:14:48+00:00",
    "gitlinks": {},
    "outside_scope_dirty_paths": [],
    "pending_paths": [
      "CHANGELOG.md",
      "README.md",
      "VERSION",
      "assets/adapters/cocos/index.ts",
      "assets/data/config.ts",
      "assets/data/index.ts",
      "assets/examples/tile-match/run.ts",
      "assets/examples/tile-match/tileMatch.ts",
      "assets/foundation-core/entityId.ts",
      "assets/foundation-core/entityRegistry.ts",
      "assets/foundation-core/index.ts",
      "assets/foundation-core/messaging.ts",
      "assets/index.ts",
      "assets/minigame/index.ts",
      "assets/runtime/capabilityRegistry.ts",
      "assets/runtime/featureRuntime.ts",
      "assets/runtime/index.ts",
      "assets/save/index.ts",
      "assets/save/saveCoordinator.ts",
      "manifest.json",
      "package.json",
      "scripts/normalize-dist-imports.mjs",
      "scripts/validate-engineering-standards.mjs",
      "tests/examples/tileMatch.test.ts"
    ],
    "review_input_hash": "eae986bc361e6ef454065f507a4ea8c9f999320fd1f79dc4350112f98868a129",
    "task_contract_files": [],
    "task_contract_hash": "5508160434e74fb80247c695d1621e1fd865d376eb6a2db9ba6ccb314918f92d",
    "validation": "PASS"
  },
  "local_validation_evidence": [
    {
      "content": "# P0002 Creator resolver fix validation\n\n- `pnpm --config.engine-strict=false typecheck`: PASS.\n- `pnpm --config.engine-strict=false test`: PASS; 8 files and 32 tests.\n- `pnpm --config.engine-strict=false build`, `contracts`, `standards`, and `sample:headless`: PASS.\n- `git diff --check`: PASS.\n\nThe P0002 source uses extensionless relative imports for Creator TypeScript loading. The build normalizes only emitted `dist/**/*.js` relative imports back to `.js`, and the headless example runs from that output. Node 22 is unavailable; validation used Node 26.0.0.\n",
      "name": "p0002-creator-resolver-validation.md",
      "sha256": "c8a594da42e746314a70af14a9de5472af5e72fb376782ffbeca49a885e63ce9"
    }
  ]
}
