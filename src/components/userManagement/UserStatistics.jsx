import {
  TeamOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Statistic } from "antd";

function UserStatistics({
  totalUsers = 0,
  admins = 0,
  operators = 0,
  viewers = 0,
  disabled = 0,
}) {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={8} lg={4.8}>
        <Card>
          <Statistic
            title="Total Users"
            value={totalUsers}
            prefix={<TeamOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8} lg={4.8}>
        <Card>
          <Statistic
            title="Admins"
            value={admins}
            valueStyle={{ color: "#1677ff" }}
            prefix={<CrownOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8} lg={4.8}>
        <Card>
          <Statistic
            title="Operators"
            value={operators}
            valueStyle={{ color: "#52c41a" }}
            prefix={<SafetyCertificateOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8} lg={4.8}>
        <Card>
          <Statistic
            title="Viewers"
            value={viewers}
            valueStyle={{ color: "#722ed1" }}
            prefix={<EyeOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8} lg={4.8}>
        <Card>
          <Statistic
            title="Disabled"
            value={disabled}
            valueStyle={{ color: "#ff4d4f" }}
            prefix={<StopOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
}

export default UserStatistics;