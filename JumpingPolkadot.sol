// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts@4.4.1/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@4.4.1/access/Ownable.sol";

contract jumping_polkadot is ERC721, Ownable {
    uint256 private PLAY_COST = 1000000000 gwei;
    mapping(address => uint256) private currentPlayerList;

    constructor() ERC721("JumpingPolkadot", "JPD" ) {
    }

    function startPlay() external payable {
        require(msg.value >= PLAY_COST, "Not enough");
        currentPlayerList[msg.sender] = 1;
    }

    function Payback(uint256 heightReached) public payable{
        require(currentPlayerList[msg.sender] == 1, "Player hasn't played");
        uint256 reward = 0;
        if(heightReached >= 10000){
            reward = 2 * PLAY_COST;
        }
        else if(heightReached >= 5000){
            reward = PLAY_COST;
        }
        else{
            reward = 0;
        }
        currentPlayerList[msg.sender] = 0;
        payable(msg.sender).transfer(reward);
    }

    function withdrawBalance() public onlyOwner
    {
        require(address(this).balance > 0, "Balance is 0");
        payable(owner()).transfer(address(this).balance);
    }
}