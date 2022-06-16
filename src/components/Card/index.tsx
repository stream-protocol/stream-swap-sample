import styled from 'styled-components';

interface ICard {
  children?: React.ReactNode;
}

const Card: React.FC<ICard> = ({ children }) => {
  return <Layout>{children}</Layout>;
};

export default Card;

const Layout = styled.div`
  width: 430px;
  max-width: 90%;
  display: block;
  box-sizing: border-box;
  padding: 20px 16px;
  border-radius: 21.2px;
  border: 1px solid #c4c3c6;
`;
