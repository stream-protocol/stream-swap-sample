import SolLogo from '../../assets/images/solana-token.png';
import RaydiumLogo from '../../assets/images/raydium-token.svg';

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
    name: 'RAY',
    logo: RaydiumLogo,
  },
];
