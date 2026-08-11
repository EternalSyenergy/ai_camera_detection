import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { Button, Dropdown } from "antd";

function ActionMenu({
  record,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
}) {
  const items = [
    {
      key: "view",
      icon: <EyeOutlined />,
      label: "View",
      onClick: () => onView(record),
    },
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "Edit",
      onClick: () => onEdit(record),
    },
    {
      key: "status",
      icon: <LockOutlined />,
      label:
        record.status === "Active"
          ? "Deactivate"
          : "Activate",
      onClick: () => onStatusChange(record),
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      danger: true,
      icon: <DeleteOutlined />,
      label: "Delete",
      onClick: () => onDelete(record),
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
        icon={<MoreOutlined />}
      />
    </Dropdown>
  );
}

export default ActionMenu;