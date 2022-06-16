import { Connection } from '@solana/web3.js';
import create from 'zustand';
import { Endpoint } from './fetchRPCConfig';

export const CONNECT_ERROR_VERSION_TOO_OLD = 'CONNECT_ERROR_VERSION_TOO_OLD';
export const CONNECT_ERROR_NETWORK_ERROR = 'CONNECT_ERROR_NETWORK_ERROR';

export interface ConnectionError {
  type: typeof CONNECT_ERROR_VERSION_TOO_OLD | typeof CONNECT_ERROR_NETWORK_ERROR;
  err?: Error | string;
  timestamp: number;
  details?: Record<string, any>;
}

type ConnectionStore = {
  connection: Connection | undefined;
  version?: string | number;

  availableEndPoints: Endpoint[];

  chainTimeOffset?: number;
  /**
   * for ui
   * maybe user customized
   * when isSwitchingRpcConnection it maybe not the currentConnection
   */
  currentEndPoint: Endpoint | undefined;

  /** recommanded */
  autoChoosedEndPoint: Endpoint | undefined;

  /** for ui loading */
  isLoading: boolean;
  switchConnectionFailed: boolean;

  userCostomizedUrlText: string;

  extractConnectionName: (url: string) => string;
  getChainDate: () => Date;
};
export const LOCALSTORAGE_KEY_USER_RPC = 'USER_RPC';
/** zustand store hooks */
const useConnection = create<ConnectionStore>((set, get) => ({
  connection: undefined,

  availableEndPoints: [],

  currentEndPoint: undefined,
  autoChoosedEndPoint: undefined,

  isLoading: false,
  switchConnectionFailed: false,

  userCostomizedUrlText: 'https://',

  extractConnectionName: (url: string) => {
    const matchedLocalhost = url.match(/(https:\/\/|http:\/\/)?localhost.*/);
    if (matchedLocalhost) return 'localhost';

    try {
      const urlObj = new globalThis.URL(url);
      return urlObj.hostname;
    } catch {
      return '--';
    }
  },

  getChainDate() {
    return new Date(Date.now() + (get().chainTimeOffset ?? 0));
  },
}));

export default useConnection;
