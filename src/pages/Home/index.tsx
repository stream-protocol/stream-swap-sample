import { useEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Swap from '../../components/Swap';
import { ReactNotifications, Store } from 'react-notifications-component';
import { useNotifyMsg } from '../../application/err/useNotifyMsg';

import 'react-notifications-component/dist/theme.css';

const Home = () => {
  const notifyMsg = useNotifyMsg((s) => s.msg);
  const notifyType = useNotifyMsg((s) => s.type);
  useEffect(() => {
    if (notifyMsg) {
      let title = '';
      switch (notifyType) {
        case 'success':
          title = 'Success';
          break;
        case 'danger':
          title = 'Danger';
          break;
        case 'info':
          title = 'Info';
          break;
        case 'warning':
          title = 'Warning';
          break;
        default:
          title = 'Danger';
          break;
      }
      console.log('inside notify, msg: ', notifyMsg, ' type: ', notifyType);
      Store.addNotification({
        title: title,
        message: notifyMsg,
        type: notifyType,
        insert: 'top',
        container: 'top-right',
        animationIn: ['animate__animated', 'animate__fadeIn'],
        animationOut: ['animate__animated', 'animate__fadeOut'],
        dismiss: {
          duration: 5000,
          onScreen: true,
        },
      });
      setTimeout(() => {
        useNotifyMsg.setState({ msg: '' });
        return;
      }, 5000);
    }
  }, [notifyMsg, notifyType]);
  return (
    <Layout>
      <Header />
      <BodyLayout>
        <ReactNotifications />
        <Swap />
      </BodyLayout>
      <Footer />
    </Layout>
  );
};

export default Home;

const Layout = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const BodyLayout = styled.div`
  width: 100%;
  flex-grow: 1;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  padding: 16px;
`;
