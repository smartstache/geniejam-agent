import {Keypair} from "@solana/web3.js";
import {HeliusConnectionWrapper} from "./utils/HeliusConnectionWrapper";

require('dotenv').config();

const { LAMPORTS_PER_SOL} = require('@solana/web3.js');

const fs = require("fs");
const anchor = require('@project-serum/anchor');

export const TASK_WALLET: Keypair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(
    JSON.parse(fs.readFileSync(process.env.TASK_WALLET))));

export const openaiKey = process.env.OPENAI_KEY as string;

const rpcUrl = process.env.RPC_URL as string;
console.log(`should be a DAS-supported endpoint (like helius): ${rpcUrl}`);

export const heliusConnection = new HeliusConnectionWrapper(rpcUrl);

export async function printConfig() {
   let authWalletBalance = await heliusConnection.getBalance(TASK_WALLET.publicKey);
   console.log(`authority wallet ${TASK_WALLET.publicKey.toBase58()} balance: ${authWalletBalance / LAMPORTS_PER_SOL} SOL`);
}

export function getCrossmintUrl(path: string): string {
   return `https://${process.env.CROSSMINT_ENV}.crossmint.com${path}`;
}

export const crossmintCollection = process.env.CROSSMINT_COLLECTION as string;

export const crossmintRequestConfig: any = {
      headers: {
        'Content-Type': 'application/json',
        'x-client-secret': process.env.CROSSMINT_SECRET,
        'x-project-id': process.env.CROSSMINT_PROJECT_ID
      },
    };
