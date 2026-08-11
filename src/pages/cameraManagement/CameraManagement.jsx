import { useEffect, useRef, useState, useCallback } from "react";

import {
    Card,
    Table,
    Button,
    Drawer,
    Form,
    Input,
    Select,
    Tag,
    Space,
    Popconfirm,
    message,
    Row,
    Col,
    Typography,
    Divider,
    Statistic,
    Grid,
    Checkbox,
    Alert,
    Empty,
    Tooltip,
    Modal,
    Spin,
} from "antd";

import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    VideoCameraOutlined,
    ReloadOutlined,
    WifiOutlined,
    SafetyOutlined,
    EnvironmentOutlined,
    FireOutlined,
    UserOutlined,
    CarOutlined,
    BugOutlined,
    WarningOutlined,
    PlayCircleOutlined,
    EyeOutlined,
    FullscreenOutlined,
    StopOutlined,
} from "@ant-design/icons";

import { useDispatch, useSelector } from "react-redux";

import { fetchCameras } from "../../feature/camera/cameraSlice";

import Hls from "hls.js";

const { Option } = Select;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// ============================================================
// AI DETECTIONS
// ============================================================

const AI_DETECTIONS = [
    { value: "ppe", label: "PPE Detection", description: "Helmet, vest, gloves, shoes", icon: <SafetyOutlined /> },
    { value: "pest", label: "Pest Detection", description: "Detect pests and insects", icon: <BugOutlined /> },
    { value: "fire", label: "Fire & Smoke", description: "Fire and smoke detection", icon: <FireOutlined /> },
    { value: "intrusion", label: "Intrusion Detection", description: "Restricted area monitoring", icon: <WarningOutlined /> },
    { value: "person", label: "Person Detection", description: "Human detection", icon: <UserOutlined /> },
    { value: "vehicle", label: "Vehicle Detection", description: "Cars, trucks and vehicles", icon: <CarOutlined /> },
];

// ============================================================
// STATUS TAG (hoisted — stateless, pure)
// ============================================================

const StatusTag = ({ status }) => (
    <Tag
        color={status === "Online" ? "success" : "error"}
        style={{ borderRadius: 20, padding: "3px 10px", margin: 0 }}
    >
        <span
            style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: status === "Online" ? "#52c41a" : "#ff4d4f",
                marginRight: 6,
            }}
        />
        {status}
    </Tag>
);

// ============================================================
// MOBILE CARD (hoisted — takes callbacks as props)
// ============================================================

const CameraCard = ({ camera, onView, onTest, onEdit }) => (
    <Card size="small" style={{ borderRadius: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Space>
                <VideoCameraOutlined style={{ color: "#1677ff", fontSize: 20 }} />
                <div>
                    <div style={{ fontWeight: 600 }}>{camera.name}</div>
                    <Text type="secondary">{camera.cameraId}</Text>
                </div>
            </Space>
            <StatusTag status={camera.status} />
        </div>

        <Divider />

        <Row gutter={[12, 12]}>
            <Col span={12}>
                <Text type="secondary">Location</Text>
                <div>
                    <EnvironmentOutlined /> {camera.location}
                </div>
            </Col>
            <Col span={12}>
                <Text type="secondary">Stream</Text>
                <div>{camera.streamUrl ? "HLS" : "Not configured"}</div>
            </Col>
        </Row>

        <Divider />

        <Space wrap>
            <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => onView(camera)}>
                View
            </Button>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => onTest(camera)}>
                Test
            </Button>
            <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(camera)}>
                Edit
            </Button>
        </Space>
    </Card>
);

// ============================================================
// CAMERA VIEW MODAL (hoisted — owns nothing, video ref passed in)
// This is the fix for the "video won't play" bug: previously this
// was defined *inside* CameraManagement, so every parent re-render
// created a brand new component type, forcing React to unmount and
// remount the <video> element (and tear down HLS) mid-playback.
// ============================================================

const CameraViewModal = ({
    open,
    camera,
    isPlaying,
    isSmall,
    videoRef,
    onClose,
    onPlay,
    onStop,
    onTest,
    onFullscreen,
}) => (
    <Modal
        title={
            <Space>
                <VideoCameraOutlined style={{ color: "#1677ff" }} />
                {camera?.name}
                {camera && <StatusTag status={camera.status} />}
            </Space>
        }
        open={open}
        onCancel={onClose}
        width={isSmall ? "100%" : 1000}
        centered
        footer={null}
        destroyOnClose
    >
        {camera && (
            <div>
                {/* VIDEO */}
                <div
                    id="camera-live-preview"
                    style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "16 / 9",
                        background: "#080b0f",
                        borderRadius: 10,
                        overflow: "hidden",
                    }}
                >
                    {/* IMPORTANT: the <video> element stays mounted regardless of
                        isPlaying so videoRef.current never goes stale. We only
                        toggle visibility / overlay, never mount-unmount the tag. */}
                    <video
                        ref={videoRef}
                        controls
                        muted
                        autoPlay
                        playsInline
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: isPlaying ? "block" : "none",
                        }}
                    />

                    {!isPlaying && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                            }}
                        >
                            <VideoCameraOutlined style={{ fontSize: 55, opacity: 0.4, marginBottom: 15 }} />
                            <div style={{ fontSize: 17, fontWeight: 600 }}>{camera.name}</div>
                            <Text style={{ color: "#999", marginTop: 6 }}>{camera.location}</Text>
                            <Tag color="blue" style={{ marginTop: 14 }}>
                                Ready to stream
                            </Tag>
                        </div>
                    )}

                    {isPlaying && (
                        <div
                            style={{
                                position: "absolute",
                                top: 14,
                                left: 14,
                                background: "rgba(0,0,0,.7)",
                                color: "#fff",
                                padding: "5px 10px",
                                borderRadius: 20,
                                fontSize: 12,
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-block",
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    background: "#52c41a",
                                    marginRight: 6,
                                }}
                            />
                            LIVE
                        </div>
                    )}
                </div>

                {/* INFORMATION */}
                <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                    <Col xs={24} md={8}>
                        <Card size="small" bordered={false} style={{ background: "#f8fafc" }}>
                            <Text type="secondary">Camera ID</Text>
                            <div style={{ fontWeight: 600 }}>{camera.cameraId}</div>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card size="small" bordered={false} style={{ background: "#f8fafc" }}>
                            <Text type="secondary">Location</Text>
                            <div style={{ fontWeight: 600 }}>{camera.location}</div>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card size="small" bordered={false} style={{ background: "#f8fafc" }}>
                            <Text type="secondary">Stream</Text>
                            <div style={{ fontFamily: "monospace", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis" }}>
                                HLS / M3U8
                            </div>
                        </Card>
                    </Col>
                </Row>

                <Divider />

                {/* CONTROLS */}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <Space>
                        {!isPlaying ? (
                            <Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={onPlay}>
                                Start Live View
                            </Button>
                        ) : (
                            <Button danger size="large" icon={<StopOutlined />} onClick={onStop}>
                                Stop
                            </Button>
                        )}
                        <Button size="large" icon={<ReloadOutlined />} onClick={() => onTest(camera)}>
                            Test
                        </Button>
                    </Space>

                    <Button size="large" icon={<FullscreenOutlined />} onClick={onFullscreen}>
                        Fullscreen
                    </Button>
                </div>

                {/* STREAM URL */}
                <Alert
                    style={{ marginTop: 16 }}
                    type="info"
                    showIcon
                    message="HLS Stream"
                    description={<Text code>{camera.streamUrl}</Text>}
                />
            </div>
        )}
    </Modal>
);

// ============================================================
// CAMERA DRAWER (hoisted — form instance + callbacks passed in)
// ============================================================

const CameraDrawer = ({ open, editingCamera, isSmall, form, onClose, onSave }) => (
    <Drawer
        title={editingCamera ? "Edit Camera" : "Add Camera"}
        placement="right"
        width={isSmall ? "100%" : 550}
        open={open}
        onClose={onClose}
        destroyOnClose
        footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button type="primary" onClick={onSave}>
                    {editingCamera ? "Update Camera" : "Add Camera"}
                </Button>
            </div>
        }
    >
        <Form form={form} layout="vertical">
            <Form.Item
                label="Camera ID"
                name="cameraId"
                rules={[{ required: true, message: "Enter camera ID" }]}
            >
                <Input size="large" placeholder="CAM-001" />
            </Form.Item>

            <Form.Item
                label="Camera Name"
                name="name"
                rules={[{ required: true, message: "Enter camera name" }]}
            >
                <Input size="large" placeholder="Production Camera 01" />
            </Form.Item>

            <Form.Item label="Location" name="location">
                <Input size="large" placeholder="Production Area A" />
            </Form.Item>

            <Form.Item label="Status" name="status">
                <Select size="large" defaultValue="Online">
                    <Option value="Online">Online</Option>
                    <Option value="Offline">Offline</Option>
                </Select>
            </Form.Item>

            <Form.Item
                label="Stream URL"
                name="streamUrl"
                extra="Use an HLS .m3u8 URL."
                rules={[
                    {
                        validator: (_, value) => {
                            if (!value) return Promise.resolve();
                            try {
                                const url = new URL(value);
                                if (url.protocol !== "http:" && url.protocol !== "https:") {
                                    return Promise.reject(new Error("URL must be http(s)"));
                                }
                                return Promise.resolve();
                            } catch {
                                return Promise.reject(new Error("Enter a valid URL"));
                            }
                        },
                    },
                ]}
            >
                <Input size="large" placeholder="https://server.com/live/camera.m3u8" />
            </Form.Item>

            <Divider />

            <Form.Item label="AI Detection" name="aiDetection">
                <Checkbox.Group style={{ width: "100%" }}>
                    <Row gutter={[8, 8]}>
                        {AI_DETECTIONS.map((detection) => (
                            <Col span={24} key={detection.value}>
                                <Checkbox value={detection.value}>
                                    <Space>
                                        {detection.icon}
                                        {detection.label}
                                    </Space>
                                </Checkbox>
                            </Col>
                        ))}
                    </Row>
                </Checkbox.Group>
            </Form.Item>
        </Form>
    </Drawer>
);

// ============================================================
// COMPONENT
// ============================================================

