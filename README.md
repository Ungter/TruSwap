I didnt have time to do a demo :(

# CrossPay - Cross-Chain Bridge Application

A seamless cross-chain bridge enabling USDC transfers between **Base** (Ethereum L2) and **Solana** using Circle's Cross-Chain Transfer Protocol (CCTP).

## Table of Contents

- [Problem Being Solved](#problem-being-solved)
- [Layer 2 Advantages](#layer-2-advantages)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Features](#features)

## Problem Being Solved

The reason I created this app is because theres always sometimes when I try to bridge something, but I get either an error, or there isn't liquidity for the token I want to bridge.

**Solution!!!**

We use Kyberswap and Jupiter to aggregate the best route to swap any token to USDC, and then use Circle's CCTP to bridge the USDC to Solana. 


## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │   Privy     │  │ CrossChain   │  │     Wallet Display     │  │
│  │   Auth      │  │   Bridge     │  │   (Base + Solana)      │  │
│  └─────────────┘  └──────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌────────────────┐  ┌────────────────────┐
│   KyberSwap     │  │   Jupiter      │  │      Privy         │
│   Aggregator    │  │   Aggregator   │  │   Embedded Wallets │
│   (Base DEX)    │  │   (Solana DEX) │  │   + Gas Sponsor    │
└─────────────────┘  └────────────────┘  └────────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Circle CCTP Bridge                            │
│  ┌─────────────────────┐        ┌─────────────────────────────┐ │
│  │  TokenMessenger     │◄──────►│     TokenMessenger          │ │
│  │  (Base)             │  CCTP  │     (Solana)                │ │
│  └─────────────────────┘        └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Flow: Base → Solana

1. User inputs amount and selects token on Base
2. KyberSwap aggregates best route to swap token → USDC
3. USDC is approved for Circle's TokenMessenger contract
4. TokenMessenger burns USDC on Base, generates attestation
5. Circle attests the burn (off-chain)
6. USDC is minted to recipient on Solana

### Flow: Solana → Base

1. User inputs amount and selects token on Solana
2. Jupiter aggregates best route to swap token → USDC
3. TokenMessenger burns USDC on Solana
4. Circle attests the burn
5. USDC is minted to recipient on Base

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Styling** | Tailwind CSS + DaisyUI |
| **Wallet Auth** | Privy (Embedded Wallets) |
| **EVM Integration** | wagmi + viem |
| **Solana Integration** | @solana/web3.js |
| **Base DEX** | KyberSwap Aggregator API |
| **Solana DEX** | Jupiter Aggregator API |
| **Bridge** | Circle CCTP |
| **Gas Sponsorship** | Privy Native Sponsorship |

## Setup

### Prerequisites

- Node.js 18+
- Yarn or npm
- Privy account with app configured
- (Optional) KyberSwap API key
- (Optional) Jupiter API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cross-chain-app.git
cd cross-chain-app

# Install dependencies
yarn install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Required: Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# Optional: API Keys for better rate limits
NEXT_PUBLIC_KYBERSWAP_CLIENT_ID=cross-chain-app
NEXT_PUBLIC_JUPITER_API_KEY=your_jupiter_api_key
```

## Local Development

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

The app will be available at `http://localhost:3000`

## Features

- **🔐 Embedded Wallets**: Users get wallets automatically on login (email, Google, Twitter)
- **⛽ Gas Sponsorship**: Transactions are sponsored - users don't need native tokens for gas
- **🔄 Any Token → USDC**: Swap any supported token to USDC before bridging
- **🌉 Native USDC Bridge**: Uses Circle CCTP for secure, 1:1 USDC transfers
- **🎨 Premium UI**: Dark mode with glassmorphism, gradients, and smooth animations
- **📱 Responsive**: Works on desktop and mobile

## Security Considerations

- All bridging uses Circle's audited CCTP contracts
- Privy handles wallet security with TEE (Trusted Execution Environment)
- No wrapped or synthetic tokens - only native USDC
- Rate limiting recommended for gas sponsorship

## License

MIT
