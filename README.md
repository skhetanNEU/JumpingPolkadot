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

## Canva link - 
https://www.canva.com/design/DAGlyvIast8/pC1VB4g2rvJUsbQg4HWqGA/edit?utm_content=DAGlyvIast8&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton


## Demo Video - 
https://www.loom.com/share/a4761e428c594795b851c23b20ea753d?sid=af3a25f0-83e2-4881-838d-443873bad181

## Game Flow - 

### 1. Connect to metamask
![Screenshot 2025-04-26 at 10 05 10 PM](https://github.com/user-attachments/assets/57ce91e0-90cd-4bb5-9a59-60f941874c63)


![Screenshot 2025-04-26 at 10 05 28 PM](https://github.com/user-attachments/assets/528a4d30-454d-48df-99bb-9eca608dcfc5)



### 2. When we click on Play, metamask transaction pop up to pay the game fees of 1 DOT and start the game

![Screenshot 2025-04-26 at 10 05 42 PM](https://github.com/user-attachments/assets/5779d87e-93f8-471e-955d-cebb0f2e5f7c)


### 3. As soon as the transaction is completed, game starts within 3 seconds and players has to aim to reach the highest point they can reach with the ball. Use moving bricks and fixed bricks on each level to move up


![Screenshot 2025-04-26 at 10 06 02 PM](https://github.com/user-attachments/assets/c932de42-cc0d-44a5-9ed4-518722ee304e)



### 4. When the game ends, if player has crossed a score of 5000, a metamask pop up will show to confirm on payback transaction. Else, game ends

![Screenshot 2025-04-26 at 10 06 33 PM](https://github.com/user-attachments/assets/6e10e78c-80d8-4866-85e2-e1881abb6c06)


## Blockexplorer link - 
I tried deploying my contract to Westend Asset Hub but even after multiple attempts and trying to reduce the contract size, I was still getting this error - 
<img width="990" alt="Screenshot 2025-04-27 at 11 21 17 AM" src="https://github.com/user-attachments/assets/9cc843c3-0171-459d-bc9a-78f38781b117" />

I tried getting help from the Mentor but he suggested to have it on Shibuya Testnet for now since Westend Asset Hub is not working as expected.
Hence, deployed it on Shibuya testnet - 
https://shibuya.subscan.io/account/0x02012969BC9c9428f877524C05e557d93792A9e4