function CameraManagement() {
    const [form] = Form.useForm();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const isSmall = !screens.sm;

    // ========================================================
    // REDUX
    // ========================================================

    const dispatch = useDispatch();
    const { cameras, loading, error } = useSelector((state) => state.camera);

    // ========================================================
    // LOCAL STATE
    // ========================================================

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingCamera, setEditingCamera] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // ========================================================
    // VIDEO REF — stable across renders since <video> now always mounted
    // ========================================================

    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    // ========================================================
    // FETCH CAMERAS
    // ========================================================

    useEffect(() => {
        dispatch(fetchCameras());
    }, [dispatch]);

    // ========================================================
    // CLEAN HLS
    // ========================================================

    const destroyHls = useCallback(() => {
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
    }, []);

    // ========================================================
    // PLAY HLS
    // ========================================================

    useEffect(() => {
        if (!viewOpen || !selectedCamera || !isPlaying || !videoRef.current) {
            return;
        }

        const video = videoRef.current;
        const streamUrl = selectedCamera.streamUrl;

        if (!streamUrl) {
            message.warning("No stream URL configured");
            setIsPlaying(false);
            return;
        }

        // ----------------------------------------------------
        // Safari / native HLS
        // ----------------------------------------------------
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = streamUrl;

            const onError = () => {
                message.error("Failed to load stream");
                setIsPlaying(false);
            };

            video.addEventListener("error", onError);
            video.play().catch(() => {});

            return () => {
                video.removeEventListener("error", onError);
                video.pause();
                video.removeAttribute("src");
                video.load();
            };
        }

        // ----------------------------------------------------
        // Chrome / Edge / Firefox
        // ----------------------------------------------------
        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
            });

            hlsRef.current = hls;

            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => {});
            });

            // Handle fatal errors instead of just logging them —
            // previously a single network hiccup silently killed
            // playback with no recovery attempt and no user feedback.
            hls.on(Hls.Events.ERROR, (_, data) => {
                console.error("HLS error:", data);

                if (!data.fatal) return;

                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        message.warning("Network issue, retrying stream...");
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        message.warning("Media error, recovering...");
                        hls.recoverMediaError();
                        break;
                    default:
                        message.error("Unable to load stream");
                        destroyHls();
                        setIsPlaying(false);
                        break;
                }
            });

            return () => {
                destroyHls();
                video.pause();
                video.removeAttribute("src");
                video.load();
            };
        }

        message.error("HLS is not supported by this browser");
        setIsPlaying(false);
    }, [viewOpen, selectedCamera, isPlaying, destroyHls]);

    // ========================================================
    // OPEN / CLOSE CAMERA VIEW
    // ========================================================

    const openCameraView = (camera) => {
        setSelectedCamera(camera);
        setIsPlaying(false);
        setViewOpen(true);
    };

    const closeCameraView = () => {
        destroyHls();
        setIsPlaying(false);
        setSelectedCamera(null);
        setViewOpen(false);
    };

    // ========================================================
    // PLAY / STOP
    // ========================================================

    const playCamera = () => {
        if (!selectedCamera) return;

        if (selectedCamera.status !== "Online") {
            message.error("Camera is offline");
            return;
        }

        if (!selectedCamera.streamUrl) {
            message.warning("No stream URL configured");
            return;
        }

        setIsPlaying(true);
    };

    const stopCamera = () => {
        destroyHls();
        setIsPlaying(false);
    };

    // ========================================================
    // FULLSCREEN
    // ========================================================

    const fullscreenCamera = () => {
        const element = document.getElementById("camera-live-preview");
        if (!element) return;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        }
    };

    // ========================================================
    // ADD / EDIT CAMERA
    // ========================================================

    const openAddCamera = () => {
        setEditingCamera(null);
        form.resetFields();

        form.setFieldsValue({
            port: 554,
            type: "IP Camera",
            protocol: "RTSP",
            aiDetection: ["ppe"],
        });

        setDrawerOpen(true);
    };

    const openEditCamera = (camera) => {
        setEditingCamera(camera);

        form.setFieldsValue({
            cameraId: camera.cameraId,
            name: camera.name,
            location: camera.location,
            status: camera.status,
            streamUrl: camera.streamUrl,
        });

        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setEditingCamera(null);
        form.resetFields();
    };

    // ========================================================
    // SAVE
    // ========================================================

    const handleSave = async () => {
        try {
            const values = await form.validateFields();

            console.log("Camera values:", values);

            if (editingCamera) {
                message.success("Camera updated successfully");
            } else {
                message.success("Camera added successfully");
            }

            closeDrawer();
        } catch (error) {
            console.log(error);
        }
    };

    // ========================================================
    // DELETE
    // ========================================================

    const handleDelete = (cameraId) => {
        console.log("Delete:", cameraId);

        if (selectedCamera?.cameraId === cameraId) {
            closeCameraView();
        }

        message.success("Camera deleted successfully");
    };

    // ========================================================
    // REFRESH
    // ========================================================

    const refreshCameras = () => {
        dispatch(fetchCameras());
        message.success("Camera list refreshed");
    };

    // ========================================================
    // TEST CONNECTION
    // ========================================================

    const testConnection = (camera) => {
        message.loading({ content: `Testing ${camera.cameraId}...`, duration: 1 });

        setTimeout(() => {
            message.success(`${camera.cameraId} is reachable`);
        }, 1200);
    };

    // ========================================================
    // STATISTICS
    // ========================================================

    const totalCameras = cameras?.length || 0;
    const onlineCameras = cameras?.filter((camera) => camera.status === "Online").length || 0;
    const offlineCameras = totalCameras - onlineCameras;

    // ========================================================
    // TABLE COLUMNS
    // ========================================================

    const columns = [
        {
            title: "Camera",
            key: "camera",
            width: 260,
            render: (_, record) => (
                <Space size={12}>
                    <div
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            background: "#eaf3ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <VideoCameraOutlined style={{ color: "#1677ff", fontSize: 19 }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600 }}>{record.name}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.cameraId}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: "Location",
            key: "location",
            width: 200,
            render: (_, record) => (
                <Space>
                    <EnvironmentOutlined />
                    {record.location}
                </Space>
            ),
        },
        {
            title: "Stream",
            key: "stream",
            width: 130,
            render: (_, record) => (
                <Tag color={record.streamUrl ? "blue" : "default"}>{record.streamUrl ? "HLS" : "No Stream"}</Tag>
            ),
        },
        {
            title: "Status",
            key: "status",
            width: 130,
            render: (_, record) => <StatusTag status={record.status} />,
        },
        {
            title: "Actions",
            key: "actions",
            width: 220,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Live View">
                        <Button
                            size="small"
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() => openCameraView(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Test">
                        <Button size="small" icon={<ReloadOutlined />} onClick={() => testConnection(record)} />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button size="small" icon={<EditOutlined />} onClick={() => openEditCamera(record)} />
                    </Tooltip>
                    <Popconfirm
                        title="Delete camera?"
                        description="This camera will be removed."
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(record.cameraId)}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: isSmall ? 12 : 24 }}>
            {/* HEADER */}
            <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 22 }}>
                <Col>
                    <Space>
                        <VideoCameraOutlined style={{ fontSize: 25, color: "#1677ff" }} />
                        <div>
                            <Title level={isSmall ? 3 : 2} style={{ margin: 0 }}>
                                Camera Management
                            </Title>
                            <Text type="secondary">Configure, monitor and manage AI cameras</Text>
                        </div>
                    </Space>
                </Col>

                <Col>
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={refreshCameras} loading={loading}>
                            {!isSmall && "Refresh"}
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={openAddCamera}>
                            Add Camera
                        </Button>
                    </Space>
                </Col>
            </Row>

            {/* ERROR */}
            {error && (
                <Alert
                    type="error"
                    showIcon
                    message="Failed to load cameras"
                    description={error}
                    style={{ marginBottom: 20 }}
                />
            )}

            {/* STATISTICS */}
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Total Cameras" value={totalCameras} prefix={<VideoCameraOutlined />} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic
                            title="Online"
                            value={onlineCameras}
                            prefix={<WifiOutlined />}
                            valueStyle={{ color: "#16a34a" }}
                        />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic
                            title="Offline"
                            value={offlineCameras}
                            prefix={<WifiOutlined />}
                            valueStyle={{ color: "#ff4d4f" }}
                        />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic
                            title="With Stream"
                            value={cameras.filter((camera) => !!camera.streamUrl).length}
                            prefix={<PlayCircleOutlined />}
                            valueStyle={{ color: "#1677ff" }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* CAMERA LIST */}
            <Card bordered={false} title="Connected Cameras">
                {loading ? (
                    <div style={{ textAlign: "center", padding: 60 }}>
                        <Spin size="large" />
                    </div>
                ) : cameras.length === 0 ? (
                    <Empty description="No cameras configured" />
                ) : isMobile ? (
                    cameras.map((camera) => (
                        <CameraCard
                            key={camera.cameraId}
                            camera={camera}
                            onView={openCameraView}
                            onTest={testConnection}
                            onEdit={openEditCamera}
                        />
                    ))
                ) : (
                    <Table
                        rowKey="cameraId"
                        columns={columns}
                        dataSource={cameras}
                        scroll={{ x: 1000 }}
                        pagination={{ pageSize: 10 }}
                    />
                )}
            </Card>

            <CameraDrawer
                open={drawerOpen}
                editingCamera={editingCamera}
                isSmall={isSmall}
                form={form}
                onClose={closeDrawer}
                onSave={handleSave}
            />

            <CameraViewModal
                open={viewOpen}
                camera={selectedCamera}
                isPlaying={isPlaying}
                isSmall={isSmall}
                videoRef={videoRef}
                onClose={closeCameraView}
                onPlay={playCamera}
                onStop={stopCamera}
                onTest={testConnection}
                onFullscreen={fullscreenCamera}
            />
        </div>
    );
}

