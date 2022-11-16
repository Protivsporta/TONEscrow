# TON Escrow contract

This repository is an example of TON smartcontracts implementation. 
Exactly it is one-time deployed smartcontract with ability for sale peer-to-peer

Involved actors:
- Guarantor
- Seller
- Buyer

## Features

TON Contract executor allows you to: 

- execute smart contracts from existing code and data Cells
- get TVM execution logs
- debug your contracts via debug primitives
- seamlessly handle internal state changes of contract data and code
- call so-called get methods of smart contracts
- send and debug internal and external messages
- debug messages sent by smart contract
- manipulate the C7 register of the smart contract (including time, random seed, network config, etc.)
- make some gas optimizations

**Basically you can develop, debug, and fully cover your contract with unit-tests fully locally without deploying it to the network**

## Installation

```bash
yarn add ton-contract-executor
```

## How it works 
This package internally uses original TVM which runs on actual validator nodes to execute smart contracts.
TVM is built to WASM so this library could be used on any platform.
We also added some layer of abstraction on top of original TVM to allow it to run contracts via JSON configuration (those changes could be found [here](https://github.com/ton-community/ton-blockchain/tree/vm-exec/crypto/vm-exec))

## Usage

Usage is pretty straightforward: first of all, you should create an instance of SmartContract.
You could think of SmartContract as an existing deployed smart contract with which you can communicate.



