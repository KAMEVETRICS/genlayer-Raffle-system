# GenLayer Raffle System - Project Status

## Overview
This project was converted from a Football Betting application to an **AI-powered Raffle System** built on GenLayer blockchain.

## Current State: COMPLETE AND FUNCTIONAL

### Deployed Contract
- **Network**: GenLayer Studionet
- **Contract Address**: `0x7A457096AdbB5633EE813C215d595b944e04cdA9`
- **Contract File**: `contracts/raffle.py`

### How the Raffle System Works
1. **Creator** creates a raffle with:
   - A reason/theme for the raffle
   - Number of winners to select
   - End date

2. **Participants** enter raffles with:
   - A unique username (globally unique across all raffles)
   - A reason why they deserve to win

3. **AI Selection**: When the creator triggers winner selection:
   - GenLayer's LLM evaluates all participant reasons
   - Matches them against the raffle's theme/purpose
   - Selects the specified number of winners

4. **Privacy**: Participant reasons are hidden until the raffle is resolved

## Project Structure

```
genlayer-project-boilerplate/
├── contracts/
│   └── raffle.py              # GenLayer Intelligent Contract
├── frontend/
│   ├── app/
│   │   ├── layout.tsx         # App layout with metadata
│   │   ├── page.tsx           # Main page with RaffleList
│   │   └── providers.tsx      # React Query + Wallet providers
│   ├── components/
│   │   ├── AccountPanel.tsx   # Wallet connection UI
│   │   ├── CreateRaffleModal.tsx
│   │   ├── EnterRaffleModal.tsx
│   │   ├── RaffleCard.tsx     # Raffle summary card
│   │   ├── RaffleDetail.tsx   # Full raffle view modal
│   │   ├── RaffleList.tsx     # Grid of all raffles
│   │   └── Navbar.tsx         # Navigation with stats
│   ├── lib/
│   │   ├── contracts/
│   │   │   ├── Raffle.ts      # Contract interaction class
│   │   │   └── types.ts       # TypeScript interfaces
│   │   ├── hooks/
│   │   │   └── useRaffle.ts   # React Query hooks
│   │   └── genlayer/
│   │       ├── client.ts      # GenLayer client setup
│   │       └── wallet.tsx     # MetaMask wallet context
│   └── .env                   # Contract address config
└── deploy/
    └── deployScript.ts        # Deployment script
```

## Contract Methods

| Method | Type | Description |
|--------|------|-------------|
| `create_raffle(reason, num_winners, created_at, end_date)` | write | Create a new raffle |
| `enter_raffle(raffle_id, username, reason, entry_timestamp)` | write | Enter a raffle |
| `select_winners(raffle_id)` | write | Creator-only, AI selects winners |
| `get_all_raffles()` | view | Get all raffles |
| `get_raffle(raffle_id)` | view | Get single raffle details |
| `get_participants(raffle_id)` | view | Get participants (reasons hidden if unresolved) |
| `get_winners(raffle_id)` | view | Get winner usernames |
| `is_username_taken(username)` | view | Check username availability |
| `get_participant_count(raffle_id)` | view | Get number of participants |

## Technical Notes

### Contract Storage Types
- `num_winners` uses `u32` (not Python `int`) - GenLayer requires sized integers
- Winners stored in `TreeMap[str, TreeMap[str, str]]` (not DynArray in dataclass)
- All storage classes need `@allow_storage` decorator

### Frontend Considerations
- `raffle.num_winners` comes as BigInt from contract - use `Number()` to convert
- DialogDescription renders as `<p>` - use `asChild` prop for complex content
- Loading dialogs need hidden DialogTitle for accessibility

## Running the Project

```bash
# Frontend
cd frontend
npm run dev
# Opens at http://localhost:3000

# Deploy contract (if needed)
npm run deploy
# Then update frontend/.env with new address
```

## Environment Variables

```env
# frontend/.env
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_CHAIN_NAME=GenLayer Studio
NEXT_PUBLIC_GENLAYER_SYMBOL=GEN
NEXT_PUBLIC_CONTRACT_ADDRESS=0x7A457096AdbB5633EE813C215d595b944e04cdA9
```

## Issues Resolved
1. ✅ DynArray cannot be instantiated in dataclass - use separate TreeMap
2. ✅ Python `int` not allowed in storage - use `u32`
3. ✅ BigInt arithmetic in JS - convert with `Number()`
4. ✅ Nested `<p>` tags in DialogDescription - use `asChild` prop
5. ✅ Missing DialogTitle for accessibility - add hidden title with `sr-only`
6. ✅ Orphaned div tag in AccountPanel - removed

## Last Updated
January 2026 - Project fully functional with all features working.