export default CameraManagement;












// import { useEffect, useRef, useState } from "react";

// import {
//     Card,
//     Table,
//     Button,
//     Drawer,
//     Form,
//     Input,
//     Select,
//     Tag,
//     Space,
//     Popconfirm,
//     message,
//     Row,
//     Col,
//     Typography,
//     Divider,
//     Statistic,
//     Grid,
//     Checkbox,
//     Alert,
//     Empty,
//     Tooltip,
//     Modal,
//     Spin,
// } from "antd";

// import {
//     PlusOutlined,
//     EditOutlined,
//     DeleteOutlined,
//     VideoCameraOutlined,
//     ReloadOutlined,
//     WifiOutlined,
//     SafetyOutlined,
//     EnvironmentOutlined,
//     LinkOutlined,
//     FireOutlined,
//     UserOutlined,
//     CarOutlined,
//     BugOutlined,
//     WarningOutlined,
//     GlobalOutlined,
//     PlayCircleOutlined,
//     PauseCircleOutlined,
//     EyeOutlined,
//     FullscreenOutlined,
//     StopOutlined,
// } from "@ant-design/icons";

// import { useDispatch, useSelector } from "react-redux";

// import {
//     fetchCameras,
// } from "../../feature/camera/cameraSlice";

// import Hls from "hls.js";

// const { Option } = Select;

// const { Title, Text } = Typography;

// const { useBreakpoint } = Grid;


// // ============================================================
// // AI DETECTIONS
// // ============================================================

// const AI_DETECTIONS = [
//     {
//         value: "ppe",
//         label: "PPE Detection",
//         description: "Helmet, vest, gloves, shoes",
//         icon: <SafetyOutlined />,
//     },
//     {
//         value: "pest",
//         label: "Pest Detection",
//         description: "Detect pests and insects",
//         icon: <BugOutlined />,
//     },
//     {
//         value: "fire",
//         label: "Fire & Smoke",
//         description: "Fire and smoke detection",
//         icon: <FireOutlined />,
//     },
//     {
//         value: "intrusion",
//         label: "Intrusion Detection",
//         description: "Restricted area monitoring",
//         icon: <WarningOutlined />,
//     },
//     {
//         value: "person",
//         label: "Person Detection",
//         description: "Human detection",
//         icon: <UserOutlined />,
//     },
//     {
//         value: "vehicle",
//         label: "Vehicle Detection",
//         description: "Cars, trucks and vehicles",
//         icon: <CarOutlined />,
//     },
// ];


// // ============================================================
// // COMPONENT
// // ============================================================

// function CameraManagement() {

//     const [form] = Form.useForm();

//     const screens = useBreakpoint();

//     const isMobile = !screens.md;

//     const isSmall = !screens.sm;


//     // ========================================================
//     // REDUX
//     // ========================================================

//     const dispatch = useDispatch();

//     const {
//         cameras,
//         loading,
//         error,
//     } = useSelector(
//         (state) => state.camera
//     );


//     // ========================================================
//     // LOCAL STATE
//     // ========================================================

//     const [drawerOpen, setDrawerOpen] =
//         useState(false);

//     const [editingCamera, setEditingCamera] =
//         useState(null);

//     const [viewOpen, setViewOpen] =
//         useState(false);

//     const [selectedCamera, setSelectedCamera] =
//         useState(null);

//     const [isPlaying, setIsPlaying] =
//         useState(false);


//     // ========================================================
//     // VIDEO REF
//     // ========================================================

//     const videoRef = useRef(null);

//     const hlsRef = useRef(null);


//     // ========================================================
//     // FETCH CAMERAS
//     // ========================================================

//     useEffect(() => {

//         dispatch(fetchCameras());

//     }, [dispatch]);


//     // ========================================================
//     // CLEAN HLS
//     // ========================================================

//     const destroyHls = () => {

//         if (hlsRef.current) {

//             hlsRef.current.destroy();

//             hlsRef.current = null;
//         }

//     };


//     // ========================================================
//     // PLAY HLS
//     // ========================================================

//     useEffect(() => {

//         if (
//             !viewOpen ||
//             !selectedCamera ||
//             !isPlaying ||
//             !videoRef.current
//         ) {
//             return;
//         }


//         const video =
//             videoRef.current;

//         const streamUrl =
//             selectedCamera.streamUrl;


//         if (!streamUrl) {

//             message.warning(
//                 "No stream URL configured"
//             );

//             return;
//         }


//         // ----------------------------------------------------
//         // Safari / native HLS
//         // ----------------------------------------------------

//         if (
//             video.canPlayType(
//                 "application/vnd.apple.mpegurl"
//             )
//         ) {

//             video.src = streamUrl;

//             video.play().catch(() => {});

//             return;
//         }


//         // ----------------------------------------------------
//         // Chrome / Edge / Firefox
//         // ----------------------------------------------------

//         if (Hls.isSupported()) {

//             const hls =
//                 new Hls({
//                     enableWorker: true,
//                     lowLatencyMode: true,
//                 });


//             hlsRef.current = hls;


//             hls.loadSource(
//                 streamUrl
//             );


//             hls.attachMedia(
//                 video
//             );


//             hls.on(
//                 Hls.Events.MANIFEST_PARSED,
//                 () => {

//                     video
//                         .play()
//                         .catch(() => {});

//                 }
//             );


//             hls.on(
//                 Hls.Events.ERROR,
//                 (_, data) => {

//                     console.error(
//                         "HLS error:",
//                         data
//                     );

//                 }
//             );

//         } else {

//             message.error(
//                 "HLS is not supported by this browser"
//             );

//         }


//         return () => {

//             destroyHls();

//             video.pause();

//             video.removeAttribute("src");

//             video.load();

//         };

//     }, [
//         viewOpen,
//         selectedCamera,
//         isPlaying,
//     ]);


//     // ========================================================
//     // OPEN CAMERA
//     // ========================================================

//     const openCameraView = (
//         camera
//     ) => {

//         setSelectedCamera(camera);

//         setIsPlaying(false);

//         setViewOpen(true);

//     };


//     // ========================================================
//     // CLOSE CAMERA
//     // ========================================================

//     const closeCameraView = () => {

//         destroyHls();

//         setIsPlaying(false);

//         setSelectedCamera(null);

//         setViewOpen(false);

//     };


//     // ========================================================
//     // PLAY
//     // ========================================================

//     const playCamera = () => {

//         if (!selectedCamera) {
//             return;
//         }


//         if (
//             selectedCamera.status !==
//             "Online"
//         ) {

//             message.error(
//                 "Camera is offline"
//             );

//             return;
//         }


//         if (
//             !selectedCamera.streamUrl
//         ) {

