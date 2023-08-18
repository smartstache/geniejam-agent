import {heliusConnection, AUTHORITY, openaiKey} from '../config';
import {ReadApiAsset, ReadApiAssetList} from '@metaplex-foundation/js';
import {Keypair, PublicKey} from '@solana/web3.js';
import axios from 'axios';

import OpenAI from 'openai';
import { StringLiteralLike } from 'typescript';


export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

  interface Task {
    assetId: string;
    type: string;
    params: any;
    responseHandler: string;
  }

export class Agent {

  private wallet: Keypair;
  private openaiKey: string;
  private openai: any;

  static async run(): Promise<void> {
    const agent = new Agent();
    agent.init();
    agent.start();
  }

  constructor() {
    this.wallet = AUTHORITY;
    this.openaiKey = openaiKey;
    this.openai = new OpenAI({apiKey: this.openaiKey});
  }

  private async init(){
    // this.wallet = new Wallet(
    //     Keypair.fromSecretKey(
    //         new Uint8Array(JSON.parse(fs.readFileSync(process.env.WALLET).toString()))
    //     )
    // );
    console.log(`agent wallet: ${this.wallet.publicKey.toBase58()}`);
  }

  private async start(): Promise<void> {
    // wake up every 30 seconds to check for new request to process
    const tasks = await this.getTasks();
    console.log(`found ${tasks.length} tasks`);
    // now process each task
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      // process each task here
      await this.processTask(task);
    }

    // setInterval(() => {
    //   const cnft = await this.getTasks();
    // }, 30000);
  }

  private async processTask(task: Task) {
    console.log(`processing task: ${task.assetId}`);
    // use the openai api to send a 'hello' message to chatgpt

    console.log('subject: ', task.params.subject);
    const gptResponse = await this.openai.chat.completions.create({
      temperature: 0.8,
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a master poet that writes masterful poems about any subject.',
        },
        {
          role: 'user',
          content: `i'd like you to write a poem about: ${task.params.subject}`,
        },
      ],
    });
    console.log('gpt response: ', gptResponse);
    console.dir(gptResponse, {depth: null});

    console.log("transferring cnft out!");

    await heliusConnection.transferCompressed(this.wallet, new PublicKey(task.assetId), this.wallet.publicKey, 
      new PublicKey('r3cXGs7ku4Few6J1rmNwwUNQbvrSPoLAAU9C2TVKfow'));

      console.log('transferred!');;

  }

  // goes through all the cNFTs owned by the agent and finds the ones that are tasks
  private async getTasks(): Promise<Task[]> {
    const assetList: ReadApiAssetList = await heliusConnection.getAssetsByOwner({ownerAddress: this.wallet.publicKey.toBase58()});

    // find the cNFTs
    const compressedAssets: ReadApiAsset[] = [];
    for (let i = 0; i < assetList.items.length; i++) {
      const asset = assetList.items[i];
      if (asset.compression.compressed) {
        compressedAssets.push(asset);
      }
    }

    console.log(`found ${compressedAssets.length} compressed assets:`);
    console.dir(compressedAssets, {depth: null});

    const tasks: Task[] = [];
    
    for (let i = 0; i < compressedAssets.length; i++) {
      const asset = compressedAssets[i];
      if (asset.content.metadata?.symbol === 'GJReq') {
        // fetch the json to get the task info
        const response = await axios.get(asset.content.json_uri);
        console.log(`fetched json for asset ${asset.id}, at url: ${asset.content.json_uri}`);
        const data = await response.data;
        // console.log(`data: ${data}`);
        console.dir(data, {depth: null});

        const requestAttribute = data.attributes.find(attribute => attribute.trait_type === 'request');
        if (requestAttribute) {
          const requestParams = JSON.parse(requestAttribute.value);
          console.log('request params: ', requestParams);

          tasks.push({assetId: asset.id, type: 'poem_gen', responseHandler: 'hello', params: requestParams.params});
        }

        // const parsedData = JSON.parse(data);
        // console.dir(parsedData, {depth: null});

      }
    }
    
    console.log(`found ${tasks.length} GJReq assets:`);
    console.dir(tasks, {depth: null});
    return tasks;
  }

}
