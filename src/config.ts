import {Keypair} from "@solana/web3.js";

require('dotenv').config();

const { LAMPORTS_PER_SOL} = require('@solana/web3.js');

const fs = require("fs");
const anchor = require('@project-serum/anchor');

export const AUTHORITY: Keypair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(
    JSON.parse(fs.readFileSync(process.env.AUTHORITY))));

const rpcUrl = process.env.RPC_URL as string;
console.log(`should be a DAS-supported endpoint (like helius): ${rpcUrl}`);

export const connection = new anchor.web3.Connection(rpcUrl, {
   commitment: "confirmed",
});

// export const connection: HeliusConnectionWrapper = new HeliusConnectionWrapper(rpcUrl, {
//    commitment: "finalized",
//    confirmTransactionInitialTimeout: CONFIRM_TIMEOUT_MILLIS
// });

// export const provider = new AnchorProvider(connection, new Wallet(AUTHORITY), {
//    commitment: 'processed',
//    preflightCommitment: 'processed',
// });

export async function printConfig() {
   let authWalletBalance = await connection.getBalance(AUTHORITY.publicKey);
   console.log(`authority wallet ${AUTHORITY.publicKey.toBase58()} balance: ${authWalletBalance / LAMPORTS_PER_SOL} SOL`);
}