//             message.warning(
//                 "No stream URL configured"
//             );

//             return;
//         }


//         setIsPlaying(true);

//     };


//     // ========================================================
//     // STOP
//     // ========================================================

//     const stopCamera = () => {

//         destroyHls();

//         setIsPlaying(false);

//     };


//     // ========================================================
//     // FULLSCREEN
//     // ========================================================

//     const fullscreenCamera = () => {

//         const element =
//             document.getElementById(
//                 "camera-live-preview"
//             );


//         if (!element) {
//             return;
//         }


//         if (
//             element.requestFullscreen
//         ) {

//             element.requestFullscreen();

//         }

//     };


//     // ========================================================
//     // ADD CAMERA
//     // ========================================================

//     const openAddCamera = () => {

//         setEditingCamera(null);

//         form.resetFields();


//         form.setFieldsValue({

//             port: 554,

//             type: "IP Camera",

//             protocol: "RTSP",

//             aiDetection: [
//                 "ppe",
//             ],

//         });


//         setDrawerOpen(true);

//     };


//     // ========================================================
//     // EDIT CAMERA
//     // ========================================================

//     const openEditCamera = (
//         camera
//     ) => {

//         setEditingCamera(camera);


//         form.setFieldsValue({

//             cameraId:
//                 camera.cameraId,

//             name:
//                 camera.name,

//             location:
//                 camera.location,

//             status:
//                 camera.status,

//             streamUrl:
//                 camera.streamUrl,

//         });


//         setDrawerOpen(true);

//     };


//     // ========================================================
//     // CLOSE DRAWER
//     // ========================================================

//     const closeDrawer = () => {

//         setDrawerOpen(false);

//         setEditingCamera(null);

//         form.resetFields();

//     };


//     // ========================================================
//     // SAVE
//     // ========================================================

//     const handleSave = async () => {

//         try {

//             const values =
//                 await form.validateFields();


//             console.log(
//                 "Camera values:",
//                 values
//             );


//             if (editingCamera) {

//                 message.success(
//                     "Camera updated successfully"
//                 );

//             } else {

//                 message.success(
//                     "Camera added successfully"
//                 );

//             }


//             closeDrawer();

//         } catch (error) {

//             console.log(error);

//         }

//     };


//     // ========================================================
//     // DELETE
//     // ========================================================

//     const handleDelete = (
//         cameraId
//     ) => {

//         console.log(
//             "Delete:",
//             cameraId
//         );


//         if (
//             selectedCamera?.cameraId ===
//             cameraId
//         ) {

//             closeCameraView();

//         }


//         message.success(
//             "Camera deleted successfully"
//         );

//     };


//     // ========================================================
//     // REFRESH
//     // ========================================================

//     const refreshCameras = () => {

//         dispatch(
//             fetchCameras()
//         );

//         message.success(
//             "Camera list refreshed"
//         );

//     };


//     // ========================================================
//     // TEST CONNECTION
//     // ========================================================

//     const testConnection = (
//         camera
//     ) => {

//         message.loading({

//             content:
//                 `Testing ${camera.cameraId}...`,

//             duration: 1,

//         });


//         setTimeout(() => {

//             message.success(
//                 `${camera.cameraId} is reachable`
//             );

//         }, 1200);

//     };


//     // ========================================================
//     // DETECTION LABEL
//     // ========================================================

//     const getDetectionLabel = (
//         value
//     ) => {

//         const detection =
//             AI_DETECTIONS.find(
//                 (item) =>
//                     item.value === value
//             );


//         return detection
//             ? detection.label
//             : value;

//     };


//     // ========================================================
//     // STATISTICS
//     // ========================================================

//     const totalCameras =
//         cameras?.length || 0;


//     const onlineCameras =
//         cameras?.filter(
//             (camera) =>
//                 camera.status ===
//                 "Online"
//         ).length || 0;


//     const offlineCameras =
//         totalCameras -
//         onlineCameras;


//     // ========================================================
//     // STATUS TAG
//     // ========================================================

//     const StatusTag = ({
//         status,
//     }) => (

//         <Tag
//             color={
//                 status === "Online"
//                     ? "success"
//                     : "error"
//             }
//             style={{
//                 borderRadius: 20,
//                 padding:
//                     "3px 10px",
//                 margin: 0,
//             }}
//         >

//             <span
//                 style={{
//                     display:
//                         "inline-block",
//                     width: 6,
//                     height: 6,
//                     borderRadius:
//                         "50%",
//                     background:
//                         status ===
//                         "Online"
//                             ? "#52c41a"
//                             : "#ff4d4f",
//                     marginRight: 6,
//                 }}
//             />

//             {status}

//         </Tag>

//     );


//     // ========================================================
//     // TABLE
//     // ========================================================

//         const columns = [

//             {
//                 title: "Camera",

//                 key: "camera",

//                 width: 260,

//                 render: (_, record) => (

//                     <Space size={12}>

//                         <div
//                             style={{
//                                 width: 42,
//                                 height: 42,
//                                 borderRadius: 10,
//                                 background:
//                                     "#eaf3ff",
//                                 display:
//                                     "flex",
//                                 alignItems:
//                                     "center",
//                                 justifyContent:
//                                     "center",
//                             }}
//                         >

//                             <VideoCameraOutlined
//                                 style={{
//                                     color:
//                                         "#1677ff",
//                                     fontSize: 19,
//                                 }}
//                             />

//                         </div>


//                         <div>

//                             <div
//                                 style={{
//                                     fontWeight:
//                                         600,
//                                 }}
//                             >
//                                 {record.name}
//                             </div>

//                             <Text
//                                 type="secondary"
//                                 style={{
//                                     fontSize: 12,
//                                 }}
//                             >
//                                 {record.cameraId}
//                             </Text>

//                         </div>

//                     </Space>

//                 ),
//             },


//             {
//                 title: "Location",

//                 key: "location",

//                 width: 200,

//                 render: (_, record) => (

//                     <Space>

//                         <EnvironmentOutlined />

//                         {record.location}

//                     </Space>

//                 ),
//             },


//             {
//                 title: "Stream",

//                 key: "stream",

//                 width: 130,

//                 render: (_, record) => (

//                     <Tag
//                         color={
//                             record.streamUrl
//                                 ? "blue"
//                                 : "default"
//                         }
//                     >
//                         {record.streamUrl
//                             ? "HLS"
//                             : "No Stream"}
//                     </Tag>

//                 ),
//             },


//             {
//                 title: "Status",

//                 key: "status",

//                 width: 130,

//                 render: (_, record) => (

//                     <StatusTag
//                         status={
//                             record.status
//                         }
//                     />

//                 ),
//             },


//             {
//                 title: "Actions",

//                 key: "actions",

//                 width: 220,

//                 render: (_, record) => (

//                     <Space>

//                         <Tooltip title="Live View">

//                             <Button
//                                 size="small"
//                                 type="primary"
//                                 icon={
//                                     <PlayCircleOutlined />
//                                 }
//                                 onClick={() =>
//                                     openCameraView(
//                                         record
//                                     )
//                                 }
//                             />

//                         </Tooltip>


//                         <Tooltip title="Test">

//                             <Button
//                                 size="small"
//                                 icon={
//                                     <ReloadOutlined />
//                                 }
//                                 onClick={() =>
//                                     testConnection(
//                                         record
//                                     )
//                                 }
//                             />

//                         </Tooltip>


//                         <Tooltip title="Edit">

//                             <Button
//                                 size="small"
//                                 icon={
//                                     <EditOutlined />
//                                 }
//                                 onClick={() =>
//                                     openEditCamera(
//                                         record
//                                     )
//                                 }
//                             />

//                         </Tooltip>


//                         <Popconfirm
//                             title="Delete camera?"
//                             description="This camera will be removed."
//                             okText="Delete"
//                             cancelText="Cancel"
//                             okButtonProps={{
//                                 danger: true,
//                             }}
//                             onConfirm={() =>
//                                 handleDelete(
//                                     record.cameraId
//                                 )
//                             }
//                         >

//                             <Button
//                                 size="small"
//                                 danger
//                                 icon={
//                                     <DeleteOutlined />
//                                 }
//                             />

//                         </Popconfirm>

//                     </Space>

//                 ),
//             },

//         ];


//     // ========================================================
//     // MOBILE CARD
//     // ========================================================

//     const CameraCard = ({
//         camera,
//     }) => (

//         <Card
//             size="small"
//             style={{
//                 borderRadius: 12,
//                 marginBottom: 10,
//             }}
//         >

//             <div
//                 style={{
//                     display:
//                         "flex",
//                     justifyContent:
//                         "space-between",
//                 }}
//             >

//                 <Space>

//                     <VideoCameraOutlined
//                         style={{
//                             color:
//                                 "#1677ff",
//                             fontSize: 20,
//                         }}
//                     />

//                     <div>

//                         <div
//                             style={{
//                                 fontWeight:
//                                     600,
//                             }}
//                         >
//                             {camera.name}
//                         </div>

//                         <Text
//                             type="secondary"
//                         >
//                             {camera.cameraId}
//                         </Text>

//                     </div>

//                 </Space>


//                 <StatusTag
//                     status={
//                         camera.status
//                     }
//                 />

//             </div>


//             <Divider />


//             <Row gutter={[12, 12]}>

//                 <Col span={12}>

//                     <Text type="secondary">
//                         Location
//                     </Text>

//                     <div>
//                         <EnvironmentOutlined />{" "}
//                         {camera.location}
//                     </div>

//                 </Col>


//                 <Col span={12}>

//                     <Text type="secondary">
//                         Stream
//                     </Text>

//                     <div>

//                         {camera.streamUrl
//                             ? "HLS"
//                             : "Not configured"}

//                     </div>

//                 </Col>

//             </Row>


//             <Divider />


//             <Space wrap>

//                 <Button
//                     type="primary"
//                     size="small"
//                     icon={
//                         <EyeOutlined />
//                     }
//                     onClick={() =>
//                         openCameraView(
//                             camera
//                         )
//                     }
//                 >
//                     View
//                 </Button>


//                 <Button
//                     size="small"
//                     icon={
//                         <ReloadOutlined />
//                     }
//                     onClick={() =>
//                         testConnection(
//                             camera
//                         )
//                     }
//                 >
//                     Test
//                 </Button>


//                 <Button
//                     size="small"
//                     icon={
//                         <EditOutlined />
//                     }
//                     onClick={() =>
//                         openEditCamera(
//                             camera
//                         )
//                     }
//                 >
//                     Edit
//                 </Button>

//             </Space>

//         </Card>

//     );


//     // ========================================================
//     // CAMERA VIEW MODAL
//     // ========================================================

//     const CameraViewModal = () => (

//         <Modal

//             title={

//                 <Space>

//                     <VideoCameraOutlined
//                         style={{
//                             color:
//                                 "#1677ff",
//                         }}
//                     />

//                     {selectedCamera?.name}

//                     {selectedCamera && (

//                         <StatusTag
//                             status={
//                                 selectedCamera.status
//                             }
//                         />

//                     )}

//                 </Space>

//             }

//             open={viewOpen}

//             onCancel={
//                 closeCameraView
//             }

//             width={
//                 isSmall
//                     ? "100%"
//                     : 1000
//             }

//             centered

//             footer={null}

//             destroyOnClose

//         >

//             {selectedCamera && (

//                 <div>

//                     {/* VIDEO */}

//                     <div
//                         id="camera-live-preview"
//                         style={{
//                             position:
//                                 "relative",
//                             width:
//                                 "100%",
//                             aspectRatio:
//                                 "16 / 9",
//                             background:
//                                 "#080b0f",
//                             borderRadius:
//                                 10,
//                             overflow:
//                                 "hidden",
//                         }}
//                     >

//                         {isPlaying ? (

//                             <video
//                                 ref={
//                                     videoRef
//                                 }
//                                 controls
//                                 muted
//                                 autoPlay
//                                 playsInline
//                                 style={{
//                                     width:
//                                         "100%",
//                                     height:
//                                         "100%",
//                                     objectFit:
//                                         "contain",
//                                 }}
//                             />

//                         ) : (

//                             <div
//                                 style={{
//                                     position:
//                                         "absolute",
//                                     inset: 0,
//                                     display:
//                                         "flex",
//                                     flexDirection:
//                                         "column",
//                                     alignItems:
//                                         "center",
//                                     justifyContent:
//                                         "center",
//                                     color:
//                                         "#fff",
//                                 }}
//                             >

//                                 <VideoCameraOutlined
//                                     style={{
//                                         fontSize:
//                                             55,
//                                         opacity:
//                                             0.4,
//                                         marginBottom:
//                                             15,
//                                     }}
//                                 />


//                                 <div
//                                     style={{
//                                         fontSize:
//                                             17,
//                                         fontWeight:
//                                             600,
//                                     }}
//                                 >
//                                     {
//                                         selectedCamera.name
//                                     }
//                                 </div>


//                                 <Text
//                                     style={{
//                                         color:
//                                             "#999",
//                                         marginTop:
//                                             6,
//                                     }}
//                                 >
//                                     {
//                                         selectedCamera.location
//                                     }
//                                 </Text>


//                                 <Tag
//                                     color="blue"
//                                     style={{
//                                         marginTop:
//                                             14,
//                                     }}
//                                 >
//                                     Ready to stream
//                                 </Tag>

//                             </div>

