import React, { useState, useEffect } from 'react';
import { stake, unstake, fetchStakedAssets } from './stakingFunctions';

function StakingApp() {
  const [assets, setAssets] = useState<string[]>([]);
  const [stakedAssets, setStakedAssets] = useState<string[]>([]);

  useEffect(() => {
    fetchAssets();
    updateStakedAssets();
  }, []);

  async function fetchAssets() {
    // TODO: Implement logic to fetch user's assets
    setAssets(['Asset1', 'Asset2', 'Asset3']);
  }

  async function updateStakedAssets() {
    const staked = await fetchStakedAssets();
    setStakedAssets(staked);
  }

  async function handleStake(assetAddress: string) {
    await stake(assetAddress);
    updateStakedAssets();
  }

  async function handleUnstake(assetAddress: string) {
    await unstake(assetAddress);
    updateStakedAssets();
  }

  return (
    <div>
      <h1>Staking App</h1>
      <h2>Your Assets</h2>
      <ul>
        {assets.map(asset => (
          <li key={asset}>
            {asset}
            <button onClick={() => handleStake(asset)}>Stake</button>
          </li>
        ))}
      </ul>
      <h2>Staked Assets</h2>
      <ul>
        {stakedAssets.map(assetAddress => (
          <li key={assetAddress}>
            {assetAddress}
            <button onClick={() => handleUnstake(assetAddress)}>Unstake</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StakingApp;