import { useNotifyMsg } from '../../application/err/useNotifyMsg';
import styled from 'styled-components';

const ErrorMsg = () => {
  const errorMsg = useNotifyMsg((s) => s.msg);

  return <Layout>{errorMsg}</Layout>;
};

export default ErrorMsg;

const Layout = styled.div`
  width: 100%;
  min-height: 32px;
  color: red;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 8px 0px;
`;
