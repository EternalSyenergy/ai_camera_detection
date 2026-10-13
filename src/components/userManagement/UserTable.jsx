
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Avatar,
    Button,
    Dropdown,
    Form,
    Input,
    Modal,
    Space,
    Table,
    Tag,
    message,
} from "antd";

import {
    UserOutlined,
    MoreOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    LockOutlined,
    ReloadOutlined,
} from "@ant-design/icons";

import {
    fetchUsers,
    fetchUserById,
    updateUser,
    updateUserStatus,
    deleteUser,
} from "../../feature/user/userThunk";

import {
    selectUsers,
    selectUsersLoading,
    selectUsersError,
    selectSelectedUser,
    selectUserOperationLoading,
} from "../../feature/user/userSelector";

function UserTable({ filters = {} }) {
    const dispatch = useDispatch();

    // Redux state
    const users = useSelector(selectUsers);
    const loading = useSelector(selectUsersLoading);
    const error = useSelector(selectUsersError);
    const selectedUser = useSelector(selectSelectedUser);
    const operationLoading = useSelector(selectUserOperationLoading);

    // Local UI state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState("view");
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [form] = Form.useForm();

    // Fetch users when the component mounts
    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    // Display Redux errors
    useEffect(() => {
        if (error) {
            message.error(
                typeof error === "string"
                    ? error
                    : "Something went wrong"
            );
        }
    }, [error]);

    // Normalize status for consistent comparisons
    const isActive = (status) =>
        String(status ?? "").toLowerCase() === "active";

    // Filter users safely
    const filteredUsers = useMemo(() => {
        const search = String(filters?.search ?? "")
            .trim()
            .toLowerCase();

        return (Array.isArray(users) ? users : []).filter((user) => {
            const name = String(user.name ?? "").toLowerCase();
            const email = String(user.email ?? "").toLowerCase();
            const department = String(user.department ?? "").toLowerCase();
            const role = String(user.role ?? "");
            const status = String(user.status ?? "");

            const matchesSearch =
                !search ||
                name.includes(search) ||
                email.includes(search) ||
                department.includes(search);

            const matchesRole =
                !filters?.role || role === filters.role;

            const matchesStatus =
                !filters?.status ||
                status.toLowerCase() ===
                    String(filters.status).toLowerCase();

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, filters]);

    const getRoleColor = (role) => {
        switch (String(role ?? "").toLowerCase()) {
            case "admin":
                return "blue";
            case "operator":
                return "green";
            case "viewer":
                return "purple";
            default:
                return "default";
        }
    };

    // Open user details
    const handleView = async (user) => {
        setSelectedRecord(user);
        setModalType("view");
        setModalOpen(true);

        try {
            await dispatch(fetchUserById(user.id)).unwrap();
        } catch (err) {
            message.error(
                typeof err === "string"
                    ? err
                    : "Failed to fetch user details"
            );
        }
    };

    // Open edit form
    const handleEdit = (user) => {
        setSelectedRecord(user);
        setModalType("edit");

        form.setFieldsValue({
            name: user.name ?? "",
            department: user.department ?? "",
        });

        setModalOpen(true);
    };

    // Save edited user
    const handleSave = async (values) => {
        const userId = selectedRecord?.id;

        if (!userId) {
            message.error("No user selected");
            return;
        }

        try {
            await dispatch(
                updateUser({
                    id: userId,
                    name: values.name?.trim(),
                    department: values.department?.trim() ?? "",
                })
            ).unwrap();

            message.success("User updated successfully");
            setModalOpen(false);
            form.resetFields();
        } catch (err) {
            message.error(
                typeof err === "string" ? err : "Failed to update user"
            );
        }
    };

    // Activate or deactivate user
    const handleStatusChange = async (user) => {
        const status = isActive(user.status) ? "inactive" : "active";

        try {
            await dispatch(
                updateUserStatus({
                    id: user.id,
                    status,
                })
            ).unwrap();

            message.success(
                `User ${status === "active" ? "activated" : "deactivated"} successfully`
            );
        } catch (err) {
            message.error(
                typeof err === "string"
                    ? err
                    : "Failed to update user status"
            );
        }
    };

    // Delete user
    const handleDelete = async (user) => {
        try {
            await dispatch(deleteUser(user.id)).unwrap();

            message.success("User deleted successfully");

            if (selectedRecord?.id === user.id) {
                setModalOpen(false);
                setSelectedRecord(null);
            }
        } catch (err) {
            message.error(
                typeof err === "string" ? err : "Failed to delete user"
            );
        }
    };

    const handleRefresh = () => {
        dispatch(fetchUsers());
    };

    // Table columns
    const columns = [
        {
            title: "User",
            dataIndex: "name",
            key: "name",
            render: (_, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />

                    <div>
                        <div style={{ fontWeight: 600 }}>
                            {record.name || "—"}
                        </div>

                        <div style={{ color: "#888", fontSize: 13 }}>
                            {record.email || "—"}
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: "Department",
            dataIndex: "department",
            key: "department",
            render: (department) => department || "—",
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            render: (role) => (
                <Tag color={getRoleColor(role)}>
                    {role || "—"}
                </Tag>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={isActive(status) ? "success" : "error"}>
                    {status || "Unknown"}
                </Tag>
            ),
        },
        {
            title: "Last Login",
            dataIndex: "lastLogin",
            key: "lastLogin",
            render: (lastLogin) => {
                if (!lastLogin) return "—";

                const date = new Date(lastLogin);

                return Number.isNaN(date.getTime())
                    ? lastLogin
                    : date.toLocaleString();
            },
        },
        {
            title: "Action",
            key: "action",
            width: 80,
            render: (_, record) => {
                const items = [
                    {
                        key: "view",
                        icon: <EyeOutlined />,
                        label: "View",
                        onClick: () => handleView(record),
                    },
                    {
                        key: "edit",
                        icon: <EditOutlined />,
                        label: "Edit",
                        onClick: () => handleEdit(record),
                    },
                    {
                        key: "status",
                        icon: <LockOutlined />,
                        label: isActive(record.status)
                            ? "Deactivate"
                            : "Activate",
                        onClick: () => handleStatusChange(record),
                    },
                    {
                        type: "divider",
                    },
                    {
                        key: "delete",
                        icon: <DeleteOutlined />,
                        danger: true,
                        label: "Delete",
                        onClick: () => {
                            Modal.confirm({
                                title: "Delete user?",
                                content: `Are you sure you want to delete ${record.name || "this user"}?`,
                                okText: "Delete",
                                okType: "danger",
                                cancelText: "Cancel",
                                onOk: () => handleDelete(record),
                            });
                        },
                    },
                ];

                return (
                    <Dropdown
                        menu={{ items }}
                        trigger={["click"]}
                        placement="bottomRight"
                    >
                        <Button
                            type="text"
                            aria-label={`Actions for ${record.name || "user"}`}
                            icon={<MoreOutlined style={{ fontSize: 18 }} />}
                        />
                    </Dropdown>
                );
            },
        },
    ];

    return (
        <>
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 16,
                }}
            >
                <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    loading={loading}
                >
                    Refresh
                </Button>
            </div>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={filteredUsers}
                loading={loading || operationLoading}
                bordered
                scroll={{ x: 800 }}
                locale={{
                    emptyText: loading
                        ? "Loading users..."
                        : "No users found",
                }}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                    showTotal: (total) => `Total ${total} users`,
                }}
            />

            <Modal
                title={modalType === "edit" ? "Edit User" : "User Details"}
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    form.resetFields();
                }}
                footer={
                    modalType === "edit"
                        ? [
                              <Button
                                  key="cancel"
                                  onClick={() => setModalOpen(false)}
                              >
                                  Cancel
                              </Button>,
                              <Button
                                  key="save"
                                  type="primary"
                                  loading={operationLoading}
                                  onClick={() => form.submit()}
                              >
                                  Save Changes
                              </Button>,
                          ]
                        : [
                              <Button
                                  key="close"
                                  onClick={() => setModalOpen(false)}
                              >
                                  Close
                              </Button>,
                          ]
                }
                destroyOnHidden
            >
                {modalType === "edit" ? (
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSave}
                    >
                        <Form.Item
                            label="Name"
                            name="name"
                            rules={[
                                {
                                    required: true,
                                    whitespace: true,
                                    message: "Please enter the user's name",
                                },
                            ]}
                        >
                            <Input
                                id="editUserName"
                                name="name"
                                autoComplete="name"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Department"
                            name="department"
                        >
                            <Input
                                id="editUserDepartment"
                                name="department"
                            />
                        </Form.Item>
                    </Form>
                ) : (
                    <div>
                        <p>
                            <strong>Name:</strong>{" "}
                            {selectedUser?.id === selectedRecord?.id
                                ? selectedUser?.name
                                : selectedRecord?.name || "—"}
                        </p>

                        <p>
                            <strong>Email:</strong>{" "}
                            {selectedUser?.id === selectedRecord?.id
                                ? selectedUser?.email || "—"
                                : selectedRecord?.email || "—"}
                        </p>

                        <p>
                            <strong>Department:</strong>{" "}
                            {(selectedUser?.id === selectedRecord?.id
                                ? selectedUser?.department
                                : selectedRecord?.department) || "—"}
                        </p>

                        <p>
                            <strong>Role:</strong>{" "}
                            {(selectedUser?.id === selectedRecord?.id
                                ? selectedUser?.role
                                : selectedRecord?.role) || "—"}
                        </p>

                        <p>
                            <strong>Status:</strong>{" "}
                            {(selectedUser?.id === selectedRecord?.id
                                ? selectedUser?.status
                                : selectedRecord?.status) || "—"}
                        </p>
                    </div>
                )}
            </Modal>
        </>
    );
}

export default UserTable;





// import { Avatar, Dropdown, Space, Table, Tag } from "antd";
// import {
//   UserOutlined,
//   MoreOutlined,
//   EyeOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   LockOutlined,
// } from "@ant-design/icons";


// function UserTable({ filters }) {





//   const users = [
//     {
//       id: 1,
//       name: "Mohamed Musthak",
//       email: "musthak@gmail.com",
//       department: "AI Team",
//       role: "Admin",
//       status: "Active",
//       lastLogin: "Today",
//     },
//     {
//       id: 2,
//       name: "John David",
//       email: "john@gmail.com",
//       department: "Security",
//       role: "Operator",
//       status: "Active",
//       lastLogin: "Yesterday",
//     },
//     {
//       id: 3,
//       name: "Alex Johnson",
//       email: "alex@gmail.com",
//       department: "Operations",
//       role: "Viewer",
//       status: "Inactive",
//       lastLogin: "15-Jul-2026",
//     },
//   ];

//   const filteredUsers = users.filter((user) => {
//     const search = filters?.search?.toLowerCase() || "";

//     const matchesSearch =
//       user.name.toLowerCase().includes(search) ||
//       user.email.toLowerCase().includes(search);

//     const matchesRole =
//       !filters?.role || user.role === filters.role;

//     const matchesStatus =
//       !filters?.status || user.status === filters.status;

//     return matchesSearch && matchesRole && matchesStatus;
//   });

//   const getRoleColor = (role) => {
//     switch (role) {
//       case "Admin":
//         return "blue";
//       case "Operator":
//         return "green";
//       default:
//         return "purple";
//     }
//   };

//   const columns = [
//     {
//       title: "User",
//       dataIndex: "name",
//       key: "name",
//       render: (_, record) => (
//         <Space>
//           <Avatar icon={<UserOutlined />} />
//           <div>
//             <div style={{ fontWeight: 600 }}>{record.name}</div>
//             <div style={{ color: "#888", fontSize: 13 }}>
//               {record.email}
//             </div>
//           </div>
//         </Space>
//       ),
//     },
//     {
//       title: "Department",
//       dataIndex: "department",
//       key: "department",
//     },
//     {
//       title: "Role",
//       dataIndex: "role",
//       key: "role",
//       render: (role) => (
//         <Tag color={getRoleColor(role)}>{role}</Tag>
//       ),
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       render: (status) => (
//         <Tag color={status === "Active" ? "success" : "error"}>
//           {status}
//         </Tag>
//       ),
//     },
//     {
//       title: "Last Login",
//       dataIndex: "lastLogin",
//       key: "lastLogin",
//     },
//     {
//       title: "Action",
//       key: "action",
//       width: 80,
//       render: (_, record) => {
//         const items = [
//           {
//             key: "1",
//             icon: <EyeOutlined />,
//             label: "View",
//             onClick: () => console.log("View", record.id),
//           },
//           {
//             key: "2",
//             icon: <EditOutlined />,
//             label: "Edit",
//             onClick: () => console.log("Edit", record.id),
//           },
//           {
//             key: "3",
//             icon: <LockOutlined />,
//             label:
//               record.status === "Active"
//                 ? "Deactivate"
//                 : "Activate",
//             onClick: () => console.log("Status", record.id),
//           },
//           {
//             type: "divider",
//           },
//           {
//             key: "4",
//             danger: true,
//             icon: <DeleteOutlined />,
//             label: "Delete",
//             onClick: () => console.log("Delete", record.id),
//           },
//         ];

//         return (
//           <Dropdown
//             menu={{ items }}
//             trigger={["click"]}
//           >
//             <MoreOutlined
//               style={{
//                 fontSize: 18,
//                 cursor: "pointer",
//               }}
//             />
//           </Dropdown>
//         );
//       },
//     },
//   ];




//   return (
//     <Table
//       rowKey="id"
//       columns={columns}
//       dataSource={filteredUsers}
//       bordered
//       pagination={{
//         pageSize: 10,
//         showSizeChanger: true,
//       }}
//     />
//   );
// }

// export default UserTable;