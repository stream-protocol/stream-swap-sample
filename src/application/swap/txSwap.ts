import { Trade } from '@raydium-io/raydium-sdk';
import asyncMap from '../../functions/asyncMap';
import { toTokenAmount } from '../../functions/format/toTokenAmount';
import { gt } from '../../functions/numberish/compare';
import { toString } from '../../functions/numberish/toString';
import { loadTransaction } from '../txTools/createTransaction';
import handleMultiTx from '../txTools/handleMultiTx';
import useWallet from '../wallet/useWallet';
import { deUITokenAmount } from '../token/utils/quantumSOL';

import { useSwap } from './useSwap';

import { shakeUndifindedItem } from '../../functions/arrayMethods';
import { useNotifyMsg } from '../err/useNotifyMsg';

export default function txSwap() {
  return handleMultiTx(async ({ transactionCollector, baseUtils: { connection, owner } }) => {
    const { checkWalletHasEnoughBalance, tokenAccountRawInfos } = useWallet.getState();
    const {
      coin1,
      coin2,
      coin1Amount,
      coin2Amount,
      routes,
      routeType,
      directionReversed,
      minReceived,
      maxSpent,
    } = useSwap.getState();

    const upCoin = directionReversed ? coin2 : coin1;
    // although info is included in routes, still need upCoinAmount to pop friendly feedback
    const upCoinAmount = (directionReversed ? coin2Amount : coin1Amount) || '0';

    const downCoin = directionReversed ? coin1 : coin2;
    // although info is included in routes, still need downCoinAmount to pop friendly feedback
    const downCoinAmount = (directionReversed ? coin1Amount : coin2Amount) || '0';

    if (!(upCoinAmount && gt(upCoinAmount, 0))) {
      useNotifyMsg.setState({ msg: 'should input upCoin amount larger than 0' });
      return;
    }

    if (!(downCoinAmount && gt(downCoinAmount, 0))) {
      useNotifyMsg.setState({ msg: 'should input downCoin amount larger than 0' });
      return;
    }
    if (!(upCoin && gt(upCoinAmount, 0))) {
      useNotifyMsg.setState({ msg: 'select a coin in upper box' });
      return;
    }

    if (!downCoin) {
      useNotifyMsg.setState({ msg: 'select a coin in lower box' });
      return;
    }

    if (String(upCoin!.mint) === String(downCoin!.mint)) {
      useNotifyMsg.setState({ msg: 'should not select same mint' });
      return;
    }

    if (!routes) {
      useNotifyMsg.setState({ msg: "can't find correct route" });
      return;
    }

    const upCoinTokenAmount = toTokenAmount(upCoin, upCoinAmount, { alreadyDecimaled: true });
    // const downCoinTokenAmount = toTokenAmount(downCoin, downCoinAmount, { alreadyDecimaled: true });

    if (!checkWalletHasEnoughBalance(upCoinTokenAmount)) {
      console.warn(`not enough ${upCoin.symbol}, upCoinTokenAmount:`, upCoinTokenAmount);
      useNotifyMsg.setState({ msg: `not enough ${upCoin.symbol}` });
      return;
    }
    if (!routeType) {
      useNotifyMsg.setState({ msg: 'accidently routeType is undefined' });
      return;
    }
    console.log('BEFORE MAKE TX');
    const { setupTransaction, tradeTransaction } = await Trade.makeTradeTransaction({
      connection,
      routes,
      routeType,
      fixedSide: 'in', // TODO: currently  only fixed in
      userKeys: { tokenAccounts: tokenAccountRawInfos, owner },
      amountIn: deUITokenAmount(upCoinTokenAmount), // TODO: currently  only fixed upper side
      amountOut: deUITokenAmount(toTokenAmount(downCoin, minReceived, { alreadyDecimaled: true })),
    });

    console.log('setupTransaction: ', setupTransaction, ' tradeTransaction: ', tradeTransaction);
    const signedTransactions = shakeUndifindedItem(
      await asyncMap([setupTransaction, tradeTransaction], (merged) => {
        if (!merged) return;
        const { transaction, signers } = merged;
        return loadTransaction({ transaction: transaction, signers });
      })
    );

    console.log('signedTransactions in txSwap:', signedTransactions);
    for (const signedTransaction of signedTransactions) {
      transactionCollector.add(signedTransaction, {
        txHistoryInfo: {
          title: 'Swap',
          description: `Swap ${toString(upCoinAmount)} ${upCoin.symbol} to ${toString(
            minReceived || maxSpent
          )} ${downCoin.symbol}`,
        },
      });
    }
  });
}
