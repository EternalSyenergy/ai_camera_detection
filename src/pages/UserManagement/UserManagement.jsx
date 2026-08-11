import { useState } from "react";
import { Button, Card, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import UserStats from "../../components/userManagement/UserStatistics";
import UserFilter from "../../components/userManagement/UserFilter";
import UserTable from "../../components/userManagement/UserTable";
import UserFormDrawer from "../../components/userManagement/UserFormDrawer";

import styles from "./style.module.css";

const { Title } = Typography;

function UserManagement() {
  const [openDrawer, setOpenDrawer] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
  });

  return (
    <>
      <Card>
        <div className={styles.header}>
          <Title level={3}>User Management</Title>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpenDrawer(true)}
          >
            Add User
          </Button>
        </div>

        <UserStats />

        <UserFilter
          filters={filters}
          onChange={(key, value) =>
            setFilters((prev) => ({
              ...prev,
              [key]: value,
            }))
          }
          onReset={() =>
            setFilters({
              search: "",
              role: "",
              status: "",
            })
          }
        />

       <UserTable filters={filters} />
      </Card>

      <UserFormDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
      />
    </>
  );
}

export default UserManagement;