import { Layout, Menu, Avatar, Dropdown } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  VideoCameraOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { logout } from "../../../feature/auth/authSlice";

import styles from "./style.module.css";

const { Header, Sider, Content } = Layout;

function DashboardLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const profileMenu = {
    items: [
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Logout",
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout className={styles.layout}>

      <Sider
        width={250}
        breakpoint="lg"
        collapsedWidth="80"
      >

        <div className={styles.logo}>
          AI CCTV
        </div>

        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["dashboard"]}
        >

          <Menu.Item
            key="dashboard"
            icon={<DashboardOutlined />}
          >
            <Link to="/dashboard">
              Dashboard
            </Link>
          </Menu.Item>

          <Menu.Item
            key="users"
            icon={<UserOutlined />}
          >
            <Link to="/users">
              User Management
            </Link>
          </Menu.Item>

          <Menu.Item
            key="camera"
            icon={<VideoCameraOutlined />}
          >
            <Link to="/cameras">
              Camera Management
            </Link>
          </Menu.Item>

        </Menu>

      </Sider>

      <Layout>

        <Header className={styles.header}>

          <h2>
            AI Monitoring System
          </h2>

          <Dropdown
            menu={profileMenu}
            placement="bottomRight"
          >
            <Avatar
              size={40}
              icon={<UserOutlined />}
              style={{ cursor: "pointer" }}
            />
          </Dropdown>

        </Header>

        <Content className={styles.content}>
          <Outlet />
        </Content>

      </Layout>

    </Layout>
  );
}

export default DashboardLayout;