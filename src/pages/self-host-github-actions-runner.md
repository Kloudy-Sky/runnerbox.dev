---
layout: ../layouts/Article.astro
title: "How to self-host a GitHub Actions runner on an old laptop | runnerbox"
heading: "How to self-host a GitHub Actions runner on an old laptop"
description: "What it takes to run GitHub Actions on hardware you own: how much slower it is, how to isolate jobs from your network, and when you shouldn't do it."
updated: "2026-11-06"
articleType: "TechArticle"
---

GitHub's self-hosted runners [are free to use](https://docs.github.com/en/billing/concepts/product-billing/github-actions), and you pay for the machine. I run my Linux CI on an old laptop this way. This is how, including the parts that went wrong. Before you start, [look at your bill](/cut-github-actions-costs/), because the cheapest fixes need no hardware.

## When not to do this

- **Your repo is public, unless you have to.** Any pull request could run code on your machine, and standard GitHub runners are already free there. If you have to, [read the threat model](https://github.com/Kloudy-Sky/runnerbox/blob/main/docs/threat-model.md) first, and require approval for outside contributors' workflows.
- **Your jobs mostly compile.** CPU-heavy checks took 4 to 8x as long on my laptop.
- **Waiting costs more than the bill.** Paid runners are good products.
- **You build for macOS.** A Linux box can't do it, and Mac builds were 57% of my bill.
- **You can't keep the machine separate.** Don't share it with anything you can't afford to expose, such as credentials, agents with access to your accounts, or production deploy keys.

## How slow it really is

My machine is an i5-10210U with 7 GB of RAM, on Ethernet, running a VM with 6 vCPUs and 4.5 GB of RAM. It runs three jobs at a time.

| Median, passing runs | Paid runner, 4 vCPU | Laptop | Ratio |
| --- | --- | --- | --- |
| device-e2e (session) | 8m 27s | 13m 01s | 1.54x |
| device-e2e (room) | 5m 57s | 9m 26s | 1.59x |
| device-gates | 1m 05s | 8m 26s | 7.78x |
| cloud/gates | 54s | 4m 32s | 5.04x |

My first test, one job with no VM, came out only about 25% slower. Plan around the numbers above. These are early, with 5 to 8 laptop runs per job, and my end-to-end tests wait on real-time audio, so a CPU-heavy job will look worse. [Buttondown](https://www.jmduke.com/posts/self-hosting-ci-three-months-later.md) saw about 30% on its backend tests on a much bigger machine, and saves almost $400 a month.

## The basic setup

GitHub's [self-hosted runner docs](https://docs.github.com/actions/hosting-your-own-runners/about-self-hosted-runners) cover installing the runner. The runner only needs an outbound connection, so you don't open any ports. Installing it directly on your machine is the quick way, and it's only safe if you trust everything your jobs run, including every dependency they install.

I wanted more isolation, because anything in a job could be hostile, including a compromised package.

## Isolating jobs

Three layers do the work.

**A VM with a firewall.** I use libvirt with an nwfilter on the VM's interface, so the rules live outside the VM where a job can't change them. It drops traffic to private ranges, link-local and CGNAT addresses, and all IPv6. Jobs can reach the public internet and GitHub, but not my host, my router or my Tailscale network. Order matters here, and DHCP has to be allowed or the VM gets no address:

```text
no MAC spoofing, allow ARP and DHCP, drop IPv6
accept DNS to 192.168.122.1, and inbound SSH from it
drop outbound to 192.168.122.0/24, 10/8, 172.16/12, 192.168/16, 100.64/10, 169.254/16
accept other outbound, drop the rest
```

**A fresh container per job,** with limits so one job can't starve the others. There's no Docker socket, so jobs that need Docker stay on a hosted runner.

```bash
docker run --rm -i --memory 3600m --memory-swap 5g --cpus 4 \
  --pids-limit 4096 --shm-size 1g your-runner-image
```

**A single-use registration per job.** The host calls GitHub's [`generate-jitconfig`](https://docs.github.com/en/rest/actions/self-hosted-runners) API and pipes the result into the container over stdin, so it never shows in `docker inspect`, and the VM holds no credential that outlives a job. Keep the token that mints these on the host, and give it nothing except runner management.

## Pointing a workflow at it

Use a repository variable, so moving CI on or off your box is one change:

```yaml
runs-on: ${{ vars.LINUX_RUNNER || 'ubuntu-24.04' }}
```

Unsetting that variable sends jobs back to GitHub-hosted runners. If those are out of budget, your rollback doesn't work, so keep a paid runner label handy until your box has proven itself.

Keep production deploys and signed releases on hosted runners.

## What went wrong for me

- **Test workers.** Test runners size themselves to the VM's CPUs, not the container's share, and I started seeing 5-second test timeouts. I cap them with environment variables such as `VITEST_MAX_FORKS=2`. I haven't proven that's the whole fix, because memory was part of it too.
- **`virt-install --cloud-init`** didn't apply my config. A hand-built `cidata` ISO attached as a cdrom did.
- **cloud-init groups.** Listing `groups: [docker]` before the package exists fails the user setup. Add the group in `runcmd` after installing.
- **Removing an nwfilter.** The VM has to be gone first, and redefining one with changes needs an undefine.
- **Kernel versions.** Native dependencies may not have prebuilt binaries for the newest kernel. One of mine didn't, so the VM stays on an LTS.

## What this doesn't protect

Only the container is thrown away. The VM persists, and concurrent jobs share its kernel, so a container escape could read a neighboring job's secrets. Jobs can also reach the whole internet, so a job can send out anything it can read, including its own secrets. The [threat model](https://github.com/Kloudy-Sky/runnerbox/blob/main/docs/threat-model.md) has the full list. Read it before you run this.

## Using runnerbox

[runnerbox](https://github.com/Kloudy-Sky/runnerbox) is this setup as open source. `runnerbox report` works today. `runnerbox up`, the launcher, is written and unit tested, but it hasn't run a real job yet, and VM setup isn't scripted, so don't point real CI at it. Fork it, or take the idea and build your own.
