import { useMemo } from 'react';
import Home from './pages/Home';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import useConnectionInitialization from './application/connection/useConnectionInitialization';
import useTokenAccountsRefresher from './application/wallet/feature/useTokenAccountsRefresher';
import { useWalletAccountChangeListeners } from './application/wallet/feature/useWalletAccountChangeListeners';
import useTokenListsLoader from './application/token/feature/useTokenListsLoader';
import { useSwapAmountCalculator } from './application/swap/useSwapAmountCalculator';
import useLiquidityInfoLoader from './application/liquidity/feature/useLiquidityInfoLoader';
import { useSyncWithSolanaWallet } from './application/wallet/feature/useSyncWithSolanaWallet';
import useInitBalanceRefresher from './application/wallet/feature/useBalanceRefresher';

require('@solana/wallet-adapter-react-ui/styles.css');

const AppInit = () => {
  useConnectionInitialization();
  useTokenAccountsRefresher();
  useWalletAccountChangeListeners();
  useTokenListsLoader();
  useSwapAmountCalculator();
  useLiquidityInfoLoader();
  useSyncWithSolanaWallet();
  useInitBalanceRefresher();
  return null;
};

const App = () => {
  const network = WalletAdapterNetwork.Mainnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppInit />
          <Home />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
