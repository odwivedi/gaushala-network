import { ethers } from 'ethers';
import logger from '@/lib/logger';

const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || '';
const RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-bor-rpc.publicnode.com';
const NETWORK = process.env.POLYGON_NETWORK || 'mainnet';

export function getWallet() {
  if (!PRIVATE_KEY) throw new Error('BLOCKCHAIN_PRIVATE_KEY not configured');
  const provider = new ethers.JsonRpcProvider(RPC_URL, ethers.Network.from(137), { staticNetwork: ethers.Network.from(137) });
  return new ethers.Wallet(PRIVATE_KEY, provider);
}

export async function writeHashToChain(data: object): Promise<{ tx_hash: string; explorer_url: string }> {
  const wallet = getWallet();
  const dataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(data)));

  logger.info('BLOCKCHAIN', 'blockchain.ts', 'Writing hash to chain', { network: NETWORK, dataHash });

  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0n,
    data: ethers.hexlify(ethers.toUtf8Bytes(dataHash)),
  });

  await tx.wait();

  const explorer_url = NETWORK === 'mainnet'
    ? `https://polygonscan.com/tx/${tx.hash}`
    : `https://polygonscan.com/tx/${tx.hash}`;

  logger.info('BLOCKCHAIN', 'blockchain.ts', 'Hash written to chain', { tx_hash: tx.hash, explorer_url });

  return { tx_hash: tx.hash, explorer_url };
}

export async function getWalletBalance(): Promise<string> {
  const wallet = getWallet();
  const balance = await wallet.provider!.getBalance(wallet.address);
  return ethers.formatEther(balance);
}
