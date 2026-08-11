import { Select } from "antd";

const SelectInput = ({
  options,
  value,
  onChange,
  placeholder,
}) => {
  return (
    <Select
      size="large"
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ width: "100%" }}
    />
  );
};

export default SelectInput;