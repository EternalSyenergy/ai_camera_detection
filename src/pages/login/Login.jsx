

import { Form, Checkbox, Typography, Divider } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

import TextInput from "../../components/inputs/TextInput";
import PasswordInput from "../../components/inputs/PasswordInput";
import PrimaryButton from "../../components/buttons/PrimaryButton";

import { loginUser } from "../../feature/auth/authSlice";

import styles from "./style.module.css";

const { Title, Text } = Typography;

function Login() {

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, isAuthenticated } = useSelector(
        state => state.auth
    );

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard");
        }
    }, [isAuthenticated]);

    const onFinish = (values) => {
        dispatch(loginUser(values));
    };

    return (

        <div className={styles.container}>

            <div className={styles.leftSide}>

                <div className={styles.overlay}>

                    <Title style={{color:"#fff"}}>
                        Welcome Back 👋
                    </Title>

                    <Text style={{color:"#dbeafe",fontSize:16}}>
                        Enterprise Management System
                    </Text>

                </div>

            </div>

            <div className={styles.rightSide}>

                <div className={styles.card}>

                    <Title level={2}>
                        Login
                    </Title>

                    <Text type="secondary">
                        Sign in to continue
                    </Text>

                    <Form
                        layout="vertical"
                        onFinish={onFinish}
                        style={{marginTop:30}}
                    >

                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                {
                                    required:true,
                                    message:"Please enter email"
                                }
                            ]}
                        >

                            <TextInput
                                prefix={<UserOutlined />}
                                placeholder="Enter Email"
                            />

                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[
                                {
                                    required:true,
                                    message:"Please enter password"
                                }
                            ]}
                        >

                            <PasswordInput
                                prefix={<LockOutlined />}
                                placeholder="Enter Password"
                            />

                        </Form.Item>

                        <div className={styles.optionRow}>

                            <Checkbox>
                                Remember me
                            </Checkbox>

                            <Link to="/forgot-password">
                                Forgot Password?
                            </Link>

                        </div>

                        <PrimaryButton
                            htmlType="submit"
                            loading={loading}
                        >
                            Login
                        </PrimaryButton>

                    </Form>

                    <Divider>
                        OR
                    </Divider>

                    <Link to="/register">

                        <PrimaryButton
                            type="default"
                        >
                            Create Account
                        </PrimaryButton>

                    </Link>

                </div>

            </div>

        </div>

    );
}

export default Login;
