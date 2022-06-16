import {
  Connection,
  Context,
  Keypair,
  PublicKey,
  SignatureResult,
  Transaction,
  TransactionError,
} from '@solana/web3.js';

import useConnection from '../connection/useConnection';
import useWallet, { WalletStore } from '../wallet/useWallet';
import { TxHistoryInfo } from '../txHistory/useTxHistory';
import subscribeTx from './subscribeTx';
import { mergeFunction } from '../../functions/merge';
import { getRecentBlockhash } from './attachRecentBlockhash';
import { getRichWalletTokenAccounts } from '../wallet/feature/useTokenAccountsRefresher';
import { useNotifyMsg } from '../err/useNotifyMsg';

//#region ------------------- basic info -------------------
export type TxInfo = {
  txid: string;
};

export type MultiTxExtraInfo = {
  multiTransaction: true; // in multi transactions
  currentIndex: number; // in multi transactions
  multiTransactionLength: number; // in transactions
};
//#endregion

//#region ------------------- lifeTime info -------------------
export type TxSuccessInfo = {
  txid: string;
  signatureResult: SignatureResult;
  context: Context;
} & (TxInfo | (TxInfo & MultiTxExtraInfo));
export type TxSentSuccessInfo = TxInfo | (TxInfo & MultiTxExtraInfo);
export type TxFinalBatchSuccessInfo = {
  allSuccess: true;
  txids: string[];
};

export type TxErrorInfo = {
  txid: string;
  signatureResult: SignatureResult;
  context: Context;
  error?: TransactionError;
};
export type TxSentErrorInfo = {
  err: unknown;
};

export type TxFinalInfo =
  | ({
      type: 'success';
    } & TxSuccessInfo)
  | ({
      type: 'error';
    } & TxErrorInfo);
export type TxFinalBatchErrorInfo = {
  allSuccess: false;
  errorAt: number;
  txids: string[]; // before absort
};

//#endregion

export type MultiTxAction = (providedTools: {
  transactionCollector: TransactionCollector;
  baseUtils: {
    connection: Connection;
    owner: PublicKey;
    tokenAccounts: WalletStore['tokenAccounts'];
    allTokenAccounts: WalletStore['allTokenAccounts'];
  };
}) => void;
//#region ------------------- callbacks -------------------
type TxSuccessCallback = (info: TxSuccessInfo & MultiTxExtraInfo) => void;
type TxErrorCallback = (info: TxErrorInfo & MultiTxExtraInfo) => void;
type TxFinallyCallback = (info: TxFinalInfo & MultiTxExtraInfo) => void;
type TxSentSuccessCallback = (info: TxSentSuccessInfo & MultiTxExtraInfo) => void;
type TxSentErrorCallback = (info: TxSentErrorInfo & MultiTxExtraInfo) => void;
type TxSentFinallyCallback = () => // info: (
//   | ({
//       type: 'success'
//     } & TxSentSuccessInfo)
//   | ({
//       type: 'error'
//     } & TxSentErrorInfo)
// ) &
//   MultiTxExtraInfo
void;

type AllSuccessCallback = (info: { txids: string[] }) => void;
type AnyErrorCallback = (info: { txids: string[] /* error at last txids */ }) => void;
type TxKeypairDetective = {
  ownerKeypair: Keypair;
  payerKeypair?: Keypair;
};

//#endregion

type TxOptionsCollection = {
  txHistoryInfo: (Pick<TxHistoryInfo, 'title' | 'description'> | undefined)[];
  txSuccess: (TxSuccessCallback | undefined)[];
  txError: (TxErrorCallback | undefined)[];
  txFinally: (TxFinallyCallback | undefined)[];
  txSentSuccess: (TxSentSuccessCallback | undefined)[];
  txSentError: (TxSentErrorCallback | undefined)[];
  txSentFinally: (TxSentFinallyCallback | undefined)[];
  txAllSuccess: (AllSuccessCallback | undefined)[];
  txAnyError: (AnyErrorCallback | undefined)[];
};

export interface TxAddOptions {
  txHistoryInfo?: Pick<TxHistoryInfo, 'title' | 'description'>;
  onTxSuccess?: TxSuccessCallback;
  onTxError?: TxErrorCallback;
  onTxFinally?: TxFinallyCallback;
  onTxSentSuccess?: TxSentSuccessCallback;
  onTxSentError?: TxSentErrorCallback;
  onTxSentFinally?: TxSentFinallyCallback;
}

export type TransactionCollector = {
  /**@deprecated for can't control */
  addSets(...transactions: Transaction[]): void;

  add(transactions: Transaction, options?: TxAddOptions): void;
};

type FinalInfos = {
  allSuccess: boolean;
  txids: string[];
  // errorAt?: number // only if `allSuccess` is false
  // txList: (TxSuccessInfo | TxErrorInfo)[]
};

export type TxShadowOptions = {
  /** if add this, handleTx's shadow mode will open,  */
  forceKeyPairs?: TxKeypairDetective;
};

/**
 * duty:
 * 1. provide tools for a tx action
 * 2. auto handle txError and txSuccess
 */
export default async function handleMultiTx(
  txAction: MultiTxAction,
  options?: TxShadowOptions
): Promise<FinalInfos> {
  return new Promise((resolve, reject) =>
    (async () => {
      const callbackCollection: TxOptionsCollection = {
        txHistoryInfo: [],
        txSuccess: [],
        txError: [],
        txFinally: [],
        txSentSuccess: [],
        txSentError: [],
        txSentFinally: [],
        txAllSuccess: [],
        txAnyError: [],
      };

      const innerTransactions = [] as Transaction[];
      const transactionCollector: TransactionCollector = {
        addSets(...transactions) {
          innerTransactions.push(...transactions);
        },
        add(transaction, options) {
          innerTransactions.push(transaction);
          callbackCollection.txHistoryInfo.push(options?.txHistoryInfo);
          callbackCollection.txSuccess.push(options?.onTxSuccess);
          callbackCollection.txError.push(options?.onTxError);
          callbackCollection.txFinally.push(options?.onTxFinally);
          callbackCollection.txSentSuccess.push(options?.onTxSentSuccess);
          callbackCollection.txSentError.push(options?.onTxSentError);
          callbackCollection.txSentFinally.push(options?.onTxSentFinally);
        },
      };

      try {
        const { signAllTransactions, owner } = useWallet.getState();
        const connection = useConnection.getState().connection;
        if (!connection) {
          useNotifyMsg.setState({ msg: 'no rpc connection' });
          console.warn('no rpc connection');
          return;
        }

        if (options?.forceKeyPairs?.ownerKeypair) {
          // have force key pair info, no need to check wallet connect
          const shadowWalletOwner = options.forceKeyPairs.ownerKeypair.publicKey;
          const tokenAccountInfos = await getRichWalletTokenAccounts({
            owner: shadowWalletOwner,
            connection,
          });
          await txAction({
            transactionCollector,
            baseUtils: { connection, owner: shadowWalletOwner, ...tokenAccountInfos },
          });
        } else {
          const { tokenAccounts, allTokenAccounts } = useWallet.getState();
          if (!owner) {
            useNotifyMsg.setState({ msg: 'wallet not connected' });
            console.warn('wallet not connected');
            return;
          }
          await txAction({
            transactionCollector,
            baseUtils: { connection, owner, tokenAccounts, allTokenAccounts },
          });
        }
        console.log('before sendMultiTransactionAndLogAndRecord');
        const finalInfos = await sendMultiTransactionAndLogAndRecord({
          transactions: innerTransactions,
          txHistoryInfo: callbackCollection.txHistoryInfo,
          optionsCollection: {
            ...callbackCollection,
            txSentFinally: [
              mergeFunction(() => {}, callbackCollection.txSentFinally[0]),
              ...callbackCollection.txSentFinally.slice(1),
            ],
          },
          payload: {
            connection,
            signAllTransactions,
            signerkeyPair: options?.forceKeyPairs,
          },
        });
        console.log('before sendMultiTransactionAndLogAndRecord - resolve');
        resolve(finalInfos);
        console.log('after sendMultiTransactionAndLogAndRecord - resolve');
      } catch (error) {
        // const { logError } = useNotification.getState();
        // console.warn(error);
        // const errorTitle = (callbackCollection.txHistoryInfo?.[0]?.title ?? '') + ' Error';
        // const errorDescription = error instanceof Error ? noTailingPeriod(error.message) : String(error);
        // logError(errorTitle, errorDescription);
        // resolve({
        //   allSuccess: false,
        //   txids: [],
        // });
        console.warn(error);
        let preErrMsg = useNotifyMsg((s) => s.msg);
        if (!preErrMsg) {
          useNotifyMsg.setState({ msg: 'handleMultiTx error' });
        }
      } finally {
        // nothing
      }
    })()
  );
}

/**
 * duty:
 * 1. provide txid and txCallback collectors for a tx action
 * 2. record tx to recentTxHistory
 */
async function sendMultiTransactionAndLogAndRecord(options: {
  transactions: Transaction[];
  txHistoryInfo?: (Pick<TxHistoryInfo, 'title' | 'description'> | undefined)[];
  optionsCollection: TxOptionsCollection;
  payload: {
    signAllTransactions: WalletStore['signAllTransactions'];
    connection: Connection;
    // only if have been shadow open
    signerkeyPair?: TxKeypairDetective;
  };
}): Promise<FinalInfos> {
  return new Promise((resolve, reject) =>
    (async () => {
      try {
        const txCallbackCollection = options.optionsCollection;
        // const allSignedTransactions = await options.payload.signAllTransactions(options.transactions)
        console.log('before signAllTransactions');
        const allSignedTransactions = await (options.payload.signerkeyPair?.ownerKeypair // if have signer detected, no need signAllTransactions
          ? options.transactions
          : options.payload.signAllTransactions(options.transactions));
        console.log('after signAllTransactions');
        const txids = [] as string[];

        // eslint-disable-next-line no-inner-declarations
        async function sendOneTransaction({
          currentIndex = 0,
          onSuccess = () => {},
        }: {
          currentIndex: number;
          onSuccess: () => void;
        }) {
          const extraTxidInfo: MultiTxExtraInfo = {
            multiTransaction: true,
            multiTransactionLength: allSignedTransactions.length,
            currentIndex: currentIndex,
          } as const;
          const transaction = allSignedTransactions[currentIndex];
          try {
            const txid = await (async () => {
              if (options.payload.signerkeyPair?.ownerKeypair) {
                // if have signer detected, no need signAllTransactions
                transaction.recentBlockhash = await getRecentBlockhash(options.payload.connection);
                transaction.feePayer =
                  options.payload.signerkeyPair.payerKeypair?.publicKey ??
                  options.payload.signerkeyPair.ownerKeypair.publicKey;

                return options.payload.connection.sendTransaction(transaction, [
                  options.payload.signerkeyPair.payerKeypair ?? options.payload.signerkeyPair.ownerKeypair,
                ]);
              } else {
                return await options.payload.connection.sendRawTransaction(transaction.serialize(), {
                  skipPreflight: true,
                });
              }
            })();
            txCallbackCollection.txSentSuccess[currentIndex]?.({
              ...extraTxidInfo,
              txid,
            });
            console.log(`txId: ${txid} has been sent`);
            useNotifyMsg.setState({ msg: `txId: ${txid} has been sent`, type: 'info' });

            if (!txid) {
              useNotifyMsg.setState({ msg: 'something went wrong' });
              return;
            }

            txids.push(txid);

            subscribeTx(txid, {
              onTxSuccess(callbackParams) {
                // logTxid(txid, `${options.txHistoryInfo?.[currentIndex]?.title ?? 'Action'} Confirmed`, {
                //   isSuccess: true,
                // });
                txCallbackCollection.txSuccess[currentIndex]?.({
                  ...callbackParams,
                  ...extraTxidInfo,
                });
                onSuccess?.();
                useNotifyMsg.setState({ msg: `txId: ${txid}, is confirmed`, type: 'success' });
              },
              onTxError(callbackParams) {
                console.error(callbackParams.error);
                resolve({ allSuccess: false, txids });
                // logError(
                //   `${options.txHistoryInfo?.[currentIndex]?.title ?? 'Action'} Failed`
                //   // `reason: ${JSON.stringify(callbackParams.error)}` // TEMPly no reason
                // );
                txCallbackCollection.txError[currentIndex]?.({
                  ...callbackParams,
                  ...extraTxidInfo,
                });
                console.log(`txId: ${txid}, Error`);
                useNotifyMsg.setState({ msg: `txId: ${txid}, Error`, type: 'danger' });
              },
              onTxFinally(callbackParams) {
                // const { addHistoryItem } = useTxHistory.getState();
                txCallbackCollection.txFinally[currentIndex]?.({
                  ...callbackParams,
                  ...extraTxidInfo,
                });
                // addHistoryItem({
                //   status: callbackParams.type === 'error' ? 'fail' : callbackParams.type,
                //   txid,
                //   time: Date.now(),
                //   title: txCallbackCollection.txHistoryInfo?.[currentIndex]?.title,
                //   description: txCallbackCollection.txHistoryInfo?.[currentIndex]?.description,
                // });
                console.log(`txId: ${txid}, finally`);
                // useNotifyMsg.setState({ msg: `txId: ${txid}, Error`, type: 'danger' });
              },
            });
          } catch (err) {
            console.error(err);
            txCallbackCollection.txSentError[currentIndex]?.({ err, ...extraTxidInfo });
          } finally {
            txCallbackCollection.txSentFinally[currentIndex]?.();
          }
        }
        const invokeList = Array.from({ length: allSignedTransactions.length }, () => undefined).reduceRight(
          (acc, _i, idx) => () => sendOneTransaction({ onSuccess: acc, currentIndex: idx }),
          () => {
            resolve({ allSuccess: true, txids });
          }
        );
        // start to send message
        invokeList();
      } catch (err) {
        reject(err);
      }
    })()
  );
}
