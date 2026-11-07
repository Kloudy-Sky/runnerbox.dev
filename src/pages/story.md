---
layout: ../layouts/Article.astro
title: "I thought CI was basically free | runnerbox"
heading: "I thought CI was basically free"
description: "How six days of AI agents pushing code ran up $237 in GitHub Actions runner usage, what was actually expensive, and what an old laptop can and can't replace."
updated: "2026-11-06"
articleType: "Article"
---

Most of my engineering career started at Amazon. Pipelines, VMs and Docker all cost money there, but the cost is hidden, and you're encouraged to prototype fast and build quick. I never gave it a second thought.

Then I started building my own products. At first I didn't even realize GitHub Actions cost money. Once I did, I figured the cost would be almost nothing, because my jobs aren't heavy.

## The day CI stopped

On November 6, CI for [Aeon Karaoke](https://aeonkaraoke.com) stopped. My GitHub Actions budget had hit its limit, which confused me, because my main CI ran on Blacksmith.

Blacksmith was the second surprise. I thought I was on a free trial. I wasn't. Usage past the free minutes keeps billing, and no card is needed for that to happen.

Blacksmith ran what my workflows asked for, at its published price. I just never multiplied that price by what my agents were doing.

## Where the money went

These are Blacksmith's own usage numbers, at list price:

| Period | Jobs | Usage |
| --- | --- | --- |
| All of October | 2,932 | $247 |
| November 1 to 6 | 3,768 | $237 |

I'd started working with AI agents, and they push all day. Each push starts everything. On November 3 alone, CI ran 604 times across 32 branches.

My jobs really aren't heavy. There are just a lot of them, and one kind is far more expensive than the rest:

| Runner | Share of minutes | Share of the bill | Usage |
| --- | --- | --- | --- |
| macOS | 15% | 57% | $136 |
| Linux | 77% | 36% | $85 |
| Windows | 8% | 7% | $16 |

A Mac build cost about 16 times what a Linux job did, and desktop builds ran on every push. They ran 184 times on November 3. I didn't need any of those until a release.

GitHub had the same trap. Another of my repos was still building Mac and Windows apps on GitHub's runners. My 774 real minutes that month counted as about 3,140, because macOS counts 10x and Windows counts 2x. That's how I used up my included GitHub minutes while thinking my CI lived somewhere else.

## What an old laptop can do

I moved my Linux jobs to an old laptop: an i5-10210U with 7 GB of RAM. My first test blew my mind. One job ran only about 25% slower than on a paid runner.

That number didn't survive real use. Once jobs ran inside a firewalled VM, three at a time, it looked like this:

| Median, passing runs | Blacksmith | Laptop | Ratio |
| --- | --- | --- | --- |
| device-e2e (session) | 8m 27s | 13m 01s | 1.54x |
| device-e2e (media) | 6m 07s | 10m 55s | 1.78x |
| device-e2e (room) | 5m 57s | 9m 26s | 1.59x |
| device-e2e (browser) | 3m 46s | 6m 08s | 1.63x |
| device-gates | 1m 05s | 8m 26s | 7.78x |
| cloud/gates | 54s | 4m 32s | 5.04x |

The laptop has only 5 to 8 runs on each of these, so treat them as early numbers. My end-to-end tests spend a lot of time waiting on real-time audio, which flatters a slow CPU. If your jobs mostly compile, expect something closer to the bottom two rows.

I can live with that for about $3 a month in power, by my estimate. It has also never sent me an invoice.

## What I'd tell you

Look at your bill before you change anything. Most of mine was one row I'd never looked at, and a Linux box wouldn't have touched it. Moving desktop builds off every push costs nothing and needs no hardware.

If you've got a spare machine, you probably don't need paid runners for everything. If you're learning and your repo is public, standard GitHub runners are already free, so stay there. If waiting costs you more than the bill does, keep paying. Paid runners are good products.

Not every solo or learning dev can afford a surprise like this. I know I can't. So here's everything I learned:

- [Cut your GitHub Actions costs](/cut-github-actions-costs/)
- [Self-host a GitHub Actions runner](/self-host-github-actions-runner/)
- [Fork runnerbox](https://github.com/Kloudy-Sky/runnerbox), or take the idea and build your own