//                         )}


//                         {isPlaying && (

//                             <div
//                                 style={{
//                                     position:
//                                         "absolute",
//                                     top: 14,
//                                     left: 14,
//                                     background:
//                                         "rgba(0,0,0,.7)",
//                                     color:
//                                         "#fff",
//                                     padding:
//                                         "5px 10px",
//                                     borderRadius:
//                                         20,
//                                     fontSize:
//                                         12,
//                                 }}
//                             >

//                                 <span
//                                     style={{
//                                         display:
//                                             "inline-block",
//                                         width: 7,
//                                         height: 7,
//                                         borderRadius:
//                                             "50%",
//                                         background:
//                                             "#52c41a",
//                                         marginRight:
//                                             6,
//                                     }}
//                                 />

//                                 LIVE

//                             </div>

//                         )}

//                     </div>


//                     {/* INFORMATION */}

//                     <Row
//                         gutter={[
//                             12,
//                             12,
//                         ]}
//                         style={{
//                             marginTop: 16,
//                         }}
//                     >

//                         <Col
//                             xs={24}
//                             md={8}
//                         >

//                             <Card
//                                 size="small"
//                                 bordered={false}
//                                 style={{
//                                     background:
//                                         "#f8fafc",
//                                 }}
//                             >

//                                 <Text type="secondary">
//                                     Camera ID
//                                 </Text>

//                                 <div
//                                     style={{
//                                         fontWeight:
//                                             600,
//                                     }}
//                                 >
//                                     {
//                                         selectedCamera.cameraId
//                                     }
//                                 </div>

//                             </Card>

//                         </Col>


//                         <Col
//                             xs={24}
//                             md={8}
//                         >

//                             <Card
//                                 size="small"
//                                 bordered={false}
//                                 style={{
//                                     background:
//                                         "#f8fafc",
//                                 }}
//                             >

//                                 <Text type="secondary">
//                                     Location
//                                 </Text>

//                                 <div
//                                     style={{
//                                         fontWeight:
//                                             600,
//                                     }}
//                                 >
//                                     {
//                                         selectedCamera.location
//                                     }
//                                 </div>

//                             </Card>

//                         </Col>


//                         <Col
//                             xs={24}
//                             md={8}
//                         >

//                             <Card
//                                 size="small"
//                                 bordered={false}
//                                 style={{
//                                     background:
//                                         "#f8fafc",
//                                 }}
//                             >

//                                 <Text type="secondary">
//                                     Stream
//                                 </Text>

//                                 <div
//                                     style={{
//                                         fontFamily:
//                                             "monospace",
//                                         fontSize:
//                                             12,
//                                         overflow:
//                                             "hidden",
//                                         textOverflow:
//                                             "ellipsis",
//                                     }}
//                                 >
//                                     HLS / M3U8
//                                 </div>

//                             </Card>

//                         </Col>

//                     </Row>


//                     <Divider />


//                     {/* CONTROLS */}

//                     <div
//                         style={{
//                             display:
//                                 "flex",
//                             justifyContent:
//                                 "space-between",
//                             gap: 10,
//                             flexWrap:
//                                 "wrap",
//                         }}
//                     >

//                         <Space>

//                             {!isPlaying ? (

//                                 <Button
//                                     type="primary"
//                                     size="large"
//                                     icon={
//                                         <PlayCircleOutlined />
//                                     }
//                                     onClick={
//                                         playCamera
//                                     }
//                                 >
//                                     Start Live View
//                                 </Button>

//                             ) : (

//                                 <Button
//                                     danger
//                                     size="large"
//                                     icon={
//                                         <StopOutlined />
//                                     }
//                                     onClick={
//                                         stopCamera
//                                     }
//                                 >
//                                     Stop
//                                 </Button>

//                             )}


//                             <Button
//                                 size="large"
//                                 icon={
//                                     <ReloadOutlined />
//                                 }
//                                 onClick={() =>
//                                     testConnection(
//                                         selectedCamera
//                                     )
//                                 }
//                             >
//                                 Test
//                             </Button>

//                         </Space>


//                         <Button
//                             size="large"
//                             icon={
//                                 <FullscreenOutlined />
//                             }
//                             onClick={
//                                 fullscreenCamera
//                             }
//                         >
//                             Fullscreen
//                         </Button>

//                     </div>


//                     {/* STREAM URL */}

//                     <Alert
//                         style={{
//                             marginTop: 16,
//                         }}
//                         type="info"
//                         showIcon
//                         message="HLS Stream"
//                         description={

//                             <Text code>
//                                 {
//                                     selectedCamera.streamUrl
//                                 }
//                             </Text>

//                         }
//                     />

//                 </div>

//             )}

//         </Modal>

//     );


//     // ========================================================
//     // DRAWER
//     // ========================================================

//     const CameraDrawer = () => (

//         <Drawer

//             title={
//                 editingCamera
//                     ? "Edit Camera"
//                     : "Add Camera"
//             }

//             placement="right"

//             width={
//                 isSmall
//                     ? "100%"
//                     : 550
//             }

//             open={drawerOpen}

//             onClose={
//                 closeDrawer
//             }

//             destroyOnClose

//             footer={

//                 <div
//                     style={{
//                         display:
//                             "flex",
//                         justifyContent:
//                             "flex-end",
//                         gap: 10,
//                     }}
//                 >

//                     <Button
//                         onClick={
//                             closeDrawer
//                         }
//                     >
//                         Cancel
//                     </Button>


//                     <Button
//                         type="primary"
//                         onClick={
//                             handleSave
//                         }
//                     >

//                         {editingCamera
//                             ? "Update Camera"
//                             : "Add Camera"}

//                     </Button>

//                 </div>

//             }

//         >

//             <Form
//                 form={form}
//                 layout="vertical"
//             >

//                 <Form.Item
//                     label="Camera ID"
//                     name="cameraId"
//                     rules={[
//                         {
//                             required: true,
//                             message:
//                                 "Enter camera ID",
//                         },
//                     ]}
//                 >

//                     <Input
//                         size="large"
//                         placeholder="CAM-001"
//                     />

//                 </Form.Item>


//                 <Form.Item
//                     label="Camera Name"
//                     name="name"
//                     rules={[
//                         {
//                             required: true,
//                             message:
//                                 "Enter camera name",
//                         },
//                     ]}
//                 >

//                     <Input
//                         size="large"
//                         placeholder="Production Camera 01"
//                     />

//                 </Form.Item>


//                 <Form.Item
//                     label="Location"
//                     name="location"
//                 >

//                     <Input
//                         size="large"
//                         placeholder="Production Area A"
//                     />

//                 </Form.Item>


//                 <Form.Item
//                     label="Status"
//                     name="status"
//                 >

