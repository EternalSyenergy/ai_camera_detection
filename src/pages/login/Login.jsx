
import { Form, Checkbox, Typography } from "antd";
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
        (state) => state.auth
    );

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const onFinish = (values) => {
        dispatch(loginUser(values));
    };

    return (
        <div className={styles.container}>
            {/* Left welcome panel */}
            <div className={styles.leftSide}>
                <div className={styles.overlay}>
                    <div className={styles.welcomeContent}>
                        {/* <div className={styles.logoIcon}>
                            <UserOutlined />
                        </div> */}

                        <Title className={styles.welcomeTitle}>
                            Welcome Back!
                        </Title>

                        <Text className={styles.welcomeDescription}>
                            Enterprise Management System
                        </Text>

                        <Text className={styles.welcomeSubtext}>
                            Manage your business operations from one
                            secure and centralized platform.
                        </Text>
                    </div>
                </div>
            </div>

            {/* Right login panel */}
            <div className={styles.rightSide}>
                <div className={styles.card}>
                    <div className={styles.formHeader}>
                        <Title level={2} className={styles.loginTitle}>
                            Sign in
                        </Title>

                        <Text className={styles.loginSubtitle}>
                            Enter your credentials to access your account.
                        </Text>
                    </div>

                    <Form
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                        autoComplete="on"
                        className={styles.loginForm}
                    >
                        <Form.Item
                            name="email"
                            label="Email address"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter your email address",
                                },
                                {
                                    type: "email",
                                    message: "Please enter a valid email address",
                                },
                            ]}
                        >
                            <TextInput
                                prefix={<UserOutlined />}
                                placeholder="Enter your email"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter your password",
                                },
                            ]}
                        >
                            <PasswordInput
                                prefix={<LockOutlined />}
                                placeholder="Enter your password"
                            />
                        </Form.Item>

                        <div className={styles.optionRow}>
                            <Checkbox name="rememberMe">
                                Remember me
                            </Checkbox>

                            <Link
                                to="/forgot-password"
                                className={styles.forgotLink}
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <div className={styles.submitButton}>
                            <PrimaryButton
                                htmlType="submit"
                                loading={loading}
                            >
                                Sign in
                            </PrimaryButton>
                        </div>
                    </Form>

                    <div className={styles.securityNote}>
                        <LockOutlined />
                        <Text>
                            Secure access to your workspace
                        </Text>
                    </div>
                </div>

                <Text className={styles.footerText}>
                    Enterprise Management System
                </Text>
            </div>
        </div>
    );
}

export default Login;




// import { Form, Checkbox, Typography, Divider } from "antd";
// import { UserOutlined, LockOutlined } from "@ant-design/icons";
// import { Link, useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { useEffect } from "react";

// import TextInput from "../../components/inputs/TextInput";
// import PasswordInput from "../../components/inputs/PasswordInput";
// import PrimaryButton from "../../components/buttons/PrimaryButton";

// import { loginUser } from "../../feature/auth/authSlice";

// import styles from "./style.module.css";

// const { Title, Text } = Typography;

// function Login() {

//     const dispatch = useDispatch();
//     const navigate = useNavigate();

//     const { loading, isAuthenticated } = useSelector(
//         state => state.auth
//     );

//     useEffect(() => {
//         if (isAuthenticated) {
//             navigate("/dashboard");
//         }
//     }, [isAuthenticated]);

//     const onFinish = (values) => {
//         dispatch(loginUser(values));
//     };

//     return (

//         <div className={styles.container}>

//             <div className={styles.leftSide}>

//                 <div className={styles.overlay}>

//                     <Title style={{color:"#fff"}}>
//                         Welcome Back 👋
//                     </Title>

//                     <Text style={{color:"#dbeafe",fontSize:16}}>
//                         Enterprise Management System
//                     </Text>

//                 </div>

//             </div>

//             <div className={styles.rightSide}>

//                 <div className={styles.card}>

//                     <Title level={2}>
//                         Login
//                     </Title>

//                     <Text type="secondary">
//                         Sign in to continue
//                     </Text>

//                     <Form
//                         layout="vertical"
//                         onFinish={onFinish}
//                         style={{marginTop:30}}
//                     >

//                         <Form.Item
//                             name="email"
//                             label="Email"
//                             rules={[
//                                 {
//                                     required:true,
//                                     message:"Please enter email"
//                                 }
//                             ]}
//                         >

//                             <TextInput
//                                 prefix={<UserOutlined />}
//                                 placeholder="Enter Email"
//                             />

//                         </Form.Item>

//                         <Form.Item
//                             name="password"
//                             label="Password"
//                             rules={[
//                                 {
//                                     required:true,
//                                     message:"Please enter password"
//                                 }
//                             ]}
//                         >

//                             <PasswordInput
//                                 prefix={<LockOutlined />}
//                                 placeholder="Enter Password"
//                             />

//                         </Form.Item>

//                         <div className={styles.optionRow}>

//                             <Checkbox>
//                                 Remember me
//                             </Checkbox>

//                             {/* <Link to="/forgot-password"> */}
//                             <Link to="">
//                                 Forgot Password?
//                             </Link>

//                         </div>

//                         <PrimaryButton
//                             htmlType="submit"
//                             loading={loading}
//                         >
//                             Login
//                         </PrimaryButton>

//                     </Form>

//                     {/* <Divider>
//                         OR
//                     </Divider> */}

//                     {/* <Link to="/register">

//                         <PrimaryButton
//                             type="default"
//                         >
//                             Create Account
//                         </PrimaryButton>

//                     </Link> */}

//                 </div>

//             </div>

//         </div>

//     );
// }

// export default Login;
