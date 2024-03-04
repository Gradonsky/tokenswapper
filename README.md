### TokenSwapper
TokenSwapperForEiger is a Solidity contract designed for the Ethereum blockchain. It facilitates the exchange of Ether for any ERC-20 token using Uniswap V3 as the underlying decentralized exchange (DEX). This contract aims to provide a secure, upgradable, and user-friendly mechanism for swapping tokens, with a focus on minimizing trust and ensuring safety.
Checked with Slither & Solhinted.

# Prerequisites
Before deploying the TokenSwapper contract, ensure you have the following:
Node.js and npm installed (Node.js version >= 18.18.0)
Truffle or Hardhat for compiling and deploying.
An Ethereum wallet with Ether on a public testnet (e.g., Sepolia).


# Environment configuration
npm install

# Deployment
in order to deploy this contract please create a .env file and provide the necessary datapoints 

run the following command

npx hardhat run scripts/deploy.js --network goerli

to deploy on any other blockchains simply change the name of the network in the hardhat.config file and paste the rpc url in the env file then run

npx hardhat run scripts/deploy.js --network <desired network>

# Usage
Swapping Ether to ERC-20 Tokens
To swap Ether to an ERC-20 token, call the swapEtherToToken function with the token's address and the minimum amount of tokens you wish to receive.

Pausing and Unpausing Transactions
The contract can be paused or unpaused by an account with the DEFAULT_ADMIN_ROLE, typically for emergency purposes. Use the pause and unpause functions accordingly.

Setting Token Types
Admins can set the type of tokens (STABLE or EXOTIC) to optimize fee structures using the setTokenType function. 
This adjusts the Uniswap fee tier used during swaps to optimize the run.


# Testing
to run tests run
npx hardhat test

to determine coverage run
npx hardhat coverage
a report will be printed to ./coverage folder


# Verification
After successfully deploying the contract you can verify it on the corresponding block explorer by running

npx hardhat verify --network <network> <contract address> <constructor parameters>

# Gas Report

·-------------------------------------------------|----------------------------|-------------|-----------------------------·
|              Solc version: 0.8.20               ·  Optimizer enabled: false  ·  Runs: 200  ·  Block limit: 30000000 gas  │
··················································|····························|·············|······························
|  Methods                                                                                                                 │
·························|························|··············|·············|·············|···············|··············
|  Contract              ·  Method                ·  Min         ·  Max        ·  Avg        ·  # calls      ·  usd (avg)  │
·························|························|··············|·············|·············|···············|··············
|  MockERC20Token        ·  mint                  ·           -  ·          -  ·      51859  ·            1  ·          -  │
·························|························|··············|·············|·············|···············|··············
|  MockERC20Token        ·  transfer              ·       47410  ·      47422  ·      47421  ·           20  ·          -  │
·························|························|··············|·············|·············|···············|··············
|  TokenSwapperForEiger  ·  initialize            ·      102409  ·     102421  ·     102420  ·           20  ·          -  │
·························|························|··············|·············|·············|···············|··············
|  TokenSwapperForEiger  ·  pause                 ·           -  ·          -  ·      52628  ·            2  ·          -  │
·························|························|··············|·············|·············|···············|··············
|  TokenSwapperForEiger  ·  setSwapRouterAddress  ·           -  ·          -  ·      35795  ·            1  ·          -  │
·························|························|··············|·············|·············|···············|··············
|  TokenSwapperForEiger  ·  setTokenType          ·       33930  ·      53842  ·      43885  ·           14  ·          -  │
·························|························|··············|·············|·············|···············|··············
|  TokenSwapperForEiger  ·  swapEtherToToken      ·       84910  ·      85129  ·      84983  ·            6  ·          -  │
·························|························|··············|·············|·············|···············|··············
|  TokenSwapperForEiger  ·  unpause               ·           -  ·          -  ·      30703  ·            1  ·          -  │
·························|························|··············|·············|·············|···············|··············
|  Deployments                                    ·                                          ·  % of limit   ·             │
··················································|··············|·············|·············|···············|··············
|  MockERC20Token                                 ·     1012416  ·    1012488  ·    1012433  ·        3.4 %  ·          -  │
··················································|··············|·············|·············|···············|··············
|  MockUniswapV3Router                            ·           -  ·          -  ·     330070  ·        1.1 %  ·          -  │
··················································|··············|·············|·············|···············|··············
|  TokenSwapperForEiger                           ·           -  ·          -  ·    2091878  ·          7 %  ·          -  │
··················································|··············|·············|·············|···············|··············
|  UUPSProxy                                      ·           -  ·          -  ·     194027  ·        0.6 %  ·          -  │
·-------------------------------------------------|--------------|-------------|-------------|---------------|-------------·