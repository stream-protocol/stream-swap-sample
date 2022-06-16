import styled from 'styled-components';

interface IButton {
  disabled?: boolean;
  title: string;
  onClick?: React.MouseEventHandler;
}

const Button: React.FC<IButton> = ({ title, disabled = false, onClick }) => {
  return (
    <Layout disabled={disabled} onClick={onClick}>
      {title}
    </Layout>
  );
};

export default Button;

const Layout = styled.button`
  width: 100%;
  font-size: 20px;
  color: white;
  background-color: #21252b;
  border-radius: 15px;
  border: 1px solid #16191d;
  cursor: pointer;
  padding: 6px;
`;
