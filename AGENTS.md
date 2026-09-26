# SPADE repository instructions

- `main` is the integration branch for feature pull requests.
- Always squash merge feature pull requests into `main`, including branches with incremental commits. The branch commits remain available for review; `main` receives one squash commit.
- Before merging, verify the PR targets `main`, is mergeable, and has passed the relevant checks. After merging, synchronize and verify local `main` against `origin/main`.
- Promote `main` to `staging` and `staging` to `production` with fast-forward merges, following `README.md`.
