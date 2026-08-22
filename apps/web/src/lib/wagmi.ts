import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, unichain } from 'wagmi/chains';

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  '00000000000000000000000000000000';

export const wagmiConfig = getDefaultConfig({
  appName: 'HookGuard',
  projectId,
  chains: [mainnet, unichain],
  transports: {
    [mainnet.id]: http(),
    [unichain.id]: http(),
  },
  ssr: true,
});
