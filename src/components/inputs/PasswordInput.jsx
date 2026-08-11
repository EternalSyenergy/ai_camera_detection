import { Input } from "antd";

const { Password } = Input;

const PasswordInput = (props) => {
  return (
    <Password
      size="large"
      {...props}
    />
  );
};

export default PasswordInput;