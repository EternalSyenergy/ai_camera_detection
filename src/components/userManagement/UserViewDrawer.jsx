import {
  Avatar,
  Button,
  Descriptions,
  Divider,
  Drawer,
  Space,
  Tag,
} from "antd";
import { UserOutlined } from "@ant-design/icons";

function UserViewDrawer({
  open,
  onClose,
  user,
}) {
  if (!user) return null;

  return (
    <Drawer
      title="User Details"
      width={650}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>
            Close
          </Button>
        </Space>
      }
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        <Avatar
          size={90}
          icon={<UserOutlined />}
        />

        <h2 style={{ marginTop: 15 }}>
          {user.firstName} {user.lastName}
        </h2>

        <p>{user.email}</p>

        <Tag
          color={
            user.status === "Active"
              ? "success"
              : "error"
          }
        >
          {user.status}
        </Tag>
      </div>

      <Divider />

      <Descriptions
        bordered
        column={1}
        size="middle"
      >
        <Descriptions.Item label="First Name">
          {user.firstName}
        </Descriptions.Item>

        <Descriptions.Item label="Last Name">
          {user.lastName}
        </Descriptions.Item>

        <Descriptions.Item label="Email">
          {user.email}
        </Descriptions.Item>

        <Descriptions.Item label="Phone Number">
          {user.phone}
        </Descriptions.Item>

        <Descriptions.Item label="Department">
          {user.department}
        </Descriptions.Item>

        <Descriptions.Item label="Role">
          <Tag color="blue">
            {user.role}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <Tag
            color={
              user.status === "Active"
                ? "success"
                : "error"
            }
          >
            {user.status}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Created Date">
          {user.createdDate}
        </Descriptions.Item>

        <Descriptions.Item label="Last Login">
          {user.lastLogin}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
}

export default UserViewDrawer;