import { Logger } from './common/logger';
import {heliusConnection, getCrossmintUrl, crossmintRequestConfig, TASK_WALLET} from "../config";
import axios from 'axios';
import {PublicKey, ReadApiAsset, ReadApiAssetList} from "@metaplex-foundation/js";
import {burnAsset} from "../utils/compression-utils";

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class CrossmintPlay {
  static async run(): Promise<CrossmintPlay> {
    const app = new CrossmintPlay();
    app.start();
    if (false) {
      app.createCollection().then(() => {});
      app.mintcNFT();
      app.getMintStatus('a4c2fde4-048b-42a5-b484-3de3d8a6f717');
      app.getCompressedNfts();
      app.transferAll('');
    }
    // const id = await app.mintcNFT();
    // app.getMintStatus(id);
    await app.getCompressedNfts();
    return app;
  }

  private start(): void {
  }

  // clear out a wallet
  private async transferAll(to: string): Promise<void> {
    const toAddress = new PublicKey(to);
    const assets: ReadApiAsset[] = await this.getCompressedNfts();
    console.log(`transferring ${assets.length} assets...`);
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      await heliusConnection.transferCompressed(TASK_WALLET, new PublicKey(asset.id), TASK_WALLET.publicKey, toAddress);
      console.log(`transfered ${asset.id} to ${to}`);
    }
  }

  private async getCompressedNfts(): Promise<ReadApiAsset[]> {
    const assetList: ReadApiAssetList = await heliusConnection.getAssetsByOwner({ownerAddress: TASK_WALLET.publicKey.toBase58()});

    const compressedAssets: ReadApiAsset[] = [];
    for (let i = 0; i < assetList.items.length; i++) {
      const asset = assetList.items[i];
      if (asset.compression.compressed) {
        compressedAssets.push(asset);
      }
    }

    console.log(`found ${compressedAssets.length} compressed assets`);
    // console.log(`assets: `, compressedAssets.map(a => {return {id: a.id, content: a.content, metadata: a.content.metadata, attributes: a.content.metadata?.attributes}}));
    console.dir(compressedAssets, {depth: null});
    return compressedAssets;
  }

  private async createCollection(): Promise<void> {
    const url = getCrossmintUrl('/api/2022-06-09/collections/')
    console.log('url: ', url);
    const resp = await axios.post(url, {
        chain: 'solana',
        metadata: {
          name: 'The Poe Collection',
          imageUrl: 'https://space.stache.io/geniejam/agents/poem/edgar_allan_poe.png',
          description: 'GenieJam task processing responses: Poems by Edgar Allan Poe (the AI version)',
        }
      }, crossmintRequestConfig);
    Logger.log('createCollection response: ', resp.data);
  }

  private async mintcNFT(): Promise<string> {
    const url = getCrossmintUrl(`/api/v1-alpha1/minting/collections/${process.env.CROSSMINT_COLLECTION}/nfts`);
    const resp = await axios.post(url, {
      recipient: 'solana:PoEmZixNAvHBXFZ5vNhjeYgoifgyh6kZYYdM4G8rpSb',
      metadata: {
        name: 'Test mint',
        symbol: 'gj-req',
        image: 'https://space.stache.io/geniejam/agents/poem/edgar_allan_poe.png',
        description: 'GenieJam Test NFT',
        attributes: [
          {
            trait_type: 'gj-object',
            value: 'request'
          },
          {
            trait_type: 'request',
            value: JSON.stringify({
              orderId: 1,
              taskId: 2,
              type: 'poem_gen',
              responseHandler: 'reSPhNgfT7kgwCkTqpbimbqwbb4GAMpxXd4Ne6GJkoK',
              params: {
                 poem_subject: 'the deliciousness of tacos'
              }
            })
          }
        ],
      }
    }, crossmintRequestConfig);
    Logger.log('mintcNFT response: ', resp.data);
    return resp.data['id'];
  };

  private async getMintStatus(id: string): Promise<void> {
    const url = getCrossmintUrl(`/api/2022-06-09/collections/${process.env.CROSSMINT_COLLECTION}/nfts/${id}`);
    const resp = await axios.get(url, crossmintRequestConfig);
    Logger.log('getMintStatus response: ', resp.data);
  }

}
