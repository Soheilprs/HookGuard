# Risk review checklist

Concise questions for people who consume HookGuard output. Answers come from **evidence**, not from a score.

**HookGuard does not replace a professional smart-contract audit.** A finding is a recorded capability. Empty findings are not “safe.”

---

## Integrators

Use when you route flow, list a pool, or wrap a hook in a product.

- [ ] Which networks and hook address are you actually integrating? Open `/public/hooks/<address>?chainId=`.
- [ ] Are `beforeSwap` / `afterSwap` / liquidity callbacks set on the address bits?
- [ ] Is the hook a proxy? If yes, who can upgrade, and does a swap callback exist (`UPGRADE_SECURITY`)?
- [ ] Do fee, oracle, or configuration setters exist with an owner/admin?
- [ ] If `EXTERNAL_EXECUTION` is present, is `reachableFromHookCallback` true or only opcode presence?
- [ ] Read evidence JSON before shipping a “we checked HookGuard” claim.
- [ ] Watch implementation, admin, owner, and bytecode if any can still change.

## Liquidity providers

Use before adding liquidity to a v4 pool with a hook.

- [ ] Confirm the pool’s hook address; “it is Uniswap” is not the hook.
- [ ] Can swap-path logic be replaced (`UPGRADE_SECURITY`)? Who holds that key?
- [ ] Can an authorized account move tokens the hook might hold (`FUND_SAFETY`)?
- [ ] Can fees or an oracle change after you deposit (`SWAP_SECURITY`, `ORACLE_SECURITY`)?
- [ ] Is the owner an EOA? That is a fact about control, not automatically a reason to deposit or to flee.
- [ ] Treat `LOW` confidence / dashed cards / `NEEDS_CONTEXT` as incomplete, not as confirmed issues.
- [ ] If you cannot read the evidence, you are not done reviewing.

## Researchers

Use when reproducing or citing the corpus.

- [ ] Cite the generated landscape (`npm run report:risk`) and the snapshot timestamp.
- [ ] Count **unique hooks** per risk category, not raw finding rows, when talking about prevalence.
- [ ] Do not convert `EXTERNAL_EXECUTION` prevalence into an incident count.
- [ ] Do not label a project malicious, stolen, or exploited from these findings.
- [ ] Separate Phase 2C validation (20 hooks / 135 findings) from unreviewed `risk-*` rows.
- [ ] Prefer CONFIRMED / STRONG facts (slots, successful `owner()`, named ABI) over opcode heuristics.
- [ ] When a category is **0** (fee, oracle, admin in the unverified corpus), report the zero — do not invent examples.

---

## Shared reading order

Finding → Impact → Evidence → Recommended review.

If evidence is empty, ignore the card. Guidance text cannot replace facts.
