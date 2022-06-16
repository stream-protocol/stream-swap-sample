import styled from 'styled-components';
import { Numberish } from '../../types/constants';

interface IInputNumber {
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  value?: Numberish;
}

const InputNumber: React.FC<IInputNumber> = ({ disabled = false, onChange, value }) => {
  return <Input type="number" disabled={disabled} onChange={onChange} value={value?.toString()} />;
};

export default InputNumber;

const Input = styled.input`
  width: 100%;
  border-top-style: hidden;
  border-right-style: hidden;
  border-left-style: hidden;
  outline: none;
  border-bottom: 2px solid #16191d;
  background-color: transparent;
  text-align: right;
  font-size: 24px;
  font-family: Montserrat;
  font-weight: bold;
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  ::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;
