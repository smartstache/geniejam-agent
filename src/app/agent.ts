import {heliusConnection, AUTHORITY} from '../config';
import {ReadApiAsset, ReadApiAssetList} from '@metaplex-foundation/js';
import {Keypair} from '@solana/web3.js';
import axios from 'axios';

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

  interface Task {
    assetId: string;
    params: any;
  }

export class Agent {

  private wallet: Keypair;

  static async run(): Promise<void> {
    const agent = new Agent();
    agent.init();
    agent.start();
  }

  constructor() {
    this.wallet = AUTHORITY;
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

    // setInterval(() => {
    //   const cnft = await this.getTasks();
    // }, 30000);
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

          tasks.push({assetId: asset.id, params: requestParams});
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
