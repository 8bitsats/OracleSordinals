import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, keypairIdentity, generateSigner } from '@metaplex-foundation/umi';
import { mplCoreOracleExample } from '@metaplex-foundation/mpl-core-oracle-example';

export async function createOracle() {
  // Initialize UMI
  const umi = createUmi('https://mainnet.helius-rpc.com/?api-key=6b52d42b-5d24-4841-a093-02b0d2cc9fc0');
  
  // Load your keypair (replace with your actual keypair)
  const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array([/* Your secret key here */]));
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(keypairIdentity(signer));
  umi.use(mplCoreOracleExample());

  // Create the oracle
  const oracleSigner = generateSigner(umi);
  await mplCoreOracleExample.createOracle(umi, {
    oracle: oracleSigner,
    authority: signer.publicKey,
  }).sendAndConfirm(umi);

  console.log(`Oracle created with address: ${oracleSigner.publicKey}`);
  return oracleSigner.publicKey;
}

createOracle().catch(console.error);