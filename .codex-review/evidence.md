{
  "delivery_commit": null,
  "design_status": "PASS",
  "fingerprint": {
    "acceptance_status": "PASS",
    "changed_paths": [
      "evidence/framework-mvp-implementation-v1.json",
      "manifest.json"
    ],
    "child_run_files": [],
    "child_run_hash": "6ccfa728f92c40f657a283b4b65ec34b11af0ee6556a548934234f4ae5fa6b08",
    "diff_hash": "15b187d9dad1de4b27e377989ae9b5f9c62406ed12ed11d78aca0014d3423a40",
    "evidence_files": [
      "/Users/sxt/.codex/workflow-runs/1e98e52fc76f/p0002-bind-delivery-v3-20260825/validation.md"
    ],
    "evidence_hash": "205bc41287a5f1d4fe48dbe0892ae07d46ff7d91e8fa830d6eccb4444ba1cae5",
    "frozen_at": "2026-08-25T10:39:33+00:00",
    "gitlinks": {},
    "outside_scope_dirty_paths": [],
    "pending_paths": [
      "evidence/framework-mvp-implementation-v1.json",
      "manifest.json"
    ],
    "review_input_hash": "447d3d048b0df58f337cf9d1b5262b883802d7d2374dc809d79572db6f5f9e17",
    "task_contract_files": [
      "/private/tmp/p0002-bind-delivery.6yhFHl/.ai/tasks/p0002-framework-mvp-r2.md"
    ],
    "task_contract_hash": "48d87e079dc4caf8df0c34bc53788f6ec129e07cfe6e7345c4076f65f837d032",
    "validation": "PASS"
  },
  "local_validation_evidence": [
    {
      "content": "# Validation\n\n- Target commit: `766e481b2e8598a9dae698631a14b86184fc57c4`; parent: `ba9ae8d5de0cd5be1e566960f8f94d8e26538978`.\n- `git cherry-pick --no-commit 766e481...` produced a staged patch whose stable patch-id exactly matches `ba9ae8d..766e481`; only `evidence/framework-mvp-implementation-v1.json` and `manifest.json` changed.\n- Current exact target tree: `pnpm contracts` PASS (`Validated 4 contracts`, framework `1.5.0`, `documentCount=50`, `DESIGN_ONLY`); `git diff --check` PASS.\n- Current exact target tree under Node 26: `pnpm typecheck`, `pnpm test` (26/26), `pnpm build`, and `pnpm sample:headless` PASS.\n- Reused Node 22.23.2 evidence: `/Users/sxt/.codex/workflow-runs/b87d57e6dc5b/p0002-framework-mvp-r2-p1-rework/validation.md`; its covered source, test, package, tsconfig, and build paths are unchanged by `ba9ae8d..766e481`, which changes only manifest/evidence binding files.\n- Live remote `origin/gpt/p0002-framework-mvp-r2` was verified at `766e481b2e8598a9dae698631a14b86184fc57c4` before baseline.\n",
      "name": "validation.md",
      "sha256": "e8d1ab85abd625ffb2621c7e1b55fdb4a9b2da75667df6100bd1985e4b674494"
    }
  ]
}
