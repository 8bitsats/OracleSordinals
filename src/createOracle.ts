// src/createOracle.ts
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, keypairIdentity, generateSigner, publicKey } from '@metaplex-foundation/umi';
import { mplCoreOracleExample } from '@metaplex-foundation/mpl-core-oracle-example';
import wallet from "./wallet.json";

export async function createOracle() {
  const umi = createUmi('https://mainnet.helius-rpc.com/?api-key=6b52d42b-5d24-4841-a093-02b0d2cc9fc0');
  
  // Convert wallet to Uint8Array
  const secretKey = new Uint8Array(Object.values(wallet));
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(keypairIdentity(signer));
  umi.use(mplCoreOracleExample());

  const oracleSigner = generateSigner(umi);
  
  try {
    const createOracleOperation = await mplCoreOracleExample().createOracle(umi, {
      oracle: oracleSigner,
      authority: signer.publicKey,
    });

    const signature = await createOracleOperation.sendAndConfirm(umi);

    console.log(`Oracle created with address: ${oracleSigner.publicKey}`);
    console.log(`Transaction signature: ${signature}`);
    return oracleSigner.publicKey;
  } catch (error) {
    console.error('Error creating oracle:', error);
    throw error;
  }
}

// Only run this if it's the main module
if (require.main === module) {
  createOracle().catch(console.error);
}