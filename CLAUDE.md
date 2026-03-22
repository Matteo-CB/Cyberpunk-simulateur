# CYBERPUNK TCG SIMULATOR — Project Specification

## Git Rules
- NEVER add Co-Authored-By or any co-author/collaborator tag in commit messages
- Commits are authored solely by the user

## Project Overview

Fan-made digital simulator of the official Cyberpunk Trading Card Game (TCG) by R. Talsorian Games / CD Projekt Red. Bilingual (EN/FR), real-time multiplayer, AI opponents, tournaments, sealed/draft, deck building, leaderboards, Discord integration. Built on the same architecture as Naruto Mythos TCG Simulator.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Prisma (MongoDB), Socket.IO, Zustand, Framer Motion, next-intl, NextAuth, Resend, ONNX Runtime

**Theme:** Dark cyberpunk aesthetic. Primary accent: `#00f0ff` (cyan neon). Secondary: `#ff003c` (red), `#fcee09` (yellow). Background: `#0a0a12`. Fonts: **Refinery** (titles/headings), **BlenderPro** (body/UI text).

---

## Game Rules (Official Alpha)

### Win Condition
- Start your turn with **6+ Gig Dice** in your Gig Area → you win
- **Overtime:** If both players complete a turn without taking a new Gig from fixer area, the moment you have majority of Gig Dice, you win
- **Deck Out:** If you have 0 cards left in your deck, your rival automatically wins
- Each discrete die = 1 Gig. Having two low-value dice > one high-value die for winning

### Dice Set
Each player uses 6 dice: d4, d6, d8, d10, d12, d20. The d20 must always be taken last from the fixer area.

### Playmat Areas
- **Fixer Area:** All Gig Dice start here. Choose 1 per turn, roll to set value, move to Gig Area
- **Gig Area:** Your secured Gigs. Sum of all dice values = **Street Cred (☆)**. Win condition checked here
- **Field:** Where Units are placed. Units attack from here
- **Eddies Area:** Currency. Cards sold from hand go face-down here. Each can be spent (turned sideways) for 1 Eddie per turn
- **Legends Area:** 3 face-down Legend cards. Can spend 2 Eddies to Call (flip face-up). Face-down Legends can be spent as 1 Eddie each
- **Deck:** Draw pile
- **Trash:** Discard/defeat pile

### Card Types
1. **Legend** — Leaders of your crew. Start face-down. Can be Called (flipped) for 2 Eddies. Can be spent for 1 Eddie whether face-up or face-down
2. **Unit** — Crew members placed on the Field. Can attack. Cannot attack the turn they are played
3. **Program** — Instant effects, played then immediately discarded. Can play any time during Play Phase
4. **Gear** — Equip to Units for effects/power. When Unit leaves field, Gear goes with it to same area

### Card Stats
- **Cost** (top-left): Eddies to play the card
- **Power** (Units/Legends with Go Solo): Combat strength
- **RAM** (top-right, colored): Deck-building restriction per color. Legend RAM values set max for that color in deck
- **Color:** Red, Blue, Green, Yellow — determines RAM restrictions
- **Classifications:** Tags like Arasaka, Merc, Corpo, Netrunner, Drone, etc.
- **Sell Tag (€$):** Cards with this can be sold to create Eddies (once per turn)

### Timing Triggers (concave highlight)
- **PLAY** — Effect triggers as soon as card's cost is paid
- **ATTACK** — Effect triggers when Unit attacks, before fight resolves
- **FLIP** — Effect triggers as soon as Legend is flipped face-up (Called)
- **CALL** — Effect triggers when Legend is Called (subset of FLIP for Legends with additional abilities)

### Keywords (convex highlight)
- **BLOCKER** — When a rival Unit attacks, you may spend this Unit to redirect the attack to it
- **GO SOLO** — Pay cost to play Legend as a ready Unit. It can attack this turn (unlike normal Units)

### Turn Structure

#### Setup (once, before game starts)
1. Shuffle Legends face-down randomly in Legends Area (mystery order)
2. Shuffle all other cards into deck
3. Place all 6 Gig Dice in Fixer Area
4. Choose play order randomly. First player spends 2 of their Legends
5. Draw 6 cards for starting hand
6. Optional mulligan: shuffle hand back, draw 6 new (once only)

#### Ready Phase (start of each turn)
1. **Draw a card** from deck (no max hand size)
2. **Gain a Gig:** Choose a die from Fixer Area (not d20 unless last), roll it, place in Gig Area
3. **Ready spent cards:** Turn all spent (sideways) cards upright

#### Play Phase (do any in any order)
- **Sell for Eddies:** Once per turn, reveal a card with €$ tag, place face-down in Eddies Area
- **Call a Legend:** Once per turn, spend 2 Eddies to flip a face-down Legend (don't peek first). FLIP/CALL trigger resolves immediately
- **Play Cards:** Spend Eddies equal to cost. PLAY trigger resolves on payment. Legends can be spent as 1 Eddie each (face-up or down). Units cannot attack this turn
- **Play Programs:** Instant effects, then discarded

#### Attack Phase (each Unit attacks individually)
**Attacking a Spent Unit → FIGHT:**
1. Offensive Step: Spend attacking Unit. ATTACK trigger resolves
2. Defensive Step: Rival may Call a Legend or redirect with BLOCKER
3. Fight: Compare power. Higher wins. Equal = both defeated
4. Defeat: Defeated Units + their Gear go to trash

**Attacking Rival Directly → STEAL:**
1. Offensive Step: Spend attacking Unit. ATTACK trigger resolves
2. Defensive Step: Rival may Call a Legend or redirect with BLOCKER
3. Steal: Take any die from rival's Gig Area. For every 10 power, steal 1 additional Gig (10 power = 2 Gigs, 20 = 3, etc.)

**Important Rules:**
- Units cannot attack the turn they're played
- Ready Units cannot be attacked (only spent Units can be targeted)
- If BLOCKER redirects a direct attack, a fight plays out but no Gig is stolen even if you win
- You don't have to attack with any Unit if you don't want to

### Deck Building Rules
- Exactly **3 Legend cards** with unique names
- **40–50 cards** (not including Legends)
- **Max 3 copies** of the same card
- Cards must respect **RAM limits** set by Legends:
  - Each Legend has a colored RAM value (e.g., 2 Green RAM)
  - Cumulative RAM of same-color Legends = max RAM for that color in deck
  - Multi-color decks need Legends of each color
  - Example: 2 Green Legends (2 RAM each) = can use Green cards up to 4 RAM

### Street Cred (☆)
Sum of all Gig Dice face values in your Gig Area. Some card effects require minimum Street Cred to activate (e.g., "If you have 7+ Street Cred...").

### Key Terminology
- **Spend/Spent:** Turn card sideways. Cannot spend again until readied next turn
- **Ready:** Turn card upright. Ready Units can attack; ready Units cannot be attacked
- **Eddies:** Currency for playing cards. Created by selling from hand
- **Gigs:** Jobs represented by Gig Dice. 6+ = win
- **Fixer:** Source of new Gig Dice each turn
- **Defeat:** Send to trash (with attached Gear)

---

## Architecture Overview

### Directory Structure
```
cyberpunk-simulateur/
├── app/
│   ├── globals.css                 # Cyberpunk theme, fonts, animations
│   ├── layout.tsx                  # Root layout
│   └── [locale]/
│       ├── layout.tsx              # i18n provider
│       ├── page.tsx                # Home / main menu
│       ├── play/
│       │   ├── page.tsx            # Play mode hub
│       │   ├── ai/page.tsx         # Play vs AI
│       │   ├── online/page.tsx     # Online multiplayer
│       │   ├── hotseat/page.tsx    # Local 2-player
│       │   ├── sealed/page.tsx     # Sealed/draft mode
│       │   └── training/page.tsx   # Training with AI coach
│       ├── game/page.tsx           # Game board
│       ├── replay/[id]/page.tsx    # Replay viewer
│       ├── deck-builder/
│       │   ├── page.tsx            # Deck construction
│       │   └── manage/page.tsx     # Manage saved decks
│       ├── collection/page.tsx     # Card collection browser
│       ├── leaderboard/page.tsx    # ELO rankings
│       ├── tournaments/
│       │   ├── page.tsx            # Tournament list
│       │   ├── [id]/page.tsx       # Tournament details
│       │   └── results/page.tsx    # Historical results
│       ├── learn/page.tsx          # Rules & quiz
│       ├── settings/page.tsx       # User preferences
│       ├── profile/[username]/page.tsx  # Player profiles
│       ├── friends/page.tsx        # Friend list
│       ├── login/page.tsx          # Login form
│       ├── register/page.tsx       # Registration form
│       ├── forgot-password/page.tsx
│       ├── reset-password/page.tsx
│       ├── maintenance/page.tsx
│       ├── legal/page.tsx
│       └── admin/
│           ├── page.tsx            # Admin dashboard
│           ├── cards/page.tsx      # Card management
│           ├── settings/page.tsx   # Site settings
│           ├── suggestions/page.tsx
│           └── bugs/page.tsx
├── components/
│   ├── HoloCard.tsx                # 3D holographic card [EXISTS]
│   ├── CyberBackground.tsx         # Animated background [EXISTS]
│   ├── LanguageSwitcher.tsx        # EN/FR toggle [EXISTS]
│   ├── game/                       # Game board components
│   │   ├── GameBoard.tsx           # Main board orchestrator
│   │   ├── PlayerField.tsx         # Player's field area
│   │   ├── OpponentField.tsx       # Opponent's field
│   │   ├── PlayerHand.tsx          # Cards in hand (fanned)
│   │   ├── OpponentHand.tsx        # Opponent hand (face-down)
│   │   ├── GigArea.tsx             # Dice display with values
│   │   ├── FigArea.tsx             # Remaining dice to pick
│   │   ├── EddiesArea.tsx          # Eddies pool display
│   │   ├── LegendsArea.tsx         # 3 Legend slots
│   │   ├── ActionBar.tsx           # Play/Attack/Pass/Sell/Call buttons
│   │   ├── GameLog.tsx             # Action history
│   │   ├── GameInfo.tsx            # Turn, phase, Street Cred
│   │   ├── GameEndScreen.tsx       # Win/loss with replay
│   │   ├── TargetSelector.tsx      # Effect target picking
│   │   ├── DiceRollAnimation.tsx   # Gig dice roll animation
│   │   ├── FightAnimation.tsx      # Unit vs Unit combat
│   │   ├── StealAnimation.tsx      # Gig steal animation
│   │   ├── AnimationController.tsx # Orchestrates all animations
│   │   ├── MulliganDialog.tsx      # Opening hand mulligan
│   │   ├── DeckSelector.tsx        # Pre-game deck selection
│   │   ├── GameChat.tsx            # In-game chat
│   │   ├── SpectatorBanner.tsx     # Spectator indicator
│   │   ├── TrainingCoachPanel.tsx  # AI coaching display
│   │   └── HotseatSwitchOverlay.tsx
│   ├── cards/
│   │   ├── CardFace.tsx            # Card front display
│   │   ├── CardBack.tsx            # Card back (cyberpunk design)
│   │   ├── CardInHand.tsx          # Card in player hand
│   │   ├── CardPreview.tsx         # Hover/modal inspector
│   │   ├── GearAttached.tsx        # Gear on Unit display
│   │   └── UnitOnField.tsx         # Unit card on field
│   ├── sealed/
│   │   ├── BoosterOpening.tsx      # Booster open animation
│   │   ├── CardReveal.tsx          # Card reveal animation
│   │   ├── SealedPoolReview.tsx    # View opened cards
│   │   ├── SealedDeckBuilder.tsx   # Build deck from pool
│   │   └── SealedTimer.tsx         # Countdown timer
│   ├── tournament/
│   │   ├── CreateTournamentForm.tsx
│   │   ├── BracketTree.tsx
│   │   ├── BracketMatch.tsx
│   │   ├── TournamentCard.tsx
│   │   ├── TournamentAdmin.tsx
│   │   ├── TournamentDeckSelector.tsx
│   │   ├── TournamentResults.tsx
│   │   └── AbsenceTimer.tsx
│   ├── social/
│   │   ├── FriendsList.tsx
│   │   ├── FriendRequestsList.tsx
│   │   ├── FriendshipButton.tsx
│   │   ├── FriendRequestToast.tsx
│   │   ├── MatchInviteToast.tsx
│   │   └── UserSearchDropdown.tsx
│   ├── learn/
│   │   ├── LessonViewer.tsx
│   │   ├── QuizSession.tsx
│   │   ├── QuizResults.tsx
│   │   └── QuizLeaderboard.tsx
│   ├── replay/
│   │   ├── ReplayBoard.tsx
│   │   └── PlaybackControls.tsx
│   └── ui/
│       ├── Footer.tsx
│       ├── EloBadge.tsx
│       ├── UserBadges.tsx
│       ├── NotificationContainer.tsx
│       ├── ReconnectPrompt.tsx
│       └── BanNotification.tsx
├── lib/
│   ├── engine/
│   │   ├── GameEngine.ts           # Core game loop & state machine
│   │   ├── types.ts                # All game interfaces & types
│   │   ├── phases/
│   │   │   ├── ReadyPhase.ts       # Draw, Gain Gig, Ready cards
│   │   │   ├── PlayPhase.ts        # Sell, Call, Play cards
│   │   │   └── AttackPhase.ts      # Attack/Fight/Steal logic
│   │   └── rules/
│   │       ├── DeckValidation.ts   # 40-50 cards, 3 Legends, RAM limits
│   │       ├── PlayValidation.ts   # Cost check, legal plays
│   │       ├── AttackValidation.ts # Can attack? BLOCKER? etc.
│   │       └── RAMValidation.ts    # RAM color limits from Legends
│   ├── effects/
│   │   ├── EffectEngine.ts         # Resolve PLAY/ATTACK/FLIP/CALL effects
│   │   └── handlers/ALPHA/         # Per-card effect handlers (46 cards)
│   ├── ai/
│   │   ├── AIPlayer.ts             # AI orchestrator
│   │   ├── strategies/
│   │   │   ├── EasyAI.ts           # Random legal actions
│   │   │   ├── MediumAI.ts         # Greedy heuristic
│   │   │   ├── HardAI.ts           # Minimax evaluation
│   │   │   └── ImpossibleAI.ts     # Neural network (ONNX)
│   │   ├── BoardEvaluator.ts       # Board state scoring
│   │   ├── TargetSelection.ts      # Target prioritization
│   │   └── Coach.ts                # Real-time training coach
│   ├── effects/
│   │   └── ContinuousEffects.ts    # Passive/ongoing effect tracking
│   ├── sealed/
│   │   └── boosterGenerator.ts     # Generate sealed boosters
│   ├── tournament/
│   │   ├── tournamentEngine.ts     # Bracket generation & advancement
│   │   ├── absenceManager.ts       # Absence detection & auto-forfeit
│   │   └── leagueUtils.ts          # League tier definitions
│   ├── elo/
│   │   └── elo.ts                  # ELO calculation (K=32/<2000, K=16/≥2000)
│   ├── socket/
│   │   ├── server.ts               # Socket.IO event handlers
│   │   ├── tournamentHandlers.ts   # Tournament socket events
│   │   └── maintenance.ts          # Graceful shutdown & drain
│   ├── discord/
│   │   ├── roleSync.ts             # Discord role synchronization
│   │   ├── roles.ts                # Role ID configuration
│   │   └── rankUpWebhook.ts        # Rank-up notifications
│   ├── email/
│   │   └── sendResetEmail.ts       # Resend password reset
│   ├── auth/
│   │   └── authOptions.ts          # NextAuth config (Discord + Credentials)
│   ├── data/
│   │   ├── cyberpunk_tcg_complete.json  # 46 cards [EXISTS]
│   │   ├── types.ts                # Card data interfaces
│   │   ├── cardLoader.ts           # Card loading & normalization
│   │   └── cardIndex.ts            # Card lookup maps
│   └── i18n/                       # [EXISTS] routing, navigation, request
├── stores/
│   ├── gameStore.ts                # Game state (Zustand)
│   ├── deckBuilderStore.ts         # Deck building session
│   ├── tournamentStore.ts          # Tournament state
│   ├── socialStore.ts              # Friends, invites
│   ├── settingsStore.ts            # User preferences
│   └── uiStore.ts                  # UI modals, panels, selections
├── server/
│   └── index.ts                    # Express + Socket.IO + Next.js server
├── prisma/
│   └── schema.prisma               # Database schema (MongoDB)
├── messages/                        # [EXISTS] en.json, fr.json
├── public/
│   ├── fonts/                       # [EXISTS] BlenderPro, Refinery
│   └── images/cards/ALPHA/          # [EXISTS] 40/46 card images
├── middleware.ts                    # [EXISTS] i18n routing
├── next.config.ts                   # [EXISTS] next-intl + image optimization
├── Dockerfile
└── docker-compose.yml
```

---

## Database Schema (Prisma / MongoDB)

### User
```
id, username (unique), email (unique), password (bcrypt)
elo (default 500), wins, losses, draws, tournamentWins
discordId?, discordUsername?, discordHighestElo
role: "user" | "admin" | "tester"
badgePrefs: String[]
animationsEnabled (default true), gameBackground (default "default")
resetToken?, resetTokenExpiry?
chatBanned, gameBanned, chatBanUntil?, gameBanUntil?
createdAt
→ decks[], gamesAsP1[], gamesAsP2[], quizScores[], friendships[], matchInvites[]
```

### Game
```
id, player1Id, player2Id, isAiGame, aiDifficulty?
status: "in_progress" | "completed" | "abandoned"
winnerId?, gameState (Json), player1Score, player2Score, eloChange?
createdAt, completedAt?
```

### Deck
```
id, userId, name, cardIds: String[], legendIds: String[]
sortOrder, createdAt, updatedAt
```

### Tournament
```
id, name, type, status, gameMode, maxPlayers
currentRound, totalRounds, isPublic, joinCode
creatorId, requiresDiscord, useBanList
sealedBoosterCount?, discordRoleReward?, discordRoleBadge?
bannedCardIds[], allowedLeagues[]
startedAt?, completedAt?, winnerId?, winnerUsername?
→ participants[], matches[]
```

### TournamentParticipant
```
id, tournamentId, userId, username, seed
eliminated, eliminatedRound?, hasBye
sealedPool? (Json), sealedDeck? (Json)
unique: [tournamentId, userId]
```

### TournamentMatch
```
id, tournamentId, round, matchIndex
player1Id?, player2Id?, player1Username?, player2Username?
winnerId?, winnerUsername?, isBye, status
roomCode?, gameId?, absenceDeadline?, absentPlayerId?
startedAt?, completedAt?
unique: [tournamentId, round, matchIndex]
```

### Friendship
```
id, senderId, receiverId
status: "pending" | "accepted" | "blocked"
createdAt
unique: [senderId, receiverId]
```

### MatchInvite
```
id, senderId, receiverId, roomCode?, status, expiresAt
```

### QuizScore
```
id, userId, difficulty, score, correct, total, accuracy, bestStreak, completedAt
```

### BannedCard
```
id, cardId (unique), bannedAt
```

### SiteSettings
```
id, key (unique), leaguesEnabled, sealedEnabled, discordRoleIds
```

### GameBackground
```
id, name (unique), url, sortOrder, createdAt
```

### CardIssue
```
id, cardIds[], cardNames[], description
status: "to_fix" | "fixed_unpublished" | "fixed_published" | "verified"
reportedBy, updatedBy, createdAt, updatedAt
```

### ChatMessage
```
id, roomCode, userId, username, message, isEmote, isSpectator, createdAt
```

### ChatReport
```
id, messageId, reporterId, targetId, messageText, roomCode, reason
status: "pending" | "resolved", action?, resolvedAt?, resolvedBy?
```

### UserBan
```
id, userId, username, type: "chat" | "game"
permanent, expiresAt?, reason, issuedBy, createdAt
```

### Suggestion
```
id, title, description
category: "gameplay" | "ui" | "cards" | "balance" | "social" | "other"
status: "backlog" | "planned" | "in_progress" | "done_published" | "rejected"
priority: "low" | "normal" | "high" | "critical"
images[], audioUrl?, submittedBy, assignedTo?, adminNotes?
upvotes, createdAt, updatedAt
```

### Room
```
id, code (unique), hostId, guestId?, gameId?, status, isPrivate, createdAt
```

### Account (NextAuth)
```
id, userId, type, provider, providerAccountId
refresh_token, access_token, expires_at, token_type, scope, id_token
unique: [provider, providerAccountId]
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
  turn: number
  phase: GamePhase
  activePlayer: PlayerID
  player1: PlayerState
  player2: PlayerState
  log: GameLogEntry[]
  pendingEffects: PendingEffect[]
  pendingActions: PendingAction[]
  overtime: boolean
  lastGigTakenThisTurn: { player1: boolean, player2: boolean }
}
```

### PlayerState Interface
```typescript
interface PlayerState {
  id: PlayerID
  userId: string | null
  isAI: boolean
  aiDifficulty?: string
  deck: Card[]
  hand: Card[]
  trash: Card[]
  field: UnitOnField[]           // Units in play
  legends: LegendSlot[]          // 3 Legends (face-up/down, spent/ready)
  eddies: EddyCard[]             // Face-down cards as currency
  fixerArea: GigDie[]            // Dice not yet taken
  gigArea: GigDie[]              // Secured Gig Dice with values
  streetCred: number             // Sum of Gig Dice values
  hasSoldThisTurn: boolean
  hasCalledThisTurn: boolean
  hasMulliganed: boolean
}
```

### UnitOnField Interface
```typescript
interface UnitOnField {
  instanceId: string
  card: UnitCard
  isSpent: boolean               // Sideways = spent
  gear: GearCard[]               // Attached Gear
  powerModifiers: number         // Temporary bonuses
  playedThisTurn: boolean        // Cannot attack if true
  controlledBy: PlayerID
}
```

### LegendSlot Interface
```typescript
interface LegendSlot {
  card: LegendCard
  isFaceUp: boolean
  isSpent: boolean
  isOnField: boolean             // If Go Solo was used
  goSoloUnit?: UnitOnField       // Legend acting as Unit
}
```

### GigDie Interface
```typescript
interface GigDie {
  type: DieType                  // d4, d6, d8, d10, d12, d20
  value: number                  // Rolled value (face showing)
  maxValue: number               // 4, 6, 8, 10, 12, 20
}
```

### Game Actions
```typescript
type GameAction =
  | { type: 'SELL_CARD'; cardIndex: number }
  | { type: 'CALL_LEGEND'; legendIndex: number }
  | { type: 'PLAY_UNIT'; cardIndex: number }
  | { type: 'PLAY_GEAR'; cardIndex: number; targetInstanceId: string }
  | { type: 'PLAY_PROGRAM'; cardIndex: number }
  | { type: 'GO_SOLO'; legendIndex: number }
  | { type: 'ATTACK_UNIT'; attackerInstanceId: string; targetInstanceId: string }
  | { type: 'ATTACK_RIVAL'; attackerInstanceId: string }
  | { type: 'USE_BLOCKER'; blockerInstanceId: string }
  | { type: 'CHOOSE_GIG_DIE'; dieIndex: number }
  | { type: 'END_PLAY_PHASE' }
  | { type: 'END_ATTACK_PHASE' }
  | { type: 'MULLIGAN'; doMulligan: boolean }
  | { type: 'SELECT_TARGET'; pendingActionId: string; selectedTargets: string[] }
  | { type: 'DECLINE_OPTIONAL_EFFECT'; pendingEffectId: string }
  | { type: 'SELECT_GIG_TO_STEAL'; gigDieIndex: number }
  | { type: 'FORFEIT'; reason: 'abandon' | 'timeout' }
```

### Phase Execution

#### ReadyPhase
1. Draw 1 card from deck (check deck-out)
2. Player chooses a die from Fixer Area (not d20 unless last)
3. Roll die → set value → move to Gig Area
4. Update Street Cred
5. Ready all spent cards (turn upright)
6. Check win condition: 6+ Gigs at start of turn = WIN

#### PlayPhase
- Sell: Once per turn, reveal €$ card → face-down to Eddies
- Call: Once per turn, spend 2 Eddies → flip Legend → resolve FLIP/CALL
- Play Unit: Spend Eddies = cost → place on Field (spent, playedThisTurn=true) → resolve PLAY
- Play Gear: Spend Eddies = cost → attach to friendly Unit → resolve PLAY
- Play Program: Spend Eddies = cost → resolve effect → to trash
- Go Solo: Pay Legend cost → Legend enters Field as ready Unit → can attack this turn
- Player ends Play Phase manually

#### AttackPhase
For each attacking Unit (one at a time):
1. Choose target: spent rival Unit OR rival directly
2. Spend attacker → resolve ATTACK trigger
3. Defensive step: rival may Call Legend or use BLOCKER
4. If target is Unit → FIGHT (compare power, loser defeated)
5. If target is rival → STEAL (take Gig Die, +1 per 10 power)
6. Player ends Attack Phase when done

### Effect Resolution
- Effects resolved via EffectEngine.ts
- Per-card handlers in lib/effects/handlers/ALPHA/
- Pending system for multi-step effects (target selection, choices)
- Optional effects can be declined
- Mandatory effects must resolve

### Power Calculation
```
Effective Power = card.power + gear.power (all attached) + powerModifiers
- GO SOLO Legends use their card power
- BLOCKER redirects but no Gig steal
- Every 10 power on direct attack = steal 1 extra Gig
```

---

## Card Data Structure

File: `lib/data/cyberpunk_tcg_complete.json` — 46 cards in ALPHA set

```typescript
interface CardData {
  id: string               // "ALPHA-001"
  rarity: string | null    // Not yet assigned
  number: string           // "001"
  set: string              // "ALPHA"
  card_type: CardType      // "legend" | "unit" | "gear" | "program"
  color: CardColor          // "red" | "blue" | "green" | "yellow"
  name_en: string
  name_fr: string
  title_en: string          // Subtitle (e.g., "Embracing Destruction")
  title_fr: string
  cost: number | null       // Eddies cost (null for some Legends)
  power: number | null      // Combat power (null for Programs)
  ram: number               // RAM value for deck building
  classifications: string[] // Tags: Arasaka, Merc, Corpo, etc.
  keywords: string[]        // GO_SOLO, BLOCKER, PLAY, ATTACK, FLIP, CALL
  effects: CardEffect[]
  image_url: string         // CDN URL (backup)
  image_file: string        // Local path
  data_complete: boolean
}

interface CardEffect {
  type: string              // PASSIVE, PLAY, ATTACK, FLIP, CALL, GO_SOLO, etc.
  description_en: string
  description_fr: string
}
```

### Card Distribution (46 cards)
- **By type:** 15 Legends, 18 Units, 7 Gear, 6 Programs
- **By color:** Red 11, Yellow 14, Green 10, Blue 11
- **Images:** 40/46 downloaded (6 missing: ALPHA-029, 033, 034, 037, 040, 042)

---

## Feature Specifications

### Authentication
- **NextAuth** with JWT sessions
- **Credentials provider:** email + bcrypt password
- **Discord OAuth:** identify, email, guilds.join scopes
- **Password reset:** Resend email with time-limited token
- **Roles:** user, admin, tester

### Social Features
- **Friends:** Send/accept/decline/remove requests
- **Match Invites:** Invite friends to games with room codes
- **In-Game Chat:** Real-time Socket.IO chat with emotes
- **Chat Moderation:** Report messages, admin review, bans
- **Spectators:** Watch games in real-time

### Game Modes
1. **Play vs AI** — Easy/Medium/Hard/Impossible difficulties
2. **Play Online** — Public matchmaking or private room codes
3. **Hotseat** — Local 2-player on same device
4. **Sealed/Draft** — Open boosters, build deck from pool, play
5. **Training** — AI coach provides real-time strategic advice

### Deck Builder
- Drag-and-drop interface
- Real-time validation (40-50 cards, 3 Legends, RAM limits, max 3 copies)
- Card filtering by type, color, classification, keyword
- Save/load/delete/reorder decks

### Tournament System
- Single-elimination brackets with bye handling
- Standard and sealed tournament modes
- Absence timer with auto-forfeit
- Discord role rewards for winners
- Join by code

### Leaderboard & ELO
- ELO formula: `E = 1/(1+10^((opp-self)/400))`, K=32 (<2000) / K=16 (≥2000)
- Min ELO: 100
- League tiers based on ELO ranges
- Win/Loss/Draw records
- Search and pagination

### Collection Browser
- Grid view of all 46 cards
- Filter by type, color, classification, keyword
- Card detail modal with full art and effect text
- Silhouette placeholders for missing images

### Learning & Quiz
- Interactive lessons on game rules
- Quiz with card effect questions
- Score tracking with leaderboard

### Replay System
- Full game state serialized per action
- Step forward/backward with playback controls
- Action narration in log

### Settings
- Animations toggle
- Game background selection
- Badge preferences
- Language (EN/FR via i18n)

### Admin Panel
- Card management and issue tracking
- Ban list management
- User management (bans, roles)
- Site settings (leagues, sealed toggles)
- Suggestion/bug tracking with status workflow
- Discord role configuration
- Maintenance mode with graceful drain

---

## SEO & Performance

### Next.js Optimization
- **Image formats:** AVIF, WebP with responsive srcSet
- **Cache headers:** Card images 1 year immutable, other images 24h
- **Standalone output** for Docker deployment
- **Compression** enabled

### Security Headers
- Content-Security-Policy (self + analytics)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
- Permissions-Policy: camera=(), microphone=(), geolocation=()

### Metadata
- Per-page title and description via Next.js metadata API
- JSON-LD structured data (WebApplication, VideoGame)
- Open Graph and Twitter Card meta tags
- Dynamic sitemap.xml
- robots.txt with crawl rules

### Performance
- Lazy loading for card images
- Zustand for lightweight state management
- Socket.IO with WebSocket primary, polling fallback
- Framer Motion animations respect user's animationsEnabled preference

---

## Animation Design

All animations use **Framer Motion** and respect the `animationsEnabled` user setting.

### Menu Animations
- Title: Letter-by-letter reveal with staggered delays (0.04s per letter)
- Buttons: Sequential slide-in from left with easeOut
- Featured card: Fade-in with scale + pulsing glow behind
- Background: Floating particles, animated grid lines, scanlines

### Game Board Animations
- **Dice Roll:** 3D tumble animation with final value reveal
- **Card Play:** Card slides from hand to field with neon trail
- **Attack:** Attacker slides toward target with impact shake
- **Fight:** Power comparison with flash, loser fades to trash
- **Steal Gig:** Die floats from rival's area to yours with glow trail
- **Call Legend:** Flip animation with FLIP effect burst
- **Go Solo:** Legend transforms into Unit with energy surge
- **BLOCKER:** Shield effect intercepts attack path
- **Defeat:** Card shatters with red particle explosion
- **Win/Lose:** Full-screen overlay with neon typography

### Card Interactions
- **Hover:** 3D tilt following mouse (±15deg)
- **Holographic shimmer:** Color-shifting overlay on mouse move
- **Glare:** Radial light following cursor
- **Click:** 180deg flip to card back
- **Neon border glow:** Intensifies on hover

### Sealed Mode
- **Booster opening:** Package tears open with particle burst
- **Card reveal:** Cards slide out one by one with rarity-colored glow
- **Timer:** Countdown with pulsing urgency as time runs low

---

## Socket.IO Events

### Room Management
- `room:create` / `room:join` / `room:leave`
- `room:player-joined` / `room:player-left`
- `room:list-update` — broadcast public rooms

### Game Actions
- `game:action` — player action
- `game:state-update` — state sync to clients
- `game:your-turn` — turn notification
- `game:ended` — game over with ELO changes

### Tournament
- `tournament:subscribe` / `tournament:unsubscribe`
- `tournament:ready` / `tournament:report-present`
- `tournament:match-ready` / `tournament:match-updated`
- `tournament:absence-timer` / `tournament:player-forfeited`

### Chat
- `chat:send` / `chat:emote` / `chat:history`

### Timers
- 2-minute action timeout (auto-forfeit after 3 consecutive)
- 2-minute disconnect grace period
- 15-minute sealed deck building timer

---

## Discord Integration
- **OAuth login** with account linking/unlinking
- **Role sync** based on ELO achievements
- **Tournament rewards** with role assignment
- **Rank-up webhook** notifications
- **Highest ELO tracking** for Discord profile

---

## Environment Variables
See `.env.example` for all required variables:
- DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
- DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET
- BOT_DISCORD_TOKEN, SERVER_DISCORD_ID, DISCORD_RANKUP_WEBHOOK_URL
- RESEND_API_KEY
- NEXT_PUBLIC_SOCKET_URL
- NODE_ENV, PORT, HOSTNAME

---

## Development Commands
```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build (prisma generate + next build)
npm run start        # Start production server
npm run lint         # ESLint check
```

---

## Deployment
- **Docker:** Multi-stage Dockerfile (deps → build → runner)
- **Platform:** Railway (auto-detects RAILWAY_PUBLIC_DOMAIN)
- **Health check:** GET /api/health
- **Graceful shutdown:** SIGTERM triggers drain → active games finish → shutdown

---

## Style Guide
- **Dark theme only** — no light mode
- **Colors:** Cyan (#00f0ff) primary, Red (#ff003c) danger/accent, Yellow (#fcee09) highlight
- **Background:** #0a0a12 base, #111119 surface, #1a1a25 hover
- **Borders:** #1e2030 default, #00f0ff on hover/active
- **Text:** #e0e8f0 primary, #7a8a9a secondary
- **Fonts:** Refinery for titles/headings, BlenderPro for body/buttons/labels
- **Card aspect ratio:** 63:88
- **Animations:** Always respect user's animationsEnabled setting
- **Responsive:** Mobile-first, sm (640px), lg (1024px) breakpoints
- **No emojis** in UI unless user-initiated (emotes in chat OK)