//                     <Select
//                         size="large"
//                         defaultValue="Online"
//                     >

//                         <Option value="Online">
//                             Online
//                         </Option>

//                         <Option value="Offline">
//                             Offline
//                         </Option>

//                     </Select>

//                 </Form.Item>


//                 <Form.Item
//                     label="Stream URL"
//                     name="streamUrl"
//                     extra="Use an HLS .m3u8 URL."
//                 >

//                     <Input
//                         size="large"
//                         placeholder="https://server.com/live/camera.m3u8"
//                     />

//                 </Form.Item>


//                 <Divider />


//                 <Form.Item
//                     label="AI Detection"
//                     name="aiDetection"
//                 >

//                     <Checkbox.Group
//                         style={{
//                             width:
//                                 "100%",
//                         }}
//                     >

//                         <Row
//                             gutter={[
//                                 8,
//                                 8,
//                             ]}
//                         >

//                             {AI_DETECTIONS.map(
//                                 (
//                                     detection
//                                 ) => (

//                                     <Col
//                                         span={
//                                             24
//                                         }
//                                         key={
//                                             detection.value
//                                         }
//                                     >

//                                         <Checkbox
//                                             value={
//                                                 detection.value
//                                             }
//                                         >

//                                             <Space>

//                                                 {
//                                                     detection.icon
//                                                 }

//                                                 {
//                                                     detection.label
//                                                 }

//                                             </Space>

//                                         </Checkbox>

//                                     </Col>

//                                 )
//                             )}

//                         </Row>

//                     </Checkbox.Group>

//                 </Form.Item>

//             </Form>

//         </Drawer>

//     );


//     // ========================================================
//     // RENDER
//     // ========================================================

//     return (

//         <div
//             style={{
//                 minHeight:
//                     "100vh",
//                 background:
//                     "#f5f7fa",
//                 padding:
//                     isSmall
//                         ? 12
//                         : 24,
//             }}
//         >

//             {/* HEADER */}

//             <Row
//                 justify="space-between"
//                 align="middle"
//                 gutter={[
//                     16,
//                     16,
//                 ]}
//                 style={{
//                     marginBottom:
//                         22,
//                 }}
//             >

//                 <Col>

//                     <Space>

//                         <VideoCameraOutlined
//                             style={{
//                                 fontSize:
//                                     25,
//                                 color:
//                                     "#1677ff",
//                             }}
//                         />

//                         <div>

//                             <Title
//                                 level={
//                                     isSmall
//                                         ? 3
//                                         : 2
//                                 }
//                                 style={{
//                                     margin: 0,
//                                 }}
//                             >
//                                 Camera Management
//                             </Title>

//                             <Text type="secondary">
//                                 Configure, monitor and manage AI cameras
//                             </Text>

//                         </div>

//                     </Space>

//                 </Col>


//                 <Col>

//                     <Space>

//                         <Button
//                             icon={
//                                 <ReloadOutlined />
//                             }
//                             onClick={
//                                 refreshCameras
//                             }
//                             loading={
//                                 loading
//                             }
//                         >
//                             {!isSmall &&
//                                 "Refresh"}
//                         </Button>


//                         <Button
//                             type="primary"
//                             icon={
//                                 <PlusOutlined />
//                             }
//                             onClick={
//                                 openAddCamera
//                             }
//                         >
//                             Add Camera
//                         </Button>

//                     </Space>

//                 </Col>

//             </Row>


//             {/* ERROR */}

//             {error && (

//                 <Alert
//                     type="error"
//                     showIcon
//                     message="Failed to load cameras"
//                     description={
//                         error
//                     }
//                     style={{
//                         marginBottom:
//                             20,
//                     }}
//                 />

//             )}


//             {/* STATISTICS */}

//             <Row
//                 gutter={[
//                     12,
//                     12,
//                 ]}
//                 style={{
//                     marginBottom:
//                         20,
//                 }}
//             >

//                 <Col
//                     xs={12}
//                     md={6}
//                 >

//                     <Card>

//                         <Statistic
//                             title="Total Cameras"
//                             value={
//                                 totalCameras
//                             }
//                             prefix={
//                                 <VideoCameraOutlined />
//                             }
//                         />

//                     </Card>

//                 </Col>


//                 <Col
//                     xs={12}
//                     md={6}
//                 >

//                     <Card>

//                         <Statistic
//                             title="Online"
//                             value={
//                                 onlineCameras
//                             }
//                             prefix={
//                                 <WifiOutlined />
//                             }
//                             valueStyle={{
//                                 color:
//                                     "#16a34a",
//                             }}
//                         />

//                     </Card>

//                 </Col>


//                 <Col
//                     xs={12}
//                     md={6}
//                 >

//                     <Card>

//                         <Statistic
//                             title="Offline"
//                             value={
//                                 offlineCameras
//                             }
//                             prefix={
//                                 <WifiOutlined />
//                             }
//                             valueStyle={{
//                                 color:
//                                     "#ff4d4f",
//                             }}
//                         />

//                     </Card>

//                 </Col>


//                 <Col
//                     xs={12}
//                     md={6}
//                 >

//                     <Card>

//                         <Statistic
//                             title="With Stream"
//                             value={
//                                 cameras.filter(
//                                     (
//                                         camera
//                                     ) =>
//                                         !!camera.streamUrl
//                                 ).length
//                             }
//                             prefix={
//                                 <PlayCircleOutlined />
//                             }
//                             valueStyle={{
//                                 color:
//                                     "#1677ff",
//                             }}
//                         />

//                     </Card>

//                 </Col>

//             </Row>


//             {/* CAMERA LIST */}

//             <Card
//                 bordered={false}
//                 title="Connected Cameras"
//             >

//                 {loading ? (

//                     <div
//                         style={{
//                             textAlign:
//                                 "center",
//                             padding:
//                                 60,
//                         }}
//                     >

//                         <Spin size="large" />

//                     </div>

//                 ) : cameras.length ===
//                   0 ? (

//                     <Empty
//                         description="No cameras configured"
//                     />

//                 ) : isMobile ? (

//                     cameras.map(
//                         (
//                             camera
//                         ) => (

//                             <CameraCard
//                                 key={
//                                     camera.cameraId
//                                 }
//                                 camera={
//                                     camera
//                                 }
//                             />

//                         )
//                     )

//                 ) : (

//                     <Table
//                         rowKey="cameraId"
//                         columns={
//                             columns
//                         }
//                         dataSource={
//                             cameras
//                         }
//                         scroll={{
//                             x: 1000,
//                         }}
//                         pagination={{
//                             pageSize: 10,
//                         }}
//                     />

//                 )}

//             </Card>


//             <CameraDrawer />

//             <CameraViewModal />

//         </div>

//     );

// }


// export default CameraManagement;
