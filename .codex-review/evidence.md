{
  "delivery_commit": null,
  "design_status": "REVIEW_DEGRADED",
  "fingerprint": {
    "acceptance_status": "PASS",
    "changed_paths": [
      "05-cocos/cocos-adapter.md",
      "05-cocos/input-ui-presentation.md",
      "05-cocos/scene-resource.md",
      "09-governance/engineering-standards/README.md",
      "09-governance/engineering-standards/cocos-creator.md",
      "09-governance/engineering-standards/general-code.md",
      "09-governance/engineering-standards/git.md",
      "09-governance/engineering-standards/godot.md",
      "09-governance/engineering-standards/source-map.json",
      "AGENTS.md",
      "CHANGELOG.md",
      "README.md",
      "VERSION",
      "manifest.json",
      "package.json",
      "scripts/validate-engineering-standards.mjs"
    ],
    "child_run_files": [],
    "child_run_hash": "6ccfa728f92c40f657a283b4b65ec34b11af0ee6556a548934234f4ae5fa6b08",
    "diff_hash": "f55a159e7a73bad17c38aa942976d0efae000d7df65af4aedf8abb32dd9f640e",
    "evidence_files": [
      "/Users/sxt/.codex/workflow-runs/605ef8fb8524/20260827T064754Z-ea2cdc07/strengthened-validation.md"
    ],
    "evidence_hash": "11dc1336c8a9d19d6e6fca356e97b0b7d0c860a4749454a2fd9f58160c4d92dd",
    "frozen_at": "2026-08-27T06:56:33+00:00",
    "gitlinks": {},
    "outside_scope_dirty_paths": [],
    "pending_paths": [
      "05-cocos/cocos-adapter.md",
      "05-cocos/input-ui-presentation.md",
      "05-cocos/scene-resource.md",
      "09-governance/engineering-standards/README.md",
      "09-governance/engineering-standards/cocos-creator.md",
      "09-governance/engineering-standards/general-code.md",
      "09-governance/engineering-standards/git.md",
      "09-governance/engineering-standards/godot.md",
      "09-governance/engineering-standards/source-map.json",
      "AGENTS.md",
      "CHANGELOG.md",
      "README.md",
      "VERSION",
      "manifest.json",
      "package.json",
      "scripts/validate-engineering-standards.mjs"
    ],
    "review_input_hash": "c112a804f63bdd2aac24541bc0e1d939af3684635017e02b8bf37ecca8b76ef6",
    "task_contract_files": [],
    "task_contract_hash": "f969649765098fd8aaed92fa2782cc4affbdfd808b648b7ee8886b4c28e4e605",
    "validation": "PASS"
  },
  "local_validation_evidence": [
    {
      "content": "# Strengthened validation\n\n- Node: v22.12.0; pnpm 10.33.2.\n- `pnpm standards`: PASS; four canonical sources, all tracked Markdown relative links, seven protected path rules.\n- `pnpm contracts`: PASS; four contracts; documentCount 56; Framework status IMPLEMENTED.\n- `pnpm typecheck`: PASS.\n- `pnpm test`: PASS; 6 files, 26 tests.\n- `pnpm build`: PASS.\n- `pnpm sample:headless`: PASS.\n- `git diff --cached --check`: PASS.\n- Diff from baseline `dade075e3392e88cf3afe6a6598984120e2ba7a0` under `src`, `tests`, `evidence`, and `schemas`: empty.\n- MKFramework Runtime integration, Creator Preview, device runtime, and product acceptance: NOT_RUN; this task changes normative standards only and does not expand existing VERIFIED evidence.\n- Final-r01 corrections: validator now binds the exact expected section list, target anchors, baseline protectedAreas/protectedPathRules, protected-path diff, and documentCount; Git commit types and Cocos ES6/lifecycle/static-UI rules restored. Targeted standards/contracts/diff/protected checks: PASS.\n",
      "name": "strengthened-validation.md",
      "sha256": "554db498836f922e44406642a537c2d2f260fbdaab21353f4957da7b4521959a"
    }
  ]
}
