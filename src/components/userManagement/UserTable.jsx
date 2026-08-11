import { Avatar, Dropdown, Space, Table, Tag } from "antd";
import {
  UserOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
} from "@ant-design/icons";

function UserTable({ filters }) {
  const users = [
    {
      id: 1,
      name: "Mohamed Musthak",
      email: "musthak@gmail.com",
      department: "AI Team",
      role: "Admin",
      status: "Active",
      lastLogin: "Today",
    },
    {
      id: 2,
      name: "John David",
      email: "john@gmail.com",
      department: "Security",
      role: "Operator",
      status: "Active",
      lastLogin: "Yesterday",
    },
    {
      id: 3,
      name: "Alex Johnson",
      email: "alex@gmail.com",
      department: "Operations",
      role: "Viewer",
      status: "Inactive",
      lastLogin: "15-Jul-2026",
    },
  ];

  const filteredUsers = users.filter((user) => {
    const search = filters?.search?.toLowerCase() || "";

    const matchesSearch =
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search);

    const matchesRole =
      !filters?.role || user.role === filters.role;

    const matchesStatus =
      !filters?.status || user.status === filters.status;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case "Admin":
        return "blue";
      case "Operator":
        return "green";
      default:
        return "purple";
    }
  };

  const columns = [
    {
      title: "User",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <div style={{ color: "#888", fontSize: 13 }}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={getRoleColor(role)}>{role}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Active" ? "success" : "error"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Last Login",
      dataIndex: "lastLogin",
      key: "lastLogin",
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      render: (_, record) => {
        const items = [
          {
            key: "1",
            icon: <EyeOutlined />,
            label: "View",
            onClick: () => console.log("View", record.id),
          },
          {
            key: "2",
            icon: <EditOutlined />,
            label: "Edit",
            onClick: () => console.log("Edit", record.id),
          },
          {
            key: "3",
            icon: <LockOutlined />,
            label:
              record.status === "Active"
                ? "Deactivate"
                : "Activate",
            onClick: () => console.log("Status", record.id),
          },
          {
            type: "divider",
          },
          {
            key: "4",
            danger: true,
            icon: <DeleteOutlined />,
            label: "Delete",
            onClick: () => console.log("Delete", record.id),
          },
        ];

        return (
          <Dropdown
            menu={{ items }}
            trigger={["click"]}
          >
            <MoreOutlined
              style={{
                fontSize: 18,
                cursor: "pointer",
              }}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={filteredUsers}
      bordered
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
      }}
    />
  );
}

export default UserTable;