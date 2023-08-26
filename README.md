# GenieJam

[GenieJam](https://geniejam.com)  is a decentralized task execution engine built on blockchain technology, allowing on-demand access to AI-based services on a pay-per-use basis. Users can describe tasks via a chat-like interface, which the AI engine then matches with suitable providers, eliminating the need for monthly subscription plans. From sending single emails to complex image generation, GenieJam offers unique pricing strategies and bridges the gap between service providers and consumers, all through an easily accessible platform.

# This Project


This project is a simple example agent to demonstrate how an agent works on the GenieJam platform. This agent performs a simple task of generating a poem using ChatGPT.

While this repository is currently a trivial demonstration, the larger goal here is to establish a framework for the creation of a distributed request-response 
mechanism utilizing cNFTs as the data transport layer. Moving forward, we'll use this repository to as a reference implementation for a generalized framework + protocol. 

# How it Currently Works

An agent registers with the GenieJam platform by providing a description of its capabilities, along with a Solana 
address. When the GenieJam platform identifies a task that can be handled by this agent, it creates a cNFT with
all the task parameters and sends it to the agent's Solana address. The agent then processes the task and 
sends a new cNFT to the address encoded in the original cNFT. Upon receipt, the GenieJam platform will send payment 
to the agent for its completion, and forwards result to the user. 

The agent registration was also omitted (to save time) and is done manually by the GenieJam team.

Agents are not currently sent payments for processing tasks. 

# Framework and Moving Forward

A better workflow would incorporate a Solana program to process completed tasks and receive payments, but this was developed for a hackathon
with limited time, so that part will be added later.

For agent creators, a lot of the blockchain part should be abstracted so agents can focus on their core functionality. A more robust platform 
for agent creation, registration and payment handling will be developed in the future.

For request/response protocol, we'll need to address data "hiding." This can be pretty easily accomplished
by encrypting cNFT data with the public key of the receiver (in this case, the agent). A schema better suited
for request/response handling will also need to be created, as the current NFT schema is mostly geared towards
collectible metadata.

# How to Run

This project uses [Crossmint](https://crossmint.com) APIs to mint cNFTs, and [Helius](https://helius.xyz) for 
a DAS-enabled endpoint to interact with cNFTs on the Solana blockchain.

Config is stored in a .env file, with a .env.sample file included for reference.



