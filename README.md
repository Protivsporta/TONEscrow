# TON Escrow contract

This repository is an example of TON smartcontracts implementation. 
Exactly it is one-time deployed smartcontract with ability for sale peer-to-peer

Involved actors:
- Guarantor
- Seller
- Buyer

And the contract also supports royalties for guarantor

## User-flow

- Buyer deploys smart contract with desired amount of TON coins
- Guarantor checks if everything is OK (both onchain & offchain)
- If everything is OK - guarantor send's special signed message to contract & contract sends coins to seller
- If something goes wrong - guarantor send's special signed message to contract & contract returns coins to buyer

## Installation

```bash
npm install
```

## Scripts 

- Tests:
```bash
npm run test
```
- Nodemon tg-bot start:
```bash
npm run dev
```
- Simple tg-bot start:
```bash
npm run start
```


## How it works 


## Usage

Usage is pretty straightforward: first of all, you should create an instance of SmartContract.
You could think of SmartContract as an existing deployed smart contract with which you can communicate.



