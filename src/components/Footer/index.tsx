import styled from 'styled-components';

const Footer = () => {
  return <Layout>© 2022 Stream Protocol. All Rights Reserved</Layout>;
};

export default Footer;

const Layout = styled.div`
  width: 100%;
  height: 32px;
  background-color: #21252c;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #e2e4e9;
`;
