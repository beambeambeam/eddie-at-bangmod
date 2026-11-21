# Eddie@Bangmod

A short arcade minigame. Eddie, a KMUTT Bangmod student, rushes through a street market to fill shopping lists before time runs out, then posts a score to a shared leaderboard.

## Gameplay

**Eddie**: The player character, a KMUTT Bangmod student shopping at the market. _Avoid_: Player (when meaning the character), hero

**Run**: One timed play session of exactly 90 seconds, from start to results. _Avoid_: Round, match, game, level

**Countdown**: The 3-2-1 before a Run. It starts only once the Market is ready to show, and no Run time passes during it. _Avoid_: Intro, warm-up, pre-game

**Market**: The single small play area Eddie moves through during a Run. _Avoid_: Map, level, world

**Stall**: A spot in the Market, run by a Vendor, that offers one kind of Item. _Avoid_: Shop, booth

**Vendor**: The person behind a Stall, shown for the look only. A Vendor never moves, blocks or reacts to Eddie. _Avoid_: Seller, shopkeeper, merchant

**Item**: A thing Eddie can pick up from a Stall, such as an ingredient. _Avoid_: Pickup, product, collectible

**Shopping List**: Three Items Eddie must collect in any order, named after a Thai dish; a Run contains as many Shopping Lists as Eddie can clear. _Avoid_: Order, quest, recipe, checkout

**Hazard**: A Motorbike, Soi Dog, or Crowd in the Market that hinders Eddie but never ends the Run or takes Items. _Avoid_: Enemy, obstacle, trap

**Motorbike Lane**: A cross aisle where Motorbikes ride through the Market in one direction.

**Soi Dog Chase**: The brief stretch when the Soi Dog runs at Eddie and can bite him. It starts after the dog wanders and ends with a bite or when the dog gives up.

**Stun**: A short moment after a Motorbike or Soi Dog hit when Eddie cannot move and the Combo resets; a Crowd only slows Eddie and never Stuns him. Right after a Stun, Eddie can walk but nothing can hit him for a moment. _Avoid_: Damage, hurt, knockback

**Sprint**: Eddie moving faster than his walk while he moves, held by the player and paid for with Stamina. A Crowd slows a Sprint as much as a walk. _Avoid_: Run (clashes with Run), dash, boost

**Stamina**: The meter that a Sprint drains and walking or standing still refills; a Run starts with it full. _Avoid_: Energy, fuel, mana

**Winded**: The state after Stamina hits empty, when Eddie cannot Sprint until Stamina refills past a set share; he still walks normally. _Avoid_: Exhausted, tired, cooldown

**Phase**: One of three 30-second thirds of a Run, each adding or speeding up Hazards. _Avoid_: Wave, stage, level

**Score**: The points a Run earns: each Item scaled by the Combo, plus a flat bonus for each cleared Shopping List. _Avoid_: Points total, result

**Combo**: The multiplier (up to ×3) that grows while Eddie grabs Items in quick succession. _Avoid_: Streak, chain, multiplier bonus

## Leaderboard

**Leaderboard**: The single all-time ranking of the best Score per Device. A tie goes to the Device that reached the Score first. _Avoid_: Highscores, ranking

**Nickname**: The display name a player gives when posting a Score; not unique and not an account. _Avoid_: Username, handle, account

**Run Ticket**: The server-issued permission to post one Score for one Run. _Avoid_: Session, run token, nonce

**Device**: An anonymous browser identity that owns at most one Leaderboard entry, its best Score. _Avoid_: User, account, player id

## Studio

**Studio**: The local tool for making cinematic artwork from Eddie@Bangmod’s 3D models.

**Shot**: A staged 3D view of Eddie or the Market, with a fixed pose, camera, and lighting. _Avoid_: Screenshot, when referring to the staged view itself
