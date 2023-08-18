import { Logger } from './common/logger';
import {heliusConnection, getCrossmintUrl, requestConfig, AUTHORITY} from "../config";
import axios from 'axios';
import {ReadApiAsset, ReadApiAssetList} from "@metaplex-foundation/js";
import {getCollectionId} from "../utils/compression-utils";

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class App {
  static async run(): Promise<App> {
    const app = new App();
    app.start();
    if (false) {
      app.createCollection().then(() => {});
      app.mintcNFT();
      app.getMintStatus();
      app.getCompressedNfts();
    }
    // const id = await app.mintcNFT();
    // await sleep(4000);
    // app.getMintStatus(id);
    await app.getCompressedNfts();
    return app;
  }

  private start(): void {
  }

  private async getCompressedNfts(): Promise<void> {
    const assetList: ReadApiAssetList = await heliusConnection.getAssetsByOwner({ownerAddress: AUTHORITY.publicKey.toBase58()});

    const collectionIds = new Map<string, Promise<ReadApiAsset>>();
    const compressedAssets: ReadApiAsset[] = [];
    for (let i = 0; i < assetList.items.length; i++) {
      const asset = assetList.items[i];
      if (asset.compression.compressed) {
        const collectionId = getCollectionId(asset);
        if (collectionId && !collectionIds.has(collectionId)) {
          collectionIds.set(collectionId, heliusConnection.getAsset(collectionId));
        }
        compressedAssets.push(asset);
      }
    }

    console.log(`found ${compressedAssets.length} compressed assets`);
    console.log(`found ${collectionIds.size} collections`);
    // console.log(`assets: `, compressedAssets.map(a => {return {id: a.id, content: a.content, metadata: a.content.metadata, attributes: a.content.metadata?.attributes}}));
    console.dir(compressedAssets, {depth: null});
    console.log(`collections: `, collectionIds.keys());
  }

  private async createCollection(): Promise<void> {
    const url = getCrossmintUrl('/api/2022-06-09/collections/')
    console.log('url: ', url);
    const resp = await axios.post(url, {
        chain: 'solana',
        metadata: {
          name: 'A new collection',
          imageUrl: 'https://www.crossmint.com/assets/crossmint/logo.png',
          description: 'A new collection with its own dedicated smart contract'
        }
      }, requestConfig);
    Logger.log('createCollection response: ', resp.data);
  }

  private async mintcNFT(): Promise<string> {
    const url = getCrossmintUrl('/api/v1-alpha1/minting/collections/7072fc5a-58ea-4aa8-8b9b-ca5733c0f7a5/nfts');
    const resp = await axios.post(url, {
      recipient: 'solana:r3cXGs7ku4Few6J1rmNwwUNQbvrSPoLAAU9C2TVKfow',
      metadata: {
        name: 'Boom GenieJam Test',
        image: 'https://space.stache.io/geniejam/geniejam_logo.png',
        description: 'GenieJam Test NFT',
        attributes: [
          {
            trait_type: 'some long url for some bs',
            value: 'nope: https://nftstorage.link/ipfs/bafkreib76mdlqt6wt6sdip4gspran4voc5x77bbcsi4elgj4n76jaljegq/aksjdfl/skdjflskfjlslskfd/aasdfasafadfasdfasdfasdfj'
          },
          {
            trait_type: 'some long string',
            value: '{\n' +
                '  "name": "GenieJam Test",\n' +
                '  "symbol": "",\n' +
                '  "seller_fee_basis_points": 0,\n' +
                '  "description": "GenieJam Test NFT",\n' +
                '  "image": "https://nftstorage.link/ipfs/bafkreib76mdlqt6wt6sdip4gspran4voc5x77bbcsi4elgj4n76jaljegq",\n' +
                '  "attributes": [\n' +
                '    {\n' +
                '      "trait_type": "Creator",\n' +
                '      "value": "GenieJam"\n' +
                '    }\n' +
                '  ],\n' +
                '  "properties": {\n' +
                '    "files": [\n' +
                '      {\n' +
                '        "uri": "https://nftstorage.link/ipfs/bafkreib76mdlqt6wt6sdip4gspran4voc5x77bbcsi4elgj4n76jaljegq",\n' +
                '        "type": "image/png"\n' +
                '      }\n' +
                '    ],\n' +
                '    "category": "image",\n' +
                '    "creators": [\n' +
                '      {\n' +
                '        "address": "XtMi3DmYhD9uoKsUSnubvRu7WPsLk8GgoP5Z68Fyokk",\n' +
                '        "verified": false,\n' +
                '        "share": 100\n' +
                '      }\n' +
                '    ]\n' +
                '  }\n' +
                '}'
          }
        ],
      }
    }, requestConfig);
    Logger.log('mintcNFT response: ', resp.data);
    return resp.data['id'];
  };

  private async getMintStatus(id: string = 'a4c2fde4-048b-42a5-b484-3de3d8a6f717'): Promise<void> {
    const url = getCrossmintUrl(`/api/2022-06-09/collections/7072fc5a-58ea-4aa8-8b9b-ca5733c0f7a5/nfts/${id}`);
    const resp = await axios.get(url, requestConfig);
    Logger.log('getMintStatus response: ', resp.data);
  }

}
