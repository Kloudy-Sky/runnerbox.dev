---
layout: ../layouts/Article.astro
title: "How to cut your GitHub Actions costs | runnerbox"
heading: "How to cut your GitHub Actions costs"
description: "Why GitHub Actions bills climb when AI agents push code, and how to cut yours: find the expensive job, run it less, stop wasted runs, then move Linux jobs to a machine you own."
updated: "2026-11-06"
articleType: "TechArticle"
---

CI is billed by the minute, and agents push all day. So the same price produces a much bigger bill than it did when only people pushed code. These fixes go from cheapest to most work, and the first three need no hardware. The dollar figures are [mine](/story/), from six days of usage at list price.

If your repo is public, you may already be done: standard GitHub-hosted runners [are free for public repos](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

## Find the expensive row

Your [billing page](https://github.com/settings/billing) shows what you've used. To see it per job, run the report. It only reads your job history from GitHub and saves it to a local file. It needs Node 22.18 or newer, plus `GITHUB_TOKEN` or a `gh` login.

```bash
git clone https://github.com/Kloudy-Sky/runnerbox
cd runnerbox && pnpm install
pnpm runnerbox report --repo you/your-app
```

Here's part of mine, trimmed to fit:

```text
JOB                     RUNNER                         RAN  P50      TOTAL
device-e2e (session)    blacksmith-4vcpu-ubuntu-2404   285  8m 27s   2340m 23s
device-e2e (media)      blacksmith-4vcpu-ubuntu-2404   284  6m 06s   1753m 13s
mac-x64 / mac x64       blacksmith-6vcpu-macos-15      149  6m 29s    873m 51s
mac-arm64 / mac arm64   blacksmith-6vcpu-macos-15      150  5m 27s    745m 23s
```

The report shows minutes, not dollars, so multiply by your runner's price. That's the trick: the mac rows look small here, and they were 57% of my bill.

## Build desktop apps on releases

Most of my $152 in Mac and Windows builds went here. Nobody needs a signed desktop build for every push from an agent.

```yaml
# Before
on: push

# After
on:
  release:
    types: [published]
```

Do the same for anything slow that doesn't have to block a pull request. You can also run end-to-end suites only when a PR is ready, or limit a workflow to the files that affect it:

```yaml
on:
  pull_request:
    paths:
      - "apps/desktop/**"
```

## Batch agent pushes

$22 of my usage went to jobs that were cancelled anyway. Agents push in bursts, and each push starts a full run. Add a line like this to your agent instructions:

```text
Run checks locally. Push when the work is ready for review, not after every change.
```

Then stop paying for runs a newer push has already replaced:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

That setting leaves your main branch alone, so a deploy doesn't get cancelled halfway through.

## Set a budget before you need one

Check your limits for each service you use. GitHub stopped my CI when my budget ran out, while usage on another runner service kept billing past its free minutes. Not needing a card didn't mean there was no bill.

## Move Linux jobs to a machine you own

This was up to $85 of my bill, and it's the most work. GitHub doesn't charge for self-hosted runners today. It announced a $0.002 per minute fee and [postponed it](https://github.com/resources/insights/2026-pricing-changes-for-github-actions), so that could change. Read [how to self-host a runner](/self-host-github-actions-runner/) first, including when not to.

## What runners cost

Checked November 6, 2026. Prices change, so follow the links before you decide.

| Service | Linux, 2 core | Included each month |
| --- | --- | --- |
| [GitHub hosted](https://docs.github.com/en/billing/reference/actions-runner-pricing) | $0.006/min | $12 on Free, $18 on Pro or Team |
| [Blacksmith](https://www.blacksmith.sh/pricing) | $0.004/min | 3,000 minutes |
| [BuildPulse](https://buildpulse.io/pricing) | $0.004/min | 3,000 minutes |
| Your own machine | $0, plus power | Private repos only, unless you have to |

Per-minute price isn't the whole story. Blacksmith charges less per minute than GitHub, and it's still where my bill came from, because the bill is price times volume. macOS is the expensive multiplier everywhere: GitHub counted my macOS minutes at 10x.
