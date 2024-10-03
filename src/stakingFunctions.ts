// src/stakingFunctions.ts
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, keypairIdentity, publicKey, transactionBuilder, Transaction } from '@metaplex-foundation/umi';
import { mplCoreOracleExample, fetchOracle } from '@metaplex-foundation/mpl-core-oracle-example';
import { addPlugin, updatePlugin, fetchAsset, removePlugin } from '@metaplex-foundation/mpl-core';
import { base58 } from '@metaplex-foundation/umi/serializers';
import wallet from "./wallet.json";

const umi = createUmi('https://api.devnet.solana.com');
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(keypairIdentity(signer));
umi.use(mplCoreOracleExample());

// Replace with your actual oracle address after running createOracle.ts
const oracleAddress = publicKey('Your Oracle Public Key Here');
const collectionAddress = publicKey('BTU76cKA151rYk9D8aJC74qxjq4x4nVUcsg12mC8foTN');

export async function stake(assetAddress: string) {
  const asset = publicKey(assetAddress);
  const fetchedAsset = await fetchAsset(umi, asset);
  const currentTime = new Date().getTime().toString();

  let tx: Transaction;

  if (!fetchedAsset.attributes) {
    tx = await transactionBuilder()
      .add(addPlugin(umi, {
        asset,
        collection: collectionAddress,
        plugin: {
          type: "Attributes",
          attributeList: [
            { key: "staked", value: currentTime },
            { key: "stakedTime", value: "0" },
          ],
        },
      }))
      .add(addPlugin(umi, {
        asset,
        collection: collectionAddress,
        plugin: {
          type: "FreezeDelegate",
          frozen: true,
          authority: { type: "UpdateAuthority" }
        }
      }))
      .buildAndSign(umi);
  } else {
    const assetAttribute = fetchedAsset.attributes.attributeList;
    const isInitialized = assetAttribute.some(
      (attribute) => attribute.key === "staked" || attribute.key === "stakedTime"
    );

    if (isInitialized) {
      const stakedAttribute = assetAttribute.find(
        (attr) => attr.key === "staked"
      );

      if (stakedAttribute && stakedAttribute.value !== "0") {
        throw new Error("Asset is already staked");
      } else {
        assetAttribute.forEach((attr) => {
          if (attr.key === "staked") {
            attr.value = currentTime;
          }
        });
      }
    } else {
      assetAttribute.push({ key: "staked", value: currentTime });
      assetAttribute.push({ key: "stakedTime", value: "0" });
    }

    tx = await transactionBuilder()
      .add(updatePlugin(umi, {
        asset,
        collection: collectionAddress,
        plugin: {
          type: "Attributes",
          attributeList: assetAttribute,
        },
      }))
      .add(addPlugin(umi, {
        asset,
        collection: collectionAddress,
        plugin: {
          type: "FreezeDelegate",
          frozen: true,
          authority: { type: "UpdateAuthority" }
        }
      }))
      .buildAndSign(umi);
  }

  const txId = await umi.rpc.sendTransaction(tx);
  console.log(`Asset Staked: https://solana.fm/tx/${base58.deserialize(txId)[0]}?cluster=devnet-alpha`);
}

export async function unstake(assetAddress: string) {
  const asset = publicKey(assetAddress);
  const fetchedAsset = await fetchAsset(umi, asset);

  if (!fetchedAsset.attributes) {
    throw new Error("Asset has no Attribute Plugin attached to it. Please go through the stake instruction before.");
  }

  const assetAttribute = fetchedAsset.attributes.attributeList;
  const stakedTimeAttribute = assetAttribute.find((attr) => attr.key === "stakedTime");
  const stakedAttribute = assetAttribute.find((attr) => attr.key === "staked");

  if (!stakedTimeAttribute || !stakedAttribute) {
    throw new Error("Asset is missing required staking attributes. Please go through the stake instruction before.");
  }

  if (stakedAttribute.value === "0") {
    throw new Error("Asset is not staked");
  }

  const stakedTimeValue = parseInt(stakedTimeAttribute.value);
  const stakedValue = parseInt(stakedAttribute.value);
  const elapsedTime = new Date().getTime() - stakedValue;

  assetAttribute.forEach((attr) => {
    if (attr.key === "stakedTime") {
      attr.value = (stakedTimeValue + elapsedTime).toString();
    }
    if (attr.key === "staked") {
      attr.value = "0";
    }
  });

  const tx = await transactionBuilder()
    .add(updatePlugin(umi, {
      asset,
      collection: collectionAddress,
      plugin: {
        type: "Attributes",
        attributeList: assetAttribute,
      },
    }))
    .add(updatePlugin(umi, {
      asset,
      collection: collectionAddress,
      plugin: {
        type: "FreezeDelegate",
        frozen: false,
      },
    }))
    .add(removePlugin(umi, {
      asset,
      collection: collectionAddress,
      plugin: {
        type: "FreezeDelegate",
      },
    }))
    .buildAndSign(umi);

  const txId = await umi.rpc.sendTransaction(tx);
  console.log(`Asset Unstaked: https://solana.fm/tx/${base58.deserialize(txId)[0]}?cluster=devnet-alpha`);
}

export async function fetchStakedAssets() {
  const oracle = await fetchOracle(umi, oracleAddress);
  return oracle.stakedAssets;
}

export async function readAttributeData(assetAddress: string) {
  const asset = publicKey(assetAddress);
  const fetchedAsset = await fetchAsset(umi, asset);
  return fetchedAsset.attributes;
}