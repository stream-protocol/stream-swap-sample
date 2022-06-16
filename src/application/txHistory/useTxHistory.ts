import { DateInfo, HexAddress } from '@/types/constants';

export interface TxHistoryInfo {
  txid: HexAddress;
  title?: string;
  block?: number;
  description?: string;
  status: 'success' | 'droped' | 'pending' | 'fail';
  time: DateInfo;
}
