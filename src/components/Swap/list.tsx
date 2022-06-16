import SolLogo from '../../assets/images/solana-token.png';
import StrLogo from '../../assets/images/stream-token.png';

export interface IList {
  name: string;
  logo: string;
}

export const list = [
  {
    name: 'SOL',
    logo: SolLogo,
  },
  {
    name: 'STR',
    logo: StrLogo,
  },
];
