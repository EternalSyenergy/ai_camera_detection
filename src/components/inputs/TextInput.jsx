import { Input } from "antd";

const TextInput = ({
  label,
  value,
  onChange,
  placeholder,
  name,
  required = false,
  disabled = false,
}) => {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <label style={{ display: "block", marginBottom: 8 }}>
          {label}
          {required && <span style={{ color: "red" }}> *</span>}
        </label>
      )}

      <Input
        size="large"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
};

export default TextInput;