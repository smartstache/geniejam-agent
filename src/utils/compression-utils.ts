import {ReadApiAsset} from "@metaplex-foundation/js";

export function getCollectionId(asset: ReadApiAsset) {
  if (asset.grouping.length > 0) {
    for (let i = 0; i < asset.grouping.length; i++) {
      if (asset.grouping[i].group_key === 'collection') {
        return asset.grouping[i].group_value;
      }
    }
  }
  return null;
}
