import { useState } from "react";
import { Button, Card, Typography } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";

import UserStats from "../../components/userManagement/UserStatistics";
import UserFilter from "../../components/userManagement/UserFilter";
import UserTable from "../../components/userManagement/UserTable";
import UserFormDrawer from "../../components/userManagement/UserFormDrawer";

import styles from "./style.module.css";

const { Title, Text } = Typography;

function UserManagement() {
  const [openDrawer, setOpenDrawer] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
  });

  const handleFilterChange = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      role: "",
      status: "",
    });
  };

  return (
    <div className={styles.page}>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className={styles.header}>

        <div className={styles.headerInfo}>
          <Title level={3} className={styles.title}>
            User Management
          </Title>

          <Text className={styles.subtitle}>
            Manage system users and account access
          </Text>
        </div>

        <div className={styles.headerActions}>

          <Button
            icon={<ReloadOutlined />}
            onClick={handleResetFilters}
            className={styles.resetButton}
          >
            Reset
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpenDrawer(true)}
            className={styles.addButton}
          >
            Add User
          </Button>

        </div>

      </div>


      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <div className={styles.statsSection}>

        <div className={styles.sectionLabel}>
          User Overview
        </div>

        <div className={styles.statsGrid}>
          <UserStats />
        </div>

      </div>


      {/* =====================================================
          FILTERS
      ====================================================== */}

      <Card
        bordered={false}
        className={styles.panel}
        styles={{
          body: {
            padding: 0,
          },
        }}
      >

        <div className={styles.panelHeader}>

          <div>
            <div className={styles.panelTitle}>
              Filters
            </div>

            <div className={styles.panelSubtitle}>
              Search and filter user accounts
            </div>
          </div>

          <Button
            type="text"
            onClick={handleResetFilters}
            className={styles.clearButton}
          >
            Clear filters
          </Button>

        </div>

        <div className={styles.filterArea}>

          <UserFilter
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
          />

        </div>

      </Card>


      {/* =====================================================
          USERS
      ====================================================== */}

      <Card
        bordered={false}
        className={`${styles.panel} ${styles.usersPanel}`}
        styles={{
          body: {
            padding: 0,
          },
        }}
      >

        <div className={styles.panelHeader}>

          <div>
            <div className={styles.panelTitle}>
              Users
            </div>

            <div className={styles.panelSubtitle}>
              Manage registered user accounts
            </div>
          </div>

        </div>

        <div className={styles.tableArea}>
          <UserTable filters={filters} />
        </div>

      </Card>


      {/* =====================================================
          DRAWER
      ====================================================== */}

      <UserFormDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
      />

    </div>
  );
}

export default UserManagement;



