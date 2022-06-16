import { useEffect } from 'react';

import { Connection } from '@solana/web3.js';
import jFetch from '../../functions/dom/jFetch';
import { unifyByKey } from '../../functions/arrayMethods';
import caculateEndpointUrlByRpcConfig from './caculateEndpointUrlByRpcConfig';

import useConnection from './useConnection';

export interface Endpoint {
  name?: string;
  url: string;
  weight?: number;
  isUserCustomized?: true;
}

export interface Config {
  strategy: 'speed' | 'weight';
  success: boolean;
  rpcs: Endpoint[];
}

const devRpcConfig: Omit<Config, 'success'> = {
  rpcs: [
    // { name: 'genesysgo', url: 'https://raydium.genesysgo.net', weight: 0 }
    // { name: 'rpcpool', url: 'https://raydium.rpcpool.com', weight: 100 }
    // { url: 'https://arbirgis.rpcpool.com/', weight: 100 },
    // { url: 'https://solana-api.projectserum.com', weight: 100 }
    { name: 'beta-mainnet', url: 'https://api.mainnet-beta.solana.com/' },
    // { name: 'api.mainnet', url: 'https://api.mainnet.rpcpool.com/' },
    { name: 'tt', url: 'https://solana-api.tt-prod.net' },
    { name: 'apricot', url: 'https://apricot-main-67cd.mainnet.rpcpool.com/' },
  ],
  strategy: 'speed',
};

/**
 * **only in `_app.tsx`**
 *
 * will base on rpcpools(in dev mode) to establish connection
 */
export default function useConnectionInitialization() {
  useEffect(() => {
    // useConnection.setState({ isLoading: true });
    // const selectedEndpointUrl = 'https://raydium.rpcpool.com';
    // const connection = new Connection(selectedEndpointUrl, 'confirmed');

    // const tmpEndpoint: Endpoint = {
    //   name: 'Triton',
    //   url: 'https://raydium.rpcpool.com',
    //   weight: 100,
    //   isUserCustomized: true,
    // };

    // useConnection.setState({
    //   availableEndPoints: [tmpEndpoint],
    //   autoChoosedEndPoint: tmpEndpoint,
    //   currentEndPoint: tmpEndpoint,
    //   connection,
    //   isLoading: false,
    // });
    useConnection.setState({ isLoading: true });
    jFetch<Config>('https://api.raydium.io/v2/main/rpcs')
      .then(async (data) => {
        if (!data) return;

        // dev test
        if (!globalThis.location.host.includes('raydium.io')) {
          Reflect.set(data, 'rpcs', devRpcConfig.rpcs);
          Reflect.set(data, 'strategy', devRpcConfig.strategy);
        }

        const selectedEndpointUrl = await caculateEndpointUrlByRpcConfig(data);
        const connection = new Connection(selectedEndpointUrl, 'confirmed');
        console.log(`selectedEndpointUrl rpc: `, selectedEndpointUrl);
        console.log(`currentEndPoint rpc: `, selectedEndpointUrl);
        useConnection.setState((s) => ({
          availableEndPoints: unifyByKey([...data.rpcs, ...(s.availableEndPoints ?? [])], (i) => i.url),
          autoChoosedEndPoint: data.rpcs.find(({ url }) => url === selectedEndpointUrl),
          currentEndPoint: s.currentEndPoint ?? data.rpcs.find(({ url }) => url === selectedEndpointUrl),
          connection,
          isLoading: false,
        }));
      })
      .catch(console.error);
  }, []);
}
