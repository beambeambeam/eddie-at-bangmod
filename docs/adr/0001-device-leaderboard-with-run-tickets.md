# Device-scoped Leaderboard with Run Tickets, no accounts

Eddie@Bangmod has no sign-in. Each Device (an anonymous id kept in the browser) owns one Leaderboard entry: its best Score under its latest Nickname. To stop casual cheating, the server issues a Run Ticket when a Run starts. It accepts one Score per ticket, only after at least 90 seconds, and only up to the highest Score the game rules allow. We picked this over real accounts because players open a shared link on their phones and play for two minutes. A sign-in step would lose most of them, and a campus minigame does not need stronger cheat protection.

## Consequences

- Clearing browser storage creates a new Device, so one person can hold several entries. We accept this.
- We do not validate replays. A player who scripts a believable Score under the cap can still post it.
