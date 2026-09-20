import { Layout, Menu, Avatar, Dropdown } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  VideoCameraOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import {
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useDispatch } from "react-redux";

import { logout } from "../../../feature/auth/authSlice";

import styles from "./style.module.css";

const { Header, Sider, Content } = Layout;

function DashboardLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

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

  const getSelectedKey = () => {
    if (location.pathname.startsWith("/users")) {
      return "users";
    }

    if (location.pathname.startsWith("/cameras")) {
      return "camera";
    }

    return "dashboard";
  };

  return (
    <Layout className={styles.layout}>
      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <Sider
        width={250}
        breakpoint="lg"
        collapsedWidth="80"
        className={styles.sider}
      >
        {/* LOGO */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <VideoCameraOutlined />
          </div>

          <span className={styles.logoText}>
            AI CCTV
          </span>
        </div>

        {/* MENU */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          className={styles.menu}
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

      {/* =====================================================
          MAIN LAYOUT
      ====================================================== */}
      <Layout className={styles.mainLayout}>
        {/* HEADER */}
        <Header className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerTitleMain}>
              AI Monitoring System
            </div>

            <div className={styles.headerSubtitle}>
              Security &amp; Video Intelligence
            </div>
          </div>

          <Dropdown
            menu={profileMenu}
            placement="bottomRight"
            trigger={["click"]}
          >
            <div className={styles.profile}>
              <Avatar
                size={40}
                icon={<UserOutlined />}
                className={styles.avatar}
              />

              <div className={styles.profileText}>
                <span className={styles.profileName}>
                  Administrator
                </span>

                <span className={styles.profileRole}>
                  System Admin
                </span>
              </div>
            </div>
          </Dropdown>
        </Header>

        {/* =================================================
            CONTENT
        ================================================== */}
        <Content className={styles.content}>
          <div className={styles.contentInner}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default DashboardLayout;



// import { Layout, Menu, Avatar, Dropdown } from "antd";
// import {
//   DashboardOutlined,
//   UserOutlined,
//   VideoCameraOutlined,
//   LogoutOutlined,
// } from "@ant-design/icons";
// import { Outlet, Link, useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";

// import { logout } from "../../../feature/auth/authSlice";

// import styles from "./style.module.css";

// const { Header, Sider, Content } = Layout;

// function DashboardLayout() {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     dispatch(logout());
//     navigate("/login");
//   };

//   const profileMenu = {
//     items: [
//       {
//         key: "logout",
//         icon: <LogoutOutlined />,
//         label: "Logout",
//         onClick: handleLogout,
//       },
//     ],
//   };

//   return (
//     <Layout className={styles.layout}>

//       <Sider
//         width={250}
//         breakpoint="lg"
//         collapsedWidth="80"
//       >

//         <div className={styles.logo}>
//           AI CCTV
//         </div>

//         <Menu
//           theme="dark"
//           mode="inline"
//           defaultSelectedKeys={["dashboard"]}
//         >

//           <Menu.Item
//             key="dashboard"
//             icon={<DashboardOutlined />}
//           >
//             <Link to="/dashboard">
//               Dashboard
//             </Link>
//           </Menu.Item>

//           <Menu.Item
//             key="users"
//             icon={<UserOutlined />}
//           >
//             <Link to="/users">
//               User Management
//             </Link>
//           </Menu.Item>

//           <Menu.Item
//             key="camera"
//             icon={<VideoCameraOutlined />}
//           >
//             <Link to="/cameras">
//               Camera Management
//             </Link>
//           </Menu.Item>

//         </Menu>

//       </Sider>

//       <Layout>

//         <Header className={styles.header}>

//           <h2>
//             AI Monitoring System
//           </h2>

//           <Dropdown
//             menu={profileMenu}
//             placement="bottomRight"
//           >
//             <Avatar
//               size={40}
//               icon={<UserOutlined />}
//               style={{ cursor: "pointer" }}
//             />
//           </Dropdown>

//         </Header>

//         <Content className={styles.content}>
//           <Outlet />
//         </Content>

//       </Layout>

//     </Layout>
//   );
// }

// export default DashboardLayout;