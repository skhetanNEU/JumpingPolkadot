# JumpingPolkadot

## Summary
This is a jumping polkadot game built on Polkadot (currently with Shibuya Testnet). In this game, players can pay 1 DOT and play the game and win prizes if they are able to reach certain heights with the polkadot (ball in the game)

## Description
The frontend of the game is built with React and the smart contract is built with solidity.
Currently, the smart contract is deployed on the Shibuya Testnet but can be easily deployed on the mainnet following the same method.

When the game starts, it will show up a "Play" button. When user clicks on it, it will try to initiate a transaction to pay 1 DOT as a fees to play the game.

If the wallet is not connected, it will first try to connect the wallet and then try out the transaction.

Once the fees is paid and the transaction is successful, it will start the game within 3 seconds and the player should aim to reach the heighest point by moving the ball using bricks as support in each level.

If the player is able to cross a score of 5000, they will atleast get back the playing fees they paid i.e 1 DOT but if they are able to cross a score of 10000, they will get a double amount back i.e 2 DOT.

The game ends when the ball falls into the pit and the player has an option to play it again by paying the fees of 1 DOT again to play the game and get a chance to win double the money.

## Technical Description
Game built using React, HTML, JavaScript, CSS
Smart contract built using Solidity
Contract deployed on Shibuya Testnet for now
With the gaming environment booming on Polkadot, we can definitely add more features in the future to make the game more interesting such as -  
1. Multiplayer game where we compete against a friend/another player and whoever wins get 1.8 times the amount and 0.2 goes to the contract making it more profitable for the game owner.
2. Adding features such as boost power or high jumper power for certain durations making the game more interesting.
3. Having leaderboards and arranging weekly or monthly competitions with more prizes.

We can also have different balls with special powers and players can buy them from a marketplace to use those balls when they play.

## Demo Video - 



## Game Flow - 

### 1. Connect to metamask


### 2. When we click on Play, metamask transaction pop up to pay the game fees of 1 DOT and start the game


### 3. As soon as the transaction is completed, game starts within 3 seconds and players has to aim to reach the highest point they can reach with the ball


### 4. Use moving bricks and fixed bricks on each level to move up


### 5. When the game ends, if player has crossed a score of 5000, a metamask pop up will show to confirm on payback transaction. Else, game ends






