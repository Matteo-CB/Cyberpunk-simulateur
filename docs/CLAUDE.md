# CYBERPUNK TCG SIMULATOR — Project Specification

## Project Overview

Fan-made digital simulator of the official Cyberpunk Trading Card Game (TCG) by Weird CO / CD Projekt Red / R. Talsorian Games. Developed by HiddenLab (hiddenlab.fr). Bilingual (EN/FR), real-time multiplayer, AI opponents, tournaments, deck building, leaderboards, Discord integration. Built on the same architecture as Naruto Mythos TCG Simulator.

**Admin Usernames:** `['Kutxyt', 'admin', 'Daiki0']` — hardcoded in all admin API routes. Also `TRACKER_USERS: ['Kutxyt', 'admin', 'Andy']` for card tracker access.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Prisma (MongoDB), Socket.IO, Zustand, Framer Motion, next-intl, NextAuth, Resend, ONNX Runtime

**Theme:** Dark cyberpunk aesthetic. Primary accent: `#00f0ff` (cyan neon). Secondary: `#ff003c` (red), `#fcee09` (yellow). Background: `#0a0a12`. Fonts: **Refinery** (titles/headings), **BlenderPro** (body/UI text).

---

## Game Rules (Official Alpha — Complete Reference)

### Win Condition
- **Primary:** Start your turn with **6+ Gig Dice** in your Gig Area → you win
- **Overtime:** If both players complete a turn without taking a new Gig from fixer area, the game enters OVERTIME. In overtime, the moment you have the **majority** of Gig Dice, you win instantly
- **Deck Out:** If you have 0 cards left in your deck, your rival automatically wins
- **Key:** Each discrete die = 1 Gig. Two low-value dice (2 Gigs) beats one high-value die (1 Gig) for winning

### Dice Set (6 dice per player)
| Die | Sides | Max Value | Notes |
|-----|-------|-----------|-------|
| d4  | 4     | 4         | Lowest Street Cred contribution |
| d6  | 6     | 6         | |
| d8  | 8     | 8         | |
| d10 | 10    | 10        | |
| d12 | 12    | 12        | |
| d20 | 20    | 20        | **Must always be taken LAST** from fixer area |

### Playmat Areas (Detailed)

#### Fixer Area
- All 6 Gig Dice start here at game start
- Each turn: choose 1 die → roll → move to Gig Area
- Can choose ANY die **except d20** which must be taken last
- Represents job offers from a fixer

#### Gig Area
- Stores secured Gig Dice with their rolled values
- **Street Cred (☆)** = sum of ALL dice face values in this area
- Win condition checked here: 6+ dice = win at start of turn
- Dice can be stolen by rival attacks

#### Field
- Where Units are placed after being played
- Units attack from here (spent → attacking)
- Ready (upright) Units cannot be targeted by attacks
- Spent (sideways) Units can be attacked

#### Eddies Area
- Currency pool for playing cards
- Created by selling cards from hand (face-down, one per turn)
- Each Eddie card can be spent (turned sideways) for 1 Eddie per turn
- Eddies refresh (ready) at start of each turn

#### Legends Area
- Exactly 3 Legend cards, placed face-down randomly at game start
- Order is unknown to both players (mystery)
- **Face-down Legends:** Can be spent as 1 Eddie each
- **Calling:** Spend 2 Eddies → flip one face-up (don't peek first!)
- **Face-up Legends:** Provide unique passive or triggered effects
- Can Call once per turn in Play Phase, OR once per turn in Defensive Step

#### Deck
- Draw pile. Draw 1 card per turn in Ready Phase
- No maximum hand size
- Running out = immediate loss (deck out)

#### Trash
- Discard pile for defeated Units, used Programs, discarded cards
- Public information (both players can view)

### Card Types (Detailed)

#### Legend
- 3 per player, placed in Legends Area face-down
- **Calling:** Spend 2 Eddies to flip face-up (once per turn, Play Phase or Defensive Step)
- **As Eddies:** Whether face-up or face-down, can be spent for 1 Eddie
- **FLIP trigger:** Resolves immediately when Called
- **CALL trigger:** Resolves when Called, plus provides ongoing abilities
- **GO SOLO:** Some Legends can pay their cost to enter the Field as a ready Unit that can attack immediately

#### Unit
- Crew members placed on the Field
- **Cannot attack the turn they are played** (summoning sickness)
- Can attack spent rival Units (FIGHT) or rival directly (STEAL)
- When attacking: spend the Unit (turn sideways)
- Defeated Units go to trash with all attached Gear

#### Program
- Instant one-shot effects
- Played during Play Phase: pay cost → resolve effect → immediately to trash
- Cannot be equipped or stay in play

#### Gear
- Equipment attached to Units or face-up Legends
- Grants power bonus and/or special effects
- **Follows the Unit:** When a Unit leaves the Field (trash, hand, etc.), all attached Gear goes to the same area
- Multiple Gear can be attached to one Unit

### Card Stats (Detailed)

| Stat | Location | Description |
|------|----------|-------------|
| **Cost** | Top-left | Number of Eddies to play. Some Legends have no cost (Call-only) |
| **Power** | Bottom area | Combat strength for Units and GO SOLO Legends |
| **RAM** | Top-right (colored) | Deck-building restriction. Color matches the card's color |
| **Color** | Card border | Red, Blue, Green, Yellow — determines which Legends can include it |
| **Sell Tag (€$)** | Top-left icon | Cards with this tag can be sold for Eddies |

### Timing Triggers (Detailed)
Timing triggers have a **concave highlight** on the card. They specify WHEN an effect happens.

| Trigger | When It Fires | Context |
|---------|--------------|---------|
| **PLAY** | As soon as card's cost is paid | Units, Gear, Programs |
| **ATTACK** | When Unit attacks, before fight resolves | Units with attack effects |
| **FLIP** | As soon as Legend is flipped face-up | Legends with flip effects |
| **CALL** | When Legend is Called | Legends with ongoing + Call effects |

### Keywords (Detailed)
Keywords have a **convex highlight** on the card. They are shorthand for common effects.

| Keyword | Effect | Details |
|---------|--------|---------|
| **BLOCKER** | Redirect rival's attack to this Unit | Must spend (turn sideways) the BLOCKER Unit to activate. Works during Defensive Step. If BLOCKER redirects a direct attack, a fight occurs but NO Gig is stolen even if attacker wins |
| **GO SOLO** | Pay Legend's cost → enters Field as ready Unit | Can attack THIS turn (bypasses summoning sickness). Legend becomes a Unit on the Field |

### Turn Structure (Detailed Flow)

#### Setup (once, before game starts)
1. **Shuffle Legends:** Randomize 3 Legend cards face-down in Legends Area. Their order must be a mystery to you
2. **Shuffle Deck:** All other cards (40-50) shuffled into deck pile
3. **Place Dice:** All 6 Gig Dice (d4, d6, d8, d10, d12, d20) placed in Fixer Area
4. **Play Order:** Randomly determine who goes first. **First player spends (turns sideways) 2 of their Legends** before starting (balancing penalty)
5. **Draw Starting Hand:** Each player draws 6 cards
6. **Mulligan:** Optional — shuffle entire hand back, draw 6 new cards. **Once only per player**

#### Ready Phase (start of each turn, in order)
1. **Check Win Condition:** If 6+ Gig Dice in your Gig Area → YOU WIN (before any actions)
2. **Draw a Card:** Draw top card from deck. If deck is empty → rival wins (deck out). No maximum hand size
3. **Gain a Gig:** Choose any die from Fixer Area (except d20 unless it's the last one). Roll it to set value. Place in Gig Area. Update Street Cred. If no dice remain in Fixer Area, skip this step (triggers Overtime check)
4. **Ready Spent Cards:** Turn ALL your spent (sideways) cards to ready (upright): Eddies, Legends, Units

#### Play Phase (do any of these in any order, any number of times unless limited)
- **Sell for Eddies (1x/turn):** Reveal a card from hand with €$ Sell Tag → place face-down in Eddies Area. Worth 1 Eddie when spent, regardless of card cost
- **Call a Legend (1x/turn):** Spend 2 Eddies → flip one face-down Legend face-up. **Don't peek first!** If FLIP/CALL trigger → resolves immediately
- **Play Unit:** Pay Eddies = cost → place on Field. Unit is ready but **cannot attack this turn**. If PLAY trigger → resolves on payment
- **Play Gear:** Pay Eddies = cost → attach to a friendly Unit or face-up Legend. If PLAY trigger → resolves
- **Play Program:** Pay Eddies = cost → resolve effect → to trash immediately
- **Go Solo:** Pay Legend's cost → Legend enters Field as a ready Unit. **Can attack this turn!**
- **Spend Legends as Eddies:** Any Legend (face-up or face-down) can be spent for 1 Eddie toward a cost
- **End Play Phase:** Player declares end → move to Attack Phase

#### Attack Phase (each Unit attacks individually, all steps complete before next Unit)
**Player chooses for each ready Unit: attack a spent rival Unit, attack rival directly, or don't attack.**

**Option A: Attack a Spent Unit → FIGHT**
1. **Offensive Step:** Spend (turn sideways) your attacking Unit. If ATTACK trigger → resolve now
2. **Defensive Step:** Rival may:
   - Call a Legend (if haven't this turn in defensive step)
   - Redirect with a BLOCKER Unit (spend the BLOCKER)
3. **Fight:** Compare total power (card power + gear power + modifiers). Higher wins. **Equal power = BOTH defeated**
4. **Defeat:** Loser goes to trash with all attached Gear. If both equal → both go to trash

**Option B: Attack Rival Directly → STEAL**
1. **Offensive Step:** Spend attacking Unit. ATTACK trigger resolves
2. **Defensive Step:** Rival may Call Legend or use BLOCKER (if BLOCKER redirects → fight plays out, but **NO Gig stolen** even if you win the fight)
3. **Steal:** If not blocked → choose ANY die from rival's Gig Area → move to yours. **Bonus: for every 10 power, steal 1 ADDITIONAL Gig** (10 power = 2 Gigs total, 20 power = 3, etc.)

**Attack Rules:**
- Units **cannot attack the turn they're played** (except GO SOLO Legends)
- **Ready Units cannot be attacked** — only spent (sideways) Units
- You don't have to attack with any Unit
- Once a Unit attacks, it's spent for the rest of the turn
- If BLOCKER successfully redirects a direct attack → fight happens but no Gig stolen

### Deck Building Rules (Detailed)
1. Exactly **3 Legend cards** with **unique names** (no duplicate Legend names)
2. **40 to 50 cards** in the main deck (not including the 3 Legends)
3. **Maximum 3 copies** of any single card in the deck
4. **RAM Restrictions:**
   - Each Legend has a colored RAM value (e.g., Goro Takemura = 2 Green RAM)
   - Your deck's cards of each color must have RAM ≤ cumulative RAM of that color from your Legends
   - Example: 2 Green Legends (2 RAM each) → total 4 Green RAM → can include Green cards up to 4 RAM
   - If you want multi-color: need Legends of each color
   - Cards with 0 RAM: no restriction (can go in any deck)

### Street Cred (☆) — Detailed
- **Calculation:** Sum of ALL Gig Dice face values in your Gig Area
- **Usage:** Many card effects require minimum Street Cred thresholds
- **Examples from cards:**
  - "If you have 7+ Street Cred..." (MT0D12 Flathead, Industrial Assembly, Dying Night)
  - "If you have 12+ Street Cred..." (Armored Minotaur)
  - "If you have less than 20 Street Cred..." (Yorinobu Arasaka)
- **Dynamic:** Changes whenever dice are gained, stolen, or values modified by effects

### Complete Glossary

| Term | Definition |
|------|-----------|
| **Spend** | Turn a card sideways. Cannot spend again until readied next turn |
| **Ready** | Turn a card upright. Ready Units can attack; ready Units cannot be attacked |
| **Eddies** | Currency (eurodollars). Every card has a cost; spend that many Eddies to play it |
| **Sell** | Once per turn, reveal a €$ card from hand, place face-down in Eddies Area (worth 1 Eddie) |
| **Gigs** | Jobs represented by Gig Dice. 6+ = win |
| **Street Cred (☆)** | Sum of all Gig Dice values. Enables powerful card effects |
| **Fixer** | Source of new Gig Dice each turn (d20 must be taken last) |
| **Defeat** | Send to trash with all attached Gear |
| **Trash** | Discard pile (public information) |
| **Field** | Area where Units are placed and fight from |
| **Call** | Spend 2 Eddies to flip a Legend face-up |
| **Go Solo** | Pay Legend cost to enter it on the Field as a Unit that can attack immediately |
| **Blocker** | Spend a BLOCKER Unit to redirect an incoming attack to it |
| **Overtime** | If no new Gigs available, first to have majority of dice wins instantly |

---

## Architecture Overview

### Directory Structure
```
cyberpunk-simulateur/
├── docs/                           # Documentation
│   ├── CLAUDE.md                   # This file (project bible)
│   ├── .env.example                # Environment variables template
│   └── TODO-USER.md                # Actions needed from user
├── app/
│   ├── globals.css                 # Cyberpunk theme, fonts, animations [EXISTS]
│   ├── layout.tsx                  # Root layout [EXISTS]
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts  # NextAuth handler
│   │   │   ├── register/route.ts       # POST - create account
│   │   │   ├── forgot-password/route.ts # POST - request reset
│   │   │   └── reset-password/route.ts  # POST - execute reset
│   │   ├── user/
│   │   │   ├── me/route.ts             # GET - current user
│   │   │   ├── preferences/route.ts    # PUT - update preferences
│   │   │   ├── badge-prefs/route.ts    # PUT - badge display
│   │   │   ├── bans/route.ts           # GET - check ban status
│   │   │   ├── link-discord/route.ts   # GET - start Discord OAuth
│   │   │   ├── link-discord/callback/route.ts # GET - OAuth callback
│   │   │   └── unlink-discord/route.ts # POST - disconnect Discord
│   │   ├── decks/
│   │   │   ├── route.ts               # GET list, POST create
│   │   │   ├── [id]/route.ts          # GET, PUT, DELETE single deck
│   │   │   └── reorder/route.ts       # PUT - reorder decks
│   │   ├── game/
│   │   │   ├── route.ts               # POST create, PUT update
│   │   │   └── [id]/route.ts          # GET, PATCH game state
│   │   ├── friends/
│   │   │   ├── route.ts               # GET list, DELETE remove
│   │   │   ├── request/route.ts       # POST send request
│   │   │   ├── requests/route.ts      # GET pending requests
│   │   │   ├── accept/route.ts        # POST accept
│   │   │   ├── decline/route.ts       # POST decline
│   │   │   └── status/[userId]/route.ts # GET relationship
│   │   ├── match-invite/
│   │   │   ├── route.ts               # POST send invite
│   │   │   ├── accept/route.ts        # POST accept
│   │   │   ├── decline/route.ts       # POST decline
│   │   │   ├── cancel/route.ts        # POST cancel
│   │   │   └── pending/route.ts       # GET pending invites
│   │   ├── tournaments/
│   │   │   ├── route.ts               # GET list, POST create
│   │   │   ├── join-by-code/route.ts  # POST join
│   │   │   └── [id]/
│   │   │       ├── route.ts           # GET details, DELETE
│   │   │       ├── join/route.ts      # POST join
│   │   │       ├── leave/route.ts     # POST leave
│   │   │       ├── start/route.ts     # POST start
│   │   │       ├── pairings/route.ts  # POST generate pairings
│   │   │       └── matches/
│   │   │           ├── route.ts       # GET matches
│   │   │           └── [matchId]/
│   │   │               └── forfeit/route.ts # POST forfeit
│   │   ├── leaderboard/route.ts       # GET ranked players
│   │   ├── profile/[username]/route.ts # GET player profile
│   │   ├── quiz/
│   │   │   ├── scores/route.ts        # POST submit, GET history
│   │   │   └── leaderboard/route.ts   # GET quiz rankings
│   │   ├── backgrounds/route.ts       # GET list backgrounds
│   │   ├── settings/route.ts          # GET site settings
│   │   ├── chat/report/route.ts       # POST report message
│   │   ├── users/search/route.ts      # GET search players
│   │   ├── health/route.ts            # GET server health
│   │   └── admin/
│   │       ├── backgrounds/route.ts   # GET, POST, DELETE
│   │       ├── banned-cards/route.ts  # GET, POST
│   │       ├── card-tracker/route.ts  # GET, POST, PATCH, DELETE
│   │       ├── discord-roles/route.ts # GET, POST, PUT
│   │       ├── discord-sync/route.ts  # POST
│   │       ├── games/route.ts         # GET, DELETE
│   │       ├── maintenance/route.ts   # GET, POST
│   │       ├── players/route.ts       # GET, POST
│   │       ├── reports/route.ts       # GET, POST
│   │       ├── reset-elo/route.ts     # POST
│   │       ├── settings/route.ts      # GET, PUT
│   │       ├── suggestions/route.ts   # GET, POST, PATCH, DELETE
│   │       ├── test-rankup/route.ts   # POST
│   │       └── testers/route.ts       # GET, POST
│   └── [locale]/
│       ├── layout.tsx              # i18n provider [EXISTS]
│       ├── page.tsx                # Home / main menu [EXISTS]
│       ├── play/
│       │   ├── page.tsx            # Play mode hub
│       │   ├── ai/page.tsx         # Play vs AI (difficulty select, deck select)
│       │   ├── online/page.tsx     # Online multiplayer (create/join room)
│       │   ├── hotseat/page.tsx    # Local 2-player (shared screen)
│       │   └── training/page.tsx   # Training with AI coach
│       ├── game/page.tsx           # Game board (main gameplay)
│       ├── replay/[id]/page.tsx    # Replay viewer
│       ├── deck-builder/
│       │   ├── page.tsx            # Deck construction (drag-drop, filters)
│       │   └── manage/page.tsx     # Manage saved decks (edit, delete, reorder)
│       ├── collection/page.tsx     # Card collection browser (grid, filters, detail modal)
│       ├── leaderboard/page.tsx    # ELO rankings (tiers, search, pagination)
│       ├── tournaments/
│       │   ├── page.tsx            # Tournament list (browse, create, join)
│       │   ├── [id]/page.tsx       # Tournament details (bracket, matches, participants)
│       │   └── results/page.tsx    # Historical results
│       ├── learn/page.tsx          # Rules lessons & quiz launcher
│       ├── settings/page.tsx       # User preferences (animations, background, badges)
│       ├── profile/[username]/page.tsx  # Player profile (ELO history, games, decks)
│       ├── friends/page.tsx        # Friend list (requests, invites, status)
│       ├── login/page.tsx
│       ├── register/page.tsx
│       ├── forgot-password/page.tsx
│       ├── reset-password/page.tsx
│       ├── maintenance/page.tsx
│       ├── legal/page.tsx
│       └── admin/
│           ├── page.tsx            # Dashboard (stats, quick actions)
│           ├── cards/page.tsx      # Card management (edit, issues, fixes)
│           ├── settings/page.tsx   # Site settings (toggles, bans, Discord roles)
│           ├── suggestions/page.tsx # Feature suggestions (status workflow)
│           └── bugs/page.tsx       # Bug reports
├── components/
│   ├── HoloCard.tsx                # 3D holographic card [EXISTS]
│   ├── CyberBackground.tsx         # Animated background [EXISTS]
│   ├── LanguageSwitcher.tsx        # EN/FR toggle [EXISTS]
│   ├── game/                       # ~25 components for game board
│   ├── cards/                      # ~6 card display components
│   ├── learn/                      # ~4 lesson/quiz components
│   ├── tournament/                 # ~8 tournament components
│   ├── social/                     # ~6 social/friends components
│   ├── replay/                     # ~2 replay viewer components
│   └── ui/                         # ~6 shared UI components
├── lib/
│   ├── engine/                     # Game logic (GameEngine, types, phases, rules)
│   ├── effects/                    # Card effect resolution (EffectEngine + 46 handlers)
│   ├── ai/                         # AI opponent (4 difficulties + coach)
│   ├── tournament/                 # Bracket generation, absence management, leagues
│   ├── elo/                        # ELO calculation
│   ├── socket/                     # Socket.IO handlers (game, tournament, chat, maintenance)
│   ├── discord/                    # Role sync, rank-up webhook
│   ├── email/                      # Resend integration (password reset)
│   ├── auth/                       # NextAuth config (Discord + Credentials)
│   ├── data/                       # Card data, loader, index, types [PARTIAL EXISTS]
│   └── i18n/                       # Routing, navigation, request [EXISTS]
├── stores/                         # Zustand stores (game, deck, tournament, social, settings, ui)
├── server/
│   └── index.ts                    # Express + Socket.IO + Next.js custom server
├── prisma/
│   └── schema.prisma               # MongoDB schema (15 models)
├── messages/                       # [EXISTS] en.json, fr.json (to be expanded massively)
├── public/
│   ├── fonts/                      # [EXISTS] BlenderPro, Refinery
│   ├── icons/                      # PWA icons (favicon, apple-touch, 192x192, 512x512)
│   └── images/
│       ├── cards/ALPHA/            # [EXISTS] 40/46 card images (.webp)
│       ├── backgrounds/            # Game board backgrounds (3+ variants)
│       ├── icons/                  # Decorative icons (cyberpunk themed)
│       ├── leagues/                # 8 rank tier badge images
│       ├── card-back.webp          # Card back design
│       └── og-image.webp           # Open Graph social sharing image
├── middleware.ts                    # [EXISTS] i18n routing
├── next.config.ts                   # [EXISTS] next-intl + image optimization
├── Dockerfile
└── docker-compose.yml
```

**API Routes Total: 63+**

---

## Database Schema (Prisma / MongoDB)

### User
```prisma
model User {
  id                 String    @id @default(auto()) @map("_id") @db.ObjectId
  username           String    @unique
  email              String    @unique
  password           String    // bcrypt hashed (empty string for Discord-only accounts)
  elo                Int       @default(500)
  wins               Int       @default(0)
  losses             Int       @default(0)
  draws              Int       @default(0)
  tournamentWins     Int       @default(0)
  discordId          String?   // Linked Discord account ID
  discordUsername    String?   // Display name from Discord
  discordHighestElo  Int       @default(0) // Peak ELO for Discord role sync
  role               String    @default("user") // "user" | "admin" | "tester"
  badgePrefs         String[]  // Which badges to display on profile
  animationsEnabled  Boolean   @default(true)
  gameBackground     String    @default("default") // Background ID for game board
  resetToken         String?   // Password reset token (time-limited)
  resetTokenExpiry   DateTime?
  chatBanned         Boolean   @default(false)
  gameBanned         Boolean   @default(false)
  chatBanUntil       DateTime?
  gameBanUntil       DateTime?
  createdAt          DateTime  @default(now())
  // Relations
  decks              Deck[]
  gamesAsPlayer1     Game[]    @relation("player1")
  gamesAsPlayer2     Game[]    @relation("player2")
  quizScores         QuizScore[]
  sentFriendships    Friendship[] @relation("sender")
  receivedFriendships Friendship[] @relation("receiver")
  sentInvites        MatchInvite[] @relation("inviteSender")
  receivedInvites    MatchInvite[] @relation("inviteReceiver")
  accounts           Account[]
}
```

### Game
```prisma
model Game {
  id             String    @id @default(auto()) @map("_id") @db.ObjectId
  player1Id      String    @db.ObjectId
  player2Id      String?   @db.ObjectId // null for AI games
  isAiGame       Boolean   @default(false)
  aiDifficulty   String?   // "easy" | "medium" | "hard" | "impossible"
  status         String    @default("in_progress") // "in_progress" | "completed" | "abandoned"
  winnerId       String?   @db.ObjectId
  gameState      Json      // Full serialized GameState (for replay)
  player1Score   Int       @default(0) // Number of Gig Dice
  player2Score   Int       @default(0)
  eloChange      Int?      // ELO delta applied to both players
  createdAt      DateTime  @default(now())
  completedAt    DateTime?
  player1        User      @relation("player1", fields: [player1Id], references: [id])
  player2        User?     @relation("player2", fields: [player2Id], references: [id])
}
```

### Deck
```prisma
model Deck {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  userId     String   @db.ObjectId
  name       String
  cardIds    String[] // IDs of 40-50 main deck cards
  legendIds  String[] // IDs of exactly 3 Legend cards
  sortOrder  Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id])
}
```

### Tournament
```prisma
model Tournament {
  id                 String   @id @default(auto()) @map("_id") @db.ObjectId
  name               String
  type               String   // "casual" | "ranked" | "league"
  status             String   @default("pending") // "pending" | "in_progress" | "completed" | "cancelled"
  gameMode           String   @default("standard") // "standard"
  maxPlayers         Int      @default(8)
  currentRound       Int      @default(0)
  totalRounds        Int      @default(0)
  isPublic           Boolean  @default(true)
  joinCode           String?  @unique
  creatorId          String   @db.ObjectId
  requiresDiscord    Boolean  @default(false)
  useBanList         Boolean  @default(false)

  discordRoleReward  String?  // Discord role ID for winner
  discordRoleBadge   String?  // Discord role ID for participation
  bannedCardIds      String[]
  allowedLeagues     String[]
  startedAt          DateTime?
  completedAt        DateTime?
  winnerId           String?
  winnerUsername      String?
  participants       TournamentParticipant[]
  matches            TournamentMatch[]
}
```

### TournamentParticipant
```prisma
model TournamentParticipant {
  id               String   @id @default(auto()) @map("_id") @db.ObjectId
  tournamentId     String   @db.ObjectId
  userId           String   @db.ObjectId
  username         String
  seed             Int      @default(0)
  eliminated       Boolean  @default(false)
  eliminatedRound  Int?
  hasBye           Boolean  @default(false)

  tournament       Tournament @relation(fields: [tournamentId], references: [id])
  @@unique([tournamentId, userId])
}
```

### TournamentMatch
```prisma
model TournamentMatch {
  id               String    @id @default(auto()) @map("_id") @db.ObjectId
  tournamentId     String    @db.ObjectId
  round            Int
  matchIndex       Int
  player1Id        String?   @db.ObjectId
  player2Id        String?   @db.ObjectId
  player1Username  String?
  player2Username  String?
  winnerId         String?   @db.ObjectId
  winnerUsername    String?
  isBye            Boolean   @default(false)
  status           String    @default("pending") // "pending" | "ready" | "in_progress" | "completed" | "forfeit"
  roomCode         String?
  gameId           String?   @db.ObjectId
  absenceDeadline  DateTime?
  absentPlayerId   String?   @db.ObjectId
  startedAt        DateTime?
  completedAt      DateTime?
  tournament       Tournament @relation(fields: [tournamentId], references: [id])
  @@unique([tournamentId, round, matchIndex])
}
```

### Other Models
```prisma
model Friendship {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  senderId   String   @db.ObjectId
  receiverId String   @db.ObjectId
  status     String   @default("pending") // "pending" | "accepted" | "blocked"
  createdAt  DateTime @default(now())
  sender     User     @relation("sender", fields: [senderId], references: [id])
  receiver   User     @relation("receiver", fields: [receiverId], references: [id])
  @@unique([senderId, receiverId])
}

model MatchInvite {
  id         String    @id @default(auto()) @map("_id") @db.ObjectId
  senderId   String    @db.ObjectId
  receiverId String    @db.ObjectId
  roomCode   String?
  status     String    @default("pending")
  expiresAt  DateTime
  sender     User      @relation("inviteSender", fields: [senderId], references: [id])
  receiver   User      @relation("inviteReceiver", fields: [receiverId], references: [id])
}

model QuizScore {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  userId     String   @db.ObjectId
  difficulty Int
  score      Int
  correct    Int
  total      Int
  accuracy   Float
  bestStreak Int      @default(0)
  completedAt DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
}

model BannedCard {
  id       String   @id @default(auto()) @map("_id") @db.ObjectId
  cardId   String   @unique
  bannedAt DateTime @default(now())
}

model SiteSettings {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  key             String   @unique
  leaguesEnabled  Boolean  @default(false)
  sealedEnabled   Boolean  @default(false)
  discordRoleIds  Json?
}

model GameBackground {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String   @unique
  url       String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}

model CardIssue {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  cardIds     String[]
  cardNames   String[]
  description String
  status      String   @default("to_fix") // "to_fix" | "fixed_unpublished" | "fixed_published" | "verified"
  reportedBy  String
  updatedBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ChatMessage {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  roomCode    String
  userId      String
  username    String
  message     String
  isEmote     Boolean  @default(false)
  isSpectator Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model ChatReport {
  id              String    @id @default(auto()) @map("_id") @db.ObjectId
  messageId       String
  reporterId      String    @db.ObjectId
  targetId        String    @db.ObjectId
  messageText     String
  roomCode        String
  reason          String
  status          String    @default("pending") // "pending" | "resolved"
  action          String?
  reporterNotified Boolean  @default(false)
  reporterReward  String?
  resolvedAt      DateTime?
  resolvedBy      String?
}

model UserBan {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  userId    String    @db.ObjectId
  username  String
  type      String    // "chat" | "game"
  permanent Boolean   @default(false)
  expiresAt DateTime?
  reason    String
  issuedBy  String
  createdAt DateTime  @default(now())
}

model Suggestion {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  description String
  category    String   // "gameplay" | "ui" | "cards" | "balance" | "social" | "other"
  status      String   @default("backlog") // "backlog" | "planned" | "in_progress" | "done_published" | "rejected"
  priority    String   @default("normal") // "low" | "normal" | "high" | "critical"
  images      String[]
  audioUrl    String?
  submittedBy String
  assignedTo  String?
  adminNotes  String?
  upvotes     Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Room {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  code      String   @unique
  hostId    String   @db.ObjectId
  guestId   String?  @db.ObjectId
  gameId    String?  @db.ObjectId
  status    String   @default("waiting")
  isPrivate Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Account {
  id                String  @id @default(auto()) @map("_id") @db.ObjectId
  userId            String  @db.ObjectId
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}
```

---

## Game Engine Architecture

### Core Types
```typescript
type PlayerID = 'player1' | 'player2'
type GamePhase = 'setup' | 'mulligan' | 'ready' | 'play' | 'attack' | 'gameOver'
type CardType = 'legend' | 'unit' | 'gear' | 'program'
type CardColor = 'red' | 'blue' | 'green' | 'yellow'
type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20'
type TimingTrigger = 'PLAY' | 'ATTACK' | 'FLIP' | 'CALL'
type Keyword = 'BLOCKER' | 'GO_SOLO'
```

### GameState Interface
```typescript
interface GameState {
  gameId: string
  turn: number                  // Increments each full round
  phase: GamePhase
  activePlayer: PlayerID
  player1: PlayerState
  player2: PlayerState
  log: GameLogEntry[]           // Full action history (for replay)
  pendingEffects: PendingEffect[]   // Effects waiting to resolve
  pendingActions: PendingAction[]   // Player choices needed
  overtime: boolean             // True when no more Fixer dice
  lastGigTakenThisTurn: { player1: boolean, player2: boolean }
}
```

### PlayerState Interface
```typescript
interface PlayerState {
  id: PlayerID
  userId: string | null
  isAI: boolean
  aiDifficulty?: 'easy' | 'medium' | 'hard' | 'impossible'
  deck: Card[]                  // Draw pile
  hand: Card[]                  // Cards in hand (no max size)
  trash: Card[]                 // Discard/defeat pile (public)
  field: UnitOnField[]          // Units currently in play
  legends: LegendSlot[]         // Exactly 3 Legend slots
  eddies: EddyCard[]            // Face-down cards serving as currency
  fixerArea: GigDie[]           // Dice not yet taken
  gigArea: GigDie[]             // Secured Gig Dice with rolled values
  streetCred: number            // Computed: sum of gigArea dice values
  hasSoldThisTurn: boolean      // Sell limit tracking (1x/turn)
  hasCalledThisTurn: boolean    // Call limit tracking (1x/turn in Play + 1x/turn in Defense)
  hasCalledInDefenseThisTurn: boolean
  hasMulliganed: boolean        // Mulligan tracking (1x/game)
}
```

### UnitOnField Interface
```typescript
interface UnitOnField {
  instanceId: string            // Unique per-game instance ID
  card: UnitCard                // Card data
  isSpent: boolean              // Sideways = spent, upright = ready
  gear: GearCard[]              // All attached Gear cards
  powerModifiers: number        // Temporary power bonuses this turn
  playedThisTurn: boolean       // Cannot attack if true (summoning sickness)
  controlledBy: PlayerID        // Who currently controls this Unit
  originalOwner: PlayerID       // Who originally played it
  isGoSoloLegend: boolean       // True if this is a Legend played via Go Solo
  legendSlotIndex?: number      // Which Legend slot this came from (for Go Solo)
}
```

### LegendSlot Interface
```typescript
interface LegendSlot {
  card: LegendCard
  isFaceUp: boolean             // Flipped = face-up, effects active
  isSpent: boolean              // Spent for Eddies or abilities
  isOnField: boolean            // Go Solo moved it to Field
  goSoloInstanceId?: string     // Links to UnitOnField if on Field
}
```

### GigDie Interface
```typescript
interface GigDie {
  id: string                    // Unique die identifier
  type: DieType                 // d4, d6, d8, d10, d12, d20
  value: number                 // Currently showing face value
  maxValue: number              // 4, 6, 8, 10, 12, 20
  stolenFrom?: PlayerID         // Tracks if stolen from rival
}
```

### EddyCard Interface
```typescript
interface EddyCard {
  instanceId: string
  originalCard: Card            // The card that was sold
  isSpent: boolean              // Can spend once per turn for 1 Eddie
}
```

### Game Actions (Complete List)
```typescript
type GameAction =
  // Play Phase Actions
  | { type: 'SELL_CARD'; cardIndex: number }                              // Sell €$ card → Eddies
  | { type: 'CALL_LEGEND'; legendIndex: number }                          // Spend 2 Eddies → flip Legend
  | { type: 'PLAY_UNIT'; cardIndex: number }                              // Pay cost → Unit to Field
  | { type: 'PLAY_GEAR'; cardIndex: number; targetInstanceId: string }    // Pay cost → attach to Unit
  | { type: 'PLAY_PROGRAM'; cardIndex: number }                           // Pay cost → resolve → trash
  | { type: 'GO_SOLO'; legendIndex: number }                              // Pay cost → Legend to Field as Unit
  | { type: 'END_PLAY_PHASE' }                                            // Move to Attack Phase
  // Attack Phase Actions
  | { type: 'ATTACK_UNIT'; attackerInstanceId: string; targetInstanceId: string }  // Attack spent rival Unit
  | { type: 'ATTACK_RIVAL'; attackerInstanceId: string }                  // Attack rival directly → Steal
  | { type: 'USE_BLOCKER'; blockerInstanceId: string }                    // Defender redirects attack
  | { type: 'CALL_LEGEND_DEFENSE'; legendIndex: number }                  // Call during Defensive Step
  | { type: 'DECLINE_DEFENSE' }                                           // Don't use BLOCKER/Call
  | { type: 'SELECT_GIG_TO_STEAL'; gigDieIndex: number }                  // Choose which die to steal
  | { type: 'END_ATTACK_PHASE' }                                          // End attacking
  // Ready Phase Actions
  | { type: 'CHOOSE_GIG_DIE'; dieIndex: number }                          // Pick die from Fixer Area
  // Setup Actions
  | { type: 'MULLIGAN'; doMulligan: boolean }                              // Accept/decline mulligan
  // Effect Resolution
  | { type: 'SELECT_TARGET'; pendingActionId: string; selectedTargets: string[] }
  | { type: 'DECLINE_OPTIONAL_EFFECT'; pendingEffectId: string }
  // Game Control
  | { type: 'FORFEIT'; reason: 'abandon' | 'timeout' }
```

### Phase Execution (Detailed)

#### Setup Phase
1. Each player's 3 Legends shuffled face-down randomly in Legends Area
2. 40-50 card deck shuffled
3. All 6 dice placed in Fixer Area
4. Random play order. First player spends 2 Legends (penalty for going first)
5. Each player draws 6 cards
6. Mulligan option: once per player, shuffle hand back → draw 6 new

#### Ready Phase (every turn, in strict order)
1. **Win Check:** If active player has 6+ Gig Dice → WIN. Game over
2. **Draw:** Draw 1 card. If deck empty → rival wins (deck out)
3. **Gain Gig:** Player chooses die from Fixer Area (d20 must be last). Roll → set value → move to Gig Area. Recalculate Street Cred. If no dice in Fixer → Overtime check
4. **Ready:** All spent cards become ready (Eddies, Legends, Units)

#### Play Phase (free-form, any order, any number)
- **Sell (1x/turn):** Reveal €$ card from hand → face-down Eddies Area
- **Call (1x/turn):** 2 Eddies → flip Legend. FLIP/CALL trigger fires
- **Play Unit:** Cost in Eddies → Field (ready but playedThisTurn=true). PLAY trigger fires
- **Play Gear:** Cost in Eddies → attach to friendly Unit/face-up Legend. PLAY trigger fires
- **Play Program:** Cost in Eddies → resolve effect → trash. No permanence
- **Go Solo:** Pay Legend cost → Legend enters Field as ready Unit → can attack THIS turn
- **Use Legends as Eddies:** Spend any Legend (up/down) for 1 Eddie toward cost
- **End Phase:** Player manually ends → Attack Phase

#### Attack Phase (sequential, one Unit at a time)
For each ready Unit the player wants to attack with:
1. **Declare Target:** Spent rival Unit (→Fight) or rival directly (→Steal)
2. **Offensive Step:** Spend attacker. ATTACK trigger resolves
3. **Defensive Step:** Rival may:
   - Call a Legend (1x/turn during defense, separate from Play Phase call)
   - Spend a BLOCKER Unit to redirect
4. **Resolution:**
   - **Fight:** Compare power. Higher wins, loser defeated (→trash with Gear). Equal = both defeated
   - **Steal:** Take 1 die from rival's Gig Area (player's choice). +1 die per 10 power (10=2 dies, 20=3, etc.)
   - **Blocked Steal:** If BLOCKER redirected → fight instead, NO Gig stolen regardless
5. **End Phase:** Player manually ends. Turn passes to rival

### Effect Resolution System
- **EffectEngine.ts** processes all triggered effects
- **Per-card handlers** in `lib/effects/handlers/ALPHA/` (one file per card)
- **Pending system:** Multi-step effects create PendingActions (target selection, choices)
- **Optional effects:** Player can decline (DECLINE_OPTIONAL_EFFECT)
- **Mandatory effects:** Must resolve, no skip
- **Resolution order:** PLAY → first, then ATTACK before fight, FLIP/CALL immediately on flip
- **Continuous effects:** Tracked in ContinuousEffects.ts, evaluated during power calculation

### Power Calculation
```
Effective Power =
  Base card.power
  + Sum of attached Gear power values
  + powerModifiers (temporary bonuses from effects)
  + Continuous effect bonuses (from Legends, other Units)

Special cases:
- GO SOLO Legends use their card.power as base
- BLOCKER redirects attack but prevents Gig steal
- Steal bonus: floor(power / 10) additional Gig Dice stolen
  - 1-9 power: steal 1 Gig
  - 10-19 power: steal 2 Gigs
  - 20-29 power: steal 3 Gigs
```

---

## Card Data

### File: `lib/data/cyberpunk_tcg_complete.json` — 46 cards

### Card Distribution
| Stat | Count |
|------|-------|
| **Legends** | 15 |
| **Units** | 18 |
| **Gear** | 7 |
| **Programs** | 6 |
| **Red** | 11 |
| **Yellow** | 14 |
| **Green** | 10 |
| **Blue** | 11 |

### Images Status
- **40/46 downloaded** as .webp in `public/images/cards/ALPHA/`
- **6 missing:** ALPHA-029 (Panam Palmer), ALPHA-033 (Placide), ALPHA-034 (Cyberpsychosis), ALPHA-037 (Alt Cunningham), ALPHA-040 (Hanako Arasaka), ALPHA-042 (V Streetkid)

### All 46 Cards Quick Reference
| ID | Name | Type | Color | Cost | Power | RAM |
|----|------|------|-------|------|-------|-----|
| ALPHA-001 | Yorinobu Arasaka | Legend | Red | - | 0 | 2 |
| ALPHA-002 | Jackie Welles (Pour One Out) | Legend | Blue | - | 0 | 2 |
| ALPHA-003 | V (Corporate Exile) | Legend | Blue | 5 | 8 | 2 |
| ALPHA-004 | Goro Takemura (Hands Unclean) | Legend | Green | 5 | 7 | 2 |
| ALPHA-005 | Saburo Arasaka | Legend | Green | - | 0 | 2 |
| ALPHA-006 | Viktor Vektor | Legend | Yellow | - | 0 | 2 |
| ALPHA-007 | Armored Minotaur | Unit | Red | 6 | 9 | 4 |
| ALPHA-008 | Ruthless Lowlife | Unit | Red | 2 | 1 | 1 |
| ALPHA-009 | Swordwise Hustle | Unit | Red | 3 | 5 | 1 |
| ALPHA-010 | Delamain Cab | Unit | Blue | 4 | 7 | 3 |
| ALPHA-011 | Evelyn Parker (Scheming Siren) | Unit | Blue | 2 | 1 | 1 |
| ALPHA-012 | MT0D12 Flathead | Unit | Blue | 5 | 5 | 3 |
| ALPHA-013 | Jackie Welles (Ride Or Die) | Unit | Yellow | 6 | 6 | 3 |
| ALPHA-014 | Secondhand Bombus | Unit | Yellow | 2 | 2 | 1 |
| ALPHA-015 | T-Bug | Unit | Yellow | 3 | 5 | 1 |
| ALPHA-016 | Corpo Security | Unit | Green | 2 | 2 | 2 |
| ALPHA-017 | Emergency Atlus | Unit | Green | 4 | 7 | 3 |
| ALPHA-018 | Goro Takemura (Losing His Way) | Unit | Green | 4 | 5 | 3 |
| ALPHA-019 | Mantis Blades | Gear | Red | 1 | 2 | 1 |
| ALPHA-020 | Satori | Gear | Red | 2 | 1 | 2 |
| ALPHA-021 | Industrial Assembly | Program | Red | 2 | - | 1 |
| ALPHA-022 | Dying Night | Gear | Blue | 2 | 2 | 3 |
| ALPHA-023 | Floor It | Program | Blue | 3 | - | 2 |
| ALPHA-024 | Sandevistan | Gear | Green | 3 | 3 | 4 |
| ALPHA-025 | Corporate Surveillance | Program | Green | 2 | - | 2 |
| ALPHA-026 | Kiroshi Optics | Gear | Yellow | 1 | 1 | 1 |
| ALPHA-027 | Mandibular Upgrade | Gear | Yellow | 1 | 0 | 2 |
| ALPHA-028 | Reboot Optics | Program | Yellow | 2 | - | 2 |
| ALPHA-029 | Panam Palmer | Legend | Green | - | - | 2 |
| ALPHA-030 | Riding Nomad | Unit | Green | 6 | 6 | 3 |
| ALPHA-031 | Kerry Eurodyne | Unit | Red | 4 | 3 | 2 |
| ALPHA-032 | Meredith Stout | Unit | Red | 4 | 3 | 2 |
| ALPHA-033 | Placide | Unit | Blue | 8 | 10 | 2 |
| ALPHA-034 | Cyberpsychosis | Program | Yellow | 2 | - | 3 |
| ALPHA-035 | Gorilla Arms | Gear | Yellow | 4 | 4 | 4 |
| ALPHA-036 | Afterparty at Lizzie's | Program | Yellow | 2 | - | 2 |
| ALPHA-037 | Alt Cunningham | Legend | Blue | 6 | 4 | 2 |
| ALPHA-038 | Evelyn Parker (Beautiful Enigma) | Legend | Blue | - | - | 2 |
| ALPHA-039 | Goro Takemura (Vengeful Bodyguard) | Legend | Green | - | - | 2 |
| ALPHA-040 | Hanako Arasaka | Unit | Yellow | 3 | 0 | 2 |
| ALPHA-041 | Royce | Legend | Red | 6 | 6 | 2 |
| ALPHA-042 | V (Streetkid) | Legend | Red | 4 | 3 | 2 |
| ALPHA-043 | Dum Dum | Legend | Yellow | - | - | 2 |
| ALPHA-044 | River Ward | Legend | Yellow | - | - | 2 |
| ALPHA-045 | Adam Smasher | Unit | Yellow | 9 | 15 | 5 |
| ALPHA-046 | Lucyna Kushinada | Legend | Blue | - | 0 | 2 |

---

## Feature Specifications

### Authentication System
- **NextAuth v5** with JWT strategy (httpOnly, sameSite=lax cookies)
- **Credentials Provider:** Email + bcrypt password login
- **Discord OAuth Provider:** Scopes: identify, email, guilds.join
- **Registration:** POST /api/auth/register (username, email, password)
- **Password Reset:** Resend email with time-limited token (forgot-password → reset-password)
- **Roles:** `user` (default), `admin` (full access), `tester` (early features)
- **Admin check:** `const ADMIN_USERNAMES = ['Kutxyt', 'admin', 'Daiki0']` in every admin route
- **Session:** JWT stored in cookie, refreshed on each request

### Discord Account Linking (same flow as Naruto Mythos)
Discord is both a **primary login method** AND a **manual linking** option:

**Dual login method:**
1. **Direct Discord login** via NextAuth Discord provider → auto-creates account if new
2. **Manual linking** from profile → links Discord to existing credentials account

**Link flow** (`GET /api/user/link-discord`):
1. Check user is authenticated and doesn't already have Discord linked
2. Create state token (base64 JSON with userId + timestamp, valid 10 minutes)
3. Redirect to Discord OAuth: `https://discord.com/api/oauth2/authorize?scope=identify+email+guilds.join`

**Callback flow** (`GET /api/user/link-discord/callback`):
1. Receive authorization code from Discord
2. Validate state token and timestamp (reject if > 10 minutes)
3. Exchange code for access token with Discord API
4. Fetch Discord user profile via `GET https://discord.com/api/users/@me`
5. Check Discord account isn't already linked to another user
6. Update user record: set `discordId` and `discordUsername`
7. Create `Account` record in DB (enables Discord login for this user)
8. Call `syncDiscordRole()` to assign ELO-based Discord role
9. Redirect to profile page with `?discord=linked`

**Unlink flow** (`POST /api/user/unlink-discord`):
1. Validate user is authenticated
2. Prevent unlinking if user is Discord-only (no password set)
3. Delete Account records for Discord provider
4. Clear `discordId` and `discordUsername` from user

**NextAuth sign-in callback for Discord:**
- If user exists by `discordId` → sign in, update username
- If Account record exists (linked) → sign in, sync Discord info
- If new Discord user → create new account with auto-generated username
- After any Discord interaction → `syncDiscordRole()` called

### Social Features
- **Friends System:** Send/accept/decline/remove friend requests. View friend list. Check relationship status
- **Match Invites:** Invite friends to games via room code. Accept/decline/cancel. Pending list
- **In-Game Chat:** Real-time Socket.IO. Message history. Emote support (isEmote flag). Spectator chat
- **Chat Moderation:** Report messages (reason required). Admin review. Actions: warn, mute, ban
- **Spectators:** Join games as observer. See both players' public state. Chat participation

### Game Modes (4 modes)
1. **Play vs AI** — Select difficulty (Easy/Medium/Hard/Impossible). Select deck. Full game with AI opponent
2. **Play Online** — Create public/private room. Join by 6-char code. Public matchmaking queue (ELO proximity). Ranked or casual
3. **Hotseat** — Two players, same device. Switch overlay between turns. Shared screen with hidden info management
4. **Training** — AI coach provides real-time advice. Highlights optimal plays. Explains strategy. All difficulties available

### Deck Builder
- **Interface:** Left panel = filtered card list. Right panel = current deck
- **Drag-and-Drop:** Framer Motion animations for card movement
- **Real-time Validation:**
  - 40-50 cards in main deck
  - Exactly 3 Legends with unique names
  - Max 3 copies of any card
  - RAM limits respected per color (computed from selected Legends)
- **Filters:** By type, color, classification, keyword, cost range, power range
- **Card Preview:** Hover for full art + effect text
- **Deck Stats:** Card count, color distribution, cost curve, RAM usage
- **Persistence:** Save/load/delete/rename/reorder decks (database)

### Tournament System
- **Types:** Casual, Ranked, League-restricted
- **Modes:** Standard (bring your deck)
- **Brackets:** Single-elimination with automatic bye handling
- **Seeding:** Based on ELO or random
- **Match Management:** Room codes generated per match. Players join via code
- **Absence Timer:** Countdown deadline. Auto-forfeit if player doesn't show
- **Discord Rewards:** Winner gets configurable Discord role. Participation badge role
- **Join Methods:** Browse list, join by tournament code
- **Admin Controls:** Start/cancel tournament, modify brackets, manage participants

### Leaderboard & ELO System
- **ELO Formula:**
  ```
  Expected: E = 1 / (1 + 10^((opponentElo - playerElo) / 400))
  New ELO: playerElo + K * (actualScore - E)
  K = 32 (below 2000 ELO), K = 16 (2000+)
  Win = 1.0, Draw = 0.5, Loss = 0.0
  Minimum ELO: 100
  ```
- **League Tiers (8 ranks):**
  | Tier | Name | ELO Range | Badge |
  |------|------|-----------|-------|
  | 0 | Streetkid | 0-449 | Gray |
  | 1 | Edgerunner | 450-549 | Green |
  | 2 | Solo | 550-799 | Blue |
  | 3 | Netrunner | 800-999 | Purple |
  | 4 | Fixer | 1000-1199 | Cyan |
  | 5 | Afterlife Regular | 1200-1599 | Red |
  | 6 | Night City Legend | 1600-1999 | Gold |
  | 7 | Cyberpunk | 2000+ | Neon Gold |
- **Display:** Rank, username, ELO, W/L/D, win rate. Search by username. Pagination

### Collection Browser
- Grid view of all 46 cards with filtering
- Filter by: type, color, classification, keyword, cost, power, RAM
- Card detail modal: full art, name, title, stats, effect text (EN/FR)
- Silhouette placeholders for cards without images
- Search by name

### Learning & Quiz System
- **Lessons:** Interactive rule explanations with step-by-step visuals
- **Quiz:** Multiple choice questions on card effects, rules, strategy
- **Difficulty:** 1-5 scaling
- **Scoring:** Correct/total, accuracy %, best streak
- **Leaderboard:** Top quiz scorers

### Replay System
- Full GameState serialized in JSON per game (stored in Game model)
- Action history log (GameLogEntry[])
- Playback controls: step forward/backward, play/pause, speed control
- Jump to specific turn/phase
- Action narration in game log

### Settings
- **Animations:** Toggle on/off (all Framer Motion animations respect this)
- **Game Background:** Select from available backgrounds
- **Badge Preferences:** Choose which badges to display on profile
- **Language:** EN/FR via i18n (LanguageSwitcher)

### Admin Panel
- **Dashboard:** Player count, active games, tournament stats
- **Card Management:** Edit card data, track implementation issues (to_fix → verified)
- **Ban List:** Add/remove cards from tournament ban list
- **User Management:** Search players, view profiles, issue bans (chat/game, timed/permanent)
- **Site Settings:** Toggle leagues. Configure Discord role IDs
- **Suggestions:** Community feature requests with status workflow (backlog → planned → in_progress → done → rejected)
- **Bug Reports:** Track and resolve reported bugs
- **Discord:** Configure roles, trigger manual sync, test rank-up webhook
- **Maintenance:** Toggle maintenance mode with graceful drain (active games finish, new games blocked)

---

## SEO & Performance

### Image Optimization
- Formats: AVIF (primary), WebP (fallback)
- Responsive srcSet: 640, 750, 828, 1080, 1200px device widths
- Card images: immutable cache 1 year (`Cache-Control: public, immutable, max-age=31536000`)
- Other images: 24h cache (`must-revalidate, max-age=86400`)
- Lazy loading for off-screen cards

### Security Headers
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' wss: ws:; font-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Metadata & SEO
- Per-page `<title>` and `<meta description>` via Next.js metadata API
- JSON-LD structured data: WebApplication, VideoGame schemas
- Open Graph tags: og:title, og:description, og:image (1200x630 og-image.webp)
- Twitter Card: summary_large_image
- Dynamic sitemap.xml (all public pages)
- robots.txt: allow public pages, disallow admin/api
- Canonical URLs with locale alternates (hreflang en/fr)

### Performance
- Zustand for lightweight state (no Redux overhead)
- Socket.IO: WebSocket primary, HTTP polling fallback
- Standalone Next.js output for Docker
- Compression enabled
- Framer Motion: respect `animationsEnabled` user setting
- Code splitting: dynamic imports for heavy components (game board)

---

## Animation Design

All animations use **Framer Motion** and respect `animationsEnabled` user setting. When disabled, elements appear instantly without motion.

### Menu Animations
- **Title "CYBERPUNK":** Each letter appears with staggered 0.04s delay, glowing cyan text-shadow
- **Subtitle:** Fade-in at 0.6s delay
- **Decorative line:** Scale-X from 0→1 with gradient (cyan→red→transparent)
- **Menu buttons:** Sequential slide-in from left (-40px→0), 0.08s stagger per button
- **Account buttons:** Fade-in at 1.5s
- **Featured card:** Scale 0.9→1 with pulsing cyan/red glow behind
- **Background:** Floating particles (cyan/red/yellow), animated grid lines, scanlines overlay, vignette

### Game Board Animations
- **Dice Roll:** 3D tumble with random rotations, lands on rolled value with bounce
- **Card Play (hand→field):** Card rises from hand, slides to field position with neon trail
- **Sell Card:** Card slides from hand to Eddies area, flips face-down
- **Call Legend:** Card flips 180deg (face-down→face-up) with burst effect
- **Go Solo:** Legend card rises, transforms into Unit with energy surge, drops to field
- **Attack:** Attacker slides toward target with speed lines
- **Fight:** Power numbers displayed, flash on impact, loser shatters with particles
- **Steal Gig:** Die floats from rival's area to yours with glowing trail
- **BLOCKER:** Shield hexagon effect intercepts attack path
- **Defeat:** Card shatters into red/orange particles, fades to trash
- **Win Screen:** Full-screen overlay, "LEGENDARY" in Refinery font, cyan neon glow, confetti particles
- **Lose Screen:** Red-tinted overlay, "FLATLINED" text, glitch effect

### Card Interactions (HoloCard component)
- **Hover:** 3D tilt following mouse position (±15deg on X/Y axes)
- **Holographic shimmer:** Multi-color gradient overlay shifts with cursor
- **Glare:** Radial white highlight follows mouse
- **Neon border:** Cyan glow intensifies on hover, shadow expands
- **Click:** 180deg Y-rotation flip to card back
- **Card back:** Dark design with "CYBERPUNK TCG" in Refinery font

---

## Socket.IO Events (Complete)

### Room Management
| Event | Direction | Data |
|-------|-----------|------|
| `room:create` | Client→Server | `{ isPrivate, isRanked, deckId }` |
| `room:join` | Client→Server | `{ code, deckId }` |
| `room:leave` | Client→Server | `{ code }` |
| `room:player-joined` | Server→Client | `{ userId, username }` |
| `room:player-left` | Server→Client | `{ userId }` |
| `room:list-update` | Server→All | `Room[]` (public rooms) |
| `room:code-invalid` | Server→Client | `{ message }` |

### Game Actions
| Event | Direction | Data |
|-------|-----------|------|
| `game:action` | Client→Server | `{ roomCode, action: GameAction }` |
| `game:state-update` | Server→Client | `{ visibleState: VisibleGameState }` |
| `game:action-performed` | Server→Client | `{ action, log: GameLogEntry }` |
| `game:your-turn` | Server→Client | `{ phase }` |
| `game:pending-action` | Server→Client | `{ pendingAction: PendingAction }` |
| `game:ended` | Server→Client | `{ winnerId, eloChange, player1Score, player2Score }` |

### Tournament
| Event | Direction | Data |
|-------|-----------|------|
| `tournament:subscribe` | Client→Server | `{ tournamentId }` |
| `tournament:unsubscribe` | Client→Server | `{ tournamentId }` |
| `tournament:ready` | Client→Server | `{ matchId }` |
| `tournament:report-present` | Client→Server | `{ matchId }` |
| `tournament:match-ready` | Server→Client | `{ matchId, roomCode }` |
| `tournament:match-updated` | Server→Client | `{ match: TournamentMatch }` |
| `tournament:absence-timer` | Server→Client | `{ matchId, deadline }` |
| `tournament:player-forfeited` | Server→Client | `{ matchId, forfeitedPlayerId }` |
| `tournament:bracket-update` | Server→All | `{ tournamentId, bracket }` |

### Chat
| Event | Direction | Data |
|-------|-----------|------|
| `chat:send` | Client→Server | `{ roomCode, message }` |
| `chat:emote` | Client→Server | `{ roomCode, emote }` |
| `chat:message` | Server→Room | `{ userId, username, message, isEmote, isSpectator, timestamp }` |
| `chat:history` | Server→Client | `ChatMessage[]` |

### Timers & Limits
- **Action timeout:** 2 minutes per action. 3 consecutive timeouts = auto-forfeit
- **Disconnect grace:** 2 minutes to reconnect before auto-forfeit
- **Absence deadline:** Configurable per tournament (default 5 minutes)

---

## Discord Integration
- **OAuth Login:** Link Discord account to game profile (identify, email, guilds.join)
- **Unlink:** Disconnect Discord without deleting game account
- **Role Sync:** Automatic Discord role based on current ELO tier
- **Highest ELO Tracking:** `discordHighestElo` persists peak for role retention
- **Tournament Rewards:** Winner gets Discord role (`discordRoleReward`). Participants get badge role (`discordRoleBadge`)
- **Rank-Up Webhook:** Discord channel notification when player reaches new ELO tier
- **Bot Token:** Server-side bot for role management (requires BOT_DISCORD_TOKEN)

---

## Visual Assets Required

### PWA Icons (public/icons/)
- favicon.ico, favicon-32x32.png
- apple-touch-icon.png (180x180)
- icon-192x192.png, icon-512x512.png
- Various sizes: 16, 32, 48, 72, 96, 128, 144, 152, 384

### Decorative Background Icons (public/images/icons/)
Cyberpunk-themed floating decorations (equivalent of Naruto's clouds/shuriken):
- **circuit-1 through circuit-6.webp** — Circuit board pattern fragments (floating)
- **netrunner-symbol.webp** — Netrunner icon (spinning, like shuriken)
- **arasaka-logo.webp** — Arasaka corporate logo (floating)
- **militech-logo.webp** — Militech logo
- **cyber-eye.webp** — Cybernetic eye icon

### Game Board Assets (public/images/)
- **card-back.webp** — Card back design (dark with "CYBERPUNK TCG" branding)
- **og-image.webp** — Open Graph social sharing image (1200x630)

### Game Board / Playmat
- **No image assets** — game board and playmat will be built entirely in CSS/Tailwind (gradients, grids, borders, neon effects)
- Background variants selectable by user in settings (all CSS-based)

### League Rank Badges (public/images/leagues/)
8 badge images matching the ELO tier system:
- streetkid.webp, edgerunner.webp, solo.webp, netrunner.webp
- fixer.webp, afterlife-regular.webp, night-city-legend.webp, cyberpunk.webp

### Dice Assets (public/images/dice/)
- d4.webp, d6.webp, d8.webp, d10.webp, d12.webp, d20.webp
- Each with multiple face renders for roll animation

---

## Environment Variables
See `docs/.env.example` for all required variables with descriptions.

---

## Development Commands
```bash
npm run dev          # Start dev with Turbopack (port 3000)
npm run build        # prisma generate + next build
npm run start        # Production server (Express + Socket.IO + Next.js)
npm run lint         # ESLint
```

---

## Deployment
- **Docker:** Multi-stage Dockerfile (deps → build → runner as non-root user)
- **Platform:** Railway (auto-detects RAILWAY_PUBLIC_DOMAIN for CORS)
- **Health check:** GET /api/health
- **Graceful shutdown:** SIGTERM → maintenance drain → active games finish (5min max) → shutdown

---

## Style Guide
- **Dark theme only** — no light mode
- **Palette:**
  - Cyan `#00f0ff` — primary accent, borders, glow, active states
  - Red `#ff003c` — danger, secondary accent, defeat
  - Yellow `#fcee09` — highlight, warning, special
  - Background `#0a0a12` — page base
  - Surface `#111119` — cards, panels, buttons
  - Surface hover `#1a1a25` — hover state
  - Border `#1e2030` — default borders
  - Text primary `#e0e8f0`
  - Text secondary `#7a8a9a`
  - Discord `#5865F2`
- **Fonts:** Refinery (titles, headings, branding), BlenderPro (body, buttons, labels, UI)
- **Card aspect ratio:** 63:88
- **Animations:** Always respect `animationsEnabled` setting
- **Responsive:** Mobile-first. Breakpoints: sm (640px), lg (1024px)
- **No emojis** in UI (except user-initiated chat emotes)
- **Scanlines overlay** on backgrounds for cyberpunk atmosphere
- **Neon glow** on interactive elements (hover/focus)
