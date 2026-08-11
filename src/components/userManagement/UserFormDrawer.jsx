import { useEffect } from "react";
import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  Row,
  Select,
  Space,
  Switch,
} from "antd";

const roleOptions = [
  { value: "Admin", label: "Admin" },
  { value: "Operator", label: "Operator" },
  { value: "Viewer", label: "Viewer" },
];

const departmentOptions = [
  { value: "AI Team", label: "AI Team" },
  { value: "Security", label: "Security" },
  { value: "Operations", label: "Operations" },
];

function UserFormDrawer({
  open,
  onClose,
  user = null,
  onSubmit,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue(user);
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: true,
      });
    }
  }, [user, form]);

  const handleFinish = (values) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Drawer
      title={user ? "Edit User" : "Add User"}
      width={550}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>
            Cancel
          </Button>

          <Button
            type="primary"
            onClick={() => form.submit()}
          >
            {user ? "Update" : "Save"}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[
                {
                  required: true,
                  message: "Enter first name",
                },
              ]}
            >
              <Input placeholder="First Name" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[
                {
                  required: true,
                  message: "Enter last name",
                },
              ]}
            >
              <Input placeholder="Last Name" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              type: "email",
            },
          ]}
        >
          <Input placeholder="Email Address" />
        </Form.Item>

        <Form.Item
          label="Phone Number"
          name="phone"
        >
          <Input placeholder="Phone Number" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Department"
              name="department"
              rules={[
                {
                  required: true,
                  message: "Select department",
                },
              ]}
            >
              <Select
                placeholder="Department"
                options={departmentOptions}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Role"
              name="role"
              rules={[
                {
                  required: true,
                  message: "Select role",
                },
              ]}
            >
              <Select
                placeholder="Role"
                options={roleOptions}
              />
            </Form.Item>
          </Col>
        </Row>

        {!user && (
          <>
            <Form.Item
              label="Password"
              name="password"
              rules={[
                {
                  required: true,
                  message: "Enter password",
                },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                {
                  required: true,
                  message: "Confirm password",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      !value ||
                      getFieldValue("password") === value
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Passwords do not match")
                    );
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>
          </>
        )}

        <Form.Item
          label="Active"
          name="status"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

export default UserFormDrawer;