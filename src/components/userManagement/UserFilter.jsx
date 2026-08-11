import { Button, Col, Input, Row, Select } from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const roleOptions = [
  { label: "All Roles", value: "" },
  { label: "Admin", value: "Admin" },
  { label: "Operator", value: "Operator" },
  { label: "Viewer", value: "Viewer" },
];

const statusOptions = [
  { label: "All Status", value: "" },
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

function UserFilter({
  filters = {
    search: "",
    role: "",
    status: "",
  },
  onChange = () => {},
  onReset = () => {},
}) {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={24} md={10} lg={10}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search by name or email"
          value={filters.search}
          onChange={(e) => onChange("search", e.target.value)}
        />
      </Col>

      <Col xs={24} sm={12} md={5} lg={5}>
        <Select
          style={{ width: "100%" }}
          placeholder="Role"
          value={filters.role}
          options={roleOptions}
          onChange={(value) => onChange("role", value)}
        />
      </Col>

      <Col xs={24} sm={12} md={5} lg={5}>
        <Select
          style={{ width: "100%" }}
          placeholder="Status"
          value={filters.status}
          options={statusOptions}
          onChange={(value) => onChange("status", value)}
        />
      </Col>

      <Col xs={24} sm={24} md={4} lg={4}>
        <Button
          icon={<ReloadOutlined />}
          block
          onClick={onReset}
        >
          Reset
        </Button>
      </Col>
    </Row>
  );
}

export default UserFilter;