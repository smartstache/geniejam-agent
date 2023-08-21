import {heliusConnection, TASK_WALLET, openaiKey} from '../config';
import {ReadApiAsset, ReadApiAssetList} from '@metaplex-foundation/js';
import {Keypair, PublicKey} from '@solana/web3.js';
import axios from 'axios';

import OpenAI from 'openai';

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

  interface Task {
    requestAssetId: string;
    type: string;
    params: any;
    responseHandler: string;
  }

export class Agent {

  private taskWallet: Keypair;
  private openaiKey: string;
  private openai: any;

  static async run(): Promise<void> {
    const agent = new Agent();
    await agent.init();
    await agent.start();
  }

  constructor() {
    this.taskWallet = TASK_WALLET;
    this.openaiKey = openaiKey;
    this.openai = new OpenAI({apiKey: this.openaiKey});
  }

  private async init(){
    console.log(`agent task wallet: ${this.taskWallet.publicKey.toBase58()}`);
  }

  private async start(): Promise<void> {
    await this.checkAndProcessTasks()
    // wake up every 30 seconds to check for new task request to process
    // while(true) {
    //   await sleep(30000);
    // }
  }

  private async checkAndProcessTasks() {
    const tasks = await this.getTasks();
    console.log(`found ${tasks.length} tasks`);
    // now process each task
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      await this.processTask(task);
    }
  }

  private async processTask(task: Task) {
    console.log(`processing task with request asset id: ${task.requestAssetId}`);
    console.log('generating a poem about: ', task.params['poem_subject']);

    const gptResponse = await this.openai.chat.completions.create({
      temperature: 0.8,
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Pretend that you\'re Edgar Allan Poe, and that you can write masterful poems about any subject.',
        },
        {
          role: 'user',
          content: `i'd like you to write a poem about: ${task.params.subject}`,
        },
      ],
    });
    console.log('gpt response: ');
    console.dir(gptResponse, {depth: null});

    console.log("transferring cnft out!");

    // todo: mint a


    // await heliusConnection.transferCompressed(this.wallet, new PublicKey(task.assetId), this.wallet.publicKey,
    //   new PublicKey('r3cXGs7ku4Few6J1rmNwwUNQbvrSPoLAAU9C2TVKfow'));

      console.log('transferred!');
  }

  // goes through all the cNFTs owned by the agent and finds the ones that are tasks
  private async getTasks(): Promise<Task[]> {
    const assetList: ReadApiAssetList = await heliusConnection.getAssetsByOwner({ownerAddress: this.taskWallet.publicKey.toBase58()});

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
      if (asset.content.metadata?.symbol === 'gj-req') {
        // fetch the json to get the task info/params
        const response = await axios.get(asset.content.json_uri);
        console.log(`fetched json for asset ${asset.id}, at url: ${asset.content.json_uri}`);
        const data = await response.data;

        const requestAttributeData = data.attributes.find(attribute => attribute.trait_type === 'request');
        if (requestAttributeData) {
          const requestParams = JSON.parse(requestAttributeData.value);
          console.log('request data: ');
          console.dir(requestAttributeData, {depth: null});

          tasks.push({requestAssetId: asset.id, type: requestAttributeData.type, responseHandler: requestAttributeData.responseHandler, params: requestParams.params});
        }
      }
    }

    console.log(`found ${tasks.length} gj-request assets:`);
    console.dir(tasks, {depth: null});
    return tasks;
  }

}
