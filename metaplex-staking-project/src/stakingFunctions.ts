import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, keypairIdentity, publicKey } from '@metaplex-foundation/umi';
import { mplCoreOracleExample, fetchOracle } from '@metaplex-foundation/mpl-core-oracle-example';
import { create, fetchAsset } from '@metaplex-foundation/mpl-core';

const umi = createUmi('https://api.devnet.solana.com');
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array([/* Your secret key here */]));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(keypairIdentity(signer));
umi.use(mplCoreOracleExample());

const oracleAddress = publicKey('Your Oracle Public Key Here');

export async function stake(assetAddress: string) {
  const asset = await fetchAsset(umi, publicKey(assetAddress));
  const oracle = await fetchOracle(umi, oracleAddress);

  if (oracle.isStakingAllowed) {
    await create(umi, {
      name: 'Staked Asset',
      uri: asset.uri,
      collection: asset.collection,
      creators: asset.creators,
    }).sendAndConfirm(umi);
    
    await mplCoreOracleExample.updateOracle(umi, {
      oracle: oracleAddress,
      authority: signer.publicKey,
      isStakingAllowed: true,
      stakedAssets: [...oracle.stakedAssets, assetAddress],
    }).sendAndConfirm(umi);
  }
}

export async function unstake(assetAddress: string) {
  const oracle = await fetchOracle(umi, oracleAddress);
  
  if (oracle.stakedAssets.includes(assetAddress)) {
    await mplCoreOracleExample.updateOracle(umi, {
      oracle: oracleAddress,
      authority: signer.publicKey,
      isStakingAllowed: true,
      stakedAssets: oracle.stakedAssets.filter(a => a !== assetAddress),
    }).sendAndConfirm(umi);
  }
}

export async function fetchStakedAssets() {
  const oracle = await fetchOracle(umi, oracleAddress);
  return oracle.stakedAssets;
}