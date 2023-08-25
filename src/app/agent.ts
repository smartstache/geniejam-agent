import {
  heliusConnection,
  TASK_WALLET,
  openaiKey,
  getCrossmintUrl,
  crossmintRequestConfig,
  crossmintCollection
} from '../config';
import {ReadApiAsset, ReadApiAssetList} from '@metaplex-foundation/js';
import {Keypair, PublicKey} from '@solana/web3.js';
import axios from 'axios';

import OpenAI from 'openai';
import {Logger} from "./common/logger";
import {burnAsset, createTransferAssetTx} from "../utils/compression-utils";

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

  interface TaskRequest {
    requestAssetId: string;
    orderId: number,
    taskId: number,
    type: string;
    params: any;
    responseHandler: string;
  }

  export interface TaskResult {
    type: string;  // img, text
    url?: string;
    text?: string;
  }

  export interface TaskProcessingResult {
    success: boolean;
    message?: string;
    results?: TaskResult[];
  }


export class Agent {

  private taskWallet: Keypair;
  private openaiKey: string;
  private openai: any;
  private crossmintCollection: string;
  private storageAddress: PublicKey;

  static async run(): Promise<void> {
    const agent = new Agent();
    await agent.init();
    await agent.start();
  }

  constructor() {
    this.taskWallet = TASK_WALLET;
    this.openaiKey = openaiKey;
    this.openai = new OpenAI({apiKey: this.openaiKey});
    this.crossmintCollection = crossmintCollection;
    this.storageAddress = new PublicKey(process.env.STORAGE_ADDRESS);
  }

  private async init(){
    console.log(`agent task wallet: ${this.taskWallet.publicKey.toBase58()}`);
  }

  private async start(): Promise<void> {
    // await this.checkAndProcessTasks();
    // wake up every 30 seconds to check for new task request to process
    while(true) {
      await this.checkAndProcessTasks();
      await sleep(30000);
    }
  }

  private async checkAndProcessTasks() {
    const tasks = await this.getTasks();
    console.log(`found ${tasks.length} tasks`);
    // now process each task
    for (let i = 0; i < tasks.length; i++) {
      const taskRequest = tasks[i];
      const taskResult = await this.processTask(taskRequest);
      if (taskResult.success) {
        // send the results to geniejam
        await this.sendTaskResults(taskRequest, taskResult);
        // burn the request or send it out so we don't process it again
        await this.burnRequest(taskRequest);
      } else {
        // handle failure
      }
    }
  }

  private async burnRequest(taskRequest: TaskRequest) {
    // gettin issues w/trying to burn
    // const txid = await burnAsset(heliusConnection, this.taskWallet, taskRequest.requestAssetId);
    // Logger.log(`burned task request asset ${taskRequest.requestAssetId} with txid ${txid}`);

    // transfer it out
    const txid = await heliusConnection.transferCompressed(
          this.taskWallet,
          new PublicKey(taskRequest.requestAssetId),
          this.taskWallet.publicKey,
          this.storageAddress);
    Logger.log(`transferred task request asset ${taskRequest.requestAssetId} to storage with txid ${txid}`);

  }

  private async sendTaskResults(taskRequest: TaskRequest, taskResult: TaskProcessingResult): Promise<void> {
    console.log(`sending task results to: ${taskRequest.responseHandler}`);

    const responseData = {
      type: taskRequest.type,
      taskId: taskRequest.taskId,
      orderId: taskRequest.orderId,
      requestAssetId: taskRequest.requestAssetId,
      results: taskResult.results
    };

    const url = getCrossmintUrl(`/api/v1-alpha1/minting/collections/${this.crossmintCollection}/nfts`);
    const resp = await axios.post(url, {
      recipient: `solana:${taskRequest.responseHandler}`,
      metadata: {
        name: `Edgar Allen Poem #${taskRequest.orderId}-${taskRequest.taskId}`,
        symbol: 'gj-resp',
        image: 'https://space.stache.io/geniejam/agents/poem/edgar_allan_poe.png',
        description: 'GenieJam task response. Task type: poem_gen, Agent: Edgar Allen Poe (the AI version).',
        attributes: [
          {
            trait_type: 'gj-object',
            value: 'response'
          },
          {
            trait_type: 'response',
            value: JSON.stringify(responseData)
          }
        ],
      }
    }, crossmintRequestConfig);

    Logger.log('crossmint mintcNFT response: ', resp.data);
    const crossmintNftId = resp.data['id'];
    Logger.log(`minted cNFT response with crossmint id: ${crossmintNftId}`);
  }

  private async processTask(task: TaskRequest): Promise<TaskProcessingResult> {
    console.log(`processing task with request asset id: ${task.requestAssetId}`);
    const poemSubject = task.params['poem_subject'];
    console.log('generating a poem about: ', poemSubject);

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
          content: `i'd like you to write a poem about: ${poemSubject}. keep your response less than  words.`,
        },
      ],
    });
    console.log('gpt response: ');
    console.dir(gptResponse, {depth: null});

    const poem = gptResponse.choices[0].message.content;
    console.log(`generated poem: ${poem}`);

    return {
      success: true,
      results: [{
        type: 'text',
        text: poem
      }]
    };
  }

  // goes through all the cNFTs owned by the agent and finds the ones that are tasks
  private async getTasks(): Promise<TaskRequest[]> {
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

    const tasks: TaskRequest[] = [];

    for (let i = 0; i < compressedAssets.length; i++) {
      const asset = compressedAssets[i];
      if (asset.content.metadata?.symbol === 'gj-req') {
        // fetch the json to get the task info/params
        const response = await axios.get(asset.content.json_uri);
        console.log(`fetched json for asset ${asset.id}, at url: ${asset.content.json_uri}`);
        const data = await response.data;

        const requestAttribute = data.attributes.find(attribute => attribute.trait_type === 'request');
        if (requestAttribute) {
          const requestAttributeData = JSON.parse(requestAttribute.value);
          console.log('request data: ');
          console.dir(requestAttributeData, {depth: null});

          // pull out the task params
          tasks.push({
            orderId: requestAttributeData.orderId,
            taskId: requestAttributeData.taskId,
            requestAssetId: asset.id,
            type: requestAttributeData.type,
            responseHandler: requestAttributeData.responseHandler,
            params: requestAttributeData.params});
        }
      }
    }

    console.log(`found ${tasks.length} gj-request assets:`);
    console.dir(tasks, {depth: null});
    return tasks;
  }

}
