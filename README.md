# VoxCard Savings Platform

## Overview

VoxCard is a decentralized savings platform built on XION (CosmWasm). It allows users to create, join, and manage savings plans (rotating savings circles) with smart contract security and optional gasless transactions.

## Architecture

- **Frontend:** React + Vite + TypeScript. All blockchain logic (contract deployment, transactions, wallet integration) is handled in the browser using the Abstraxion/XION wallet SDK.
- **Backend:** Node.js/Express + PostgreSQL. Used only for storage and retrieval of plan metadata, user info, and transaction records. No blockchain logic or wallet code.
- **Smart Contracts:** CosmWasm (Rust). All business logic for savings plans and treasury/gasless transactions is on-chain.

## Key Features
- User-created savings plans (no admin restriction)
- Plan cancellation, update, and emergency withdrawal (by plan creator)
- Partial payment support
- Gasless transactions via treasury contract
- Cleaned up legacy Cardano/Aiken code

## How to Deploy the Smart Contract

1. **Compile the contract:**
   ```sh
   cargo wasm
   ```

2. **Optimize the WASM (recommended):**
   ```sh
   docker run --rm -v $(pwd):/code \
     --mount type=volume,source=$(basename $(pwd))_cache,target=/code/target \
     --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
     cosmwasm/workspace-optimizer:0.12.11
   ```

3. **Upload the contract to XION:**
   ```sh
   wasmd tx wasm store artifacts/contract.wasm --from <your-key> --gas auto --gas-adjustment 1.3 --node <node-url> --chain-id <chain-id>
   ```
   - Get the `codeId` from the transaction result and use it in your frontend for instantiating new plans.

4. **Instantiate contracts from the frontend:**
   - The React app uses the wallet to deploy and interact with contracts. The backend only stores metadata.

## How to Run Locally

```sh
# Clone the repository
https://github.com/Goodnessmbakara/voxcard.git
cd voxcard

# Install dependencies
pnpm install

# Start the frontend
dpnm dev

# Start the backend (in another terminal)
cd backend
pnpm install
pnpm dev
```

## Cleanup Notes
- All Cardano/Aiken (Plutus/Aiken) code and dependencies have been removed. Only CosmWasm contracts are used.

## Technologies Used
- Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- CosmWasm (Rust), XION, Abstraxion wallet
- Node.js, Express, PostgreSQL

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

For more details, see the code and comments in the repository.