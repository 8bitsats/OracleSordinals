// src/StakingApp.tsx
import React, { useState, useEffect } from 'react';
import { stake, unstake, fetchStakedAssets, readAttributeData } from './stakingFunctions';

interface AssetData {
  address: string;
  attributes: any;
}

function StakingApp() {
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [stakedAssets, setStakedAssets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
    updateStakedAssets();
  }, []);

  async function fetchAssets() {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implement logic to fetch user's assets from the collection
      const mockAssets = ['Asset1', 'Asset2', 'Asset3'];
      const assetData = await Promise.all(mockAssets.map(async (asset) => {
        const attributes = await readAttributeData(asset);
        return { address: asset, attributes };
      }));
      setAssets(assetData);
    } catch (err) {
      setError('Failed to fetch assets');
      console.error(err);
    }
    setLoading(false);
  }

  async function updateStakedAssets() {
    setLoading(true);
    setError(null);
    try {
      const staked = await fetchStakedAssets();
      setStakedAssets(staked);
    } catch (err) {
      setError('Failed to fetch staked assets');
      console.error(err);
    }
    setLoading(false);
  }

  async function handleStake(assetAddress: string) {
    setLoading(true);
    setError(null);
    try {
      await stake(assetAddress);
      await updateStakedAssets();
      await fetchAssets();
    } catch (err) {
      setError('Failed to stake asset');
      console.error(err);
    }
    setLoading(false);
  }

  async function handleUnstake(assetAddress: string) {
    setLoading(true);
    setError(null);
    try {
      await unstake(assetAddress);
      await updateStakedAssets();
      await fetchAssets();
    } catch (err) {
      setError('Failed to unstake asset');
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div>
      <h1>Staking App</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Loading...</p>}
      <h2>Your Assets</h2>
      <ul>
        {assets.map(asset => (
          <li key={asset.address}>
            {asset.address}
            <button onClick={() => handleStake(asset.address)} disabled={loading}>Stake</button>
            <details>
              <summary>Attributes</summary>
              <pre>{JSON.stringify(asset.attributes, null, 2)}</pre>
            </details>
          </li>
        ))}
      </ul>
      <h2>Staked Assets</h2>
      <ul>
        {stakedAssets.map(assetAddress => (
          <li key={assetAddress}>
            {assetAddress}
            <button onClick={() => handleUnstake(assetAddress)} disabled={loading}>Unstake</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StakingApp;