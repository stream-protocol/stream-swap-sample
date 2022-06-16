import create from 'zustand';
import { NOTIFICATION_TYPE } from 'react-notifications-component';

export type NotifyMsgStore = {
  msg: string;
  type: NOTIFICATION_TYPE;
};

export const useNotifyMsg = create<NotifyMsgStore>((set, get) => ({
  msg: '',
  type: 'warning',
}));
