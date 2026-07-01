# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual
state strings used in this repo's issue tracker.

This repo tracks issues as local markdown files (see `issue-tracker.md`), which have no built-in
label system. Triage state is recorded as a `Status:` line near the top of each issue file, using
the role strings below.

| Label in mattpocock/skills | `Status:` value in our tracker | Meaning                                  |
| -------------------------- | ------------------------------ | ---------------------------------------- |
| `needs-triage`             | `needs-triage`                 | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`                   | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`              | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`              | Requires human implementation            |
| `wontfix`                  | `wontfix`                      | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), write the corresponding
value from this table into the issue file's `Status:` line.

Edit the right-hand column to match whatever vocabulary you actually use.
