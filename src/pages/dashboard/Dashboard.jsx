import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Hls from "hls.js";

import {
    Card,
    Col,
    Row,
    Statistic,
    Progress,
    Tag,
    Table,
    Badge,
    Button,
    Modal,
    Space,
    Typography,
    Divider,
    Grid,
    Empty,
    Spin,
    Alert,
    message,
} from "antd";

import {
    VideoCameraOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    SafetyOutlined,
    UserOutlined,
    EyeOutlined,
    ReloadOutlined,
    FullscreenOutlined,
    EnvironmentOutlined,
    AlertOutlined,
    PlayCircleOutlined,
    StopOutlined,
} from "@ant-design/icons";

import { fetchCameras } from "../../feature/camera/cameraSlice";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// ============================================================
// DETECTION LABEL MAP (mirrors AI_DETECTIONS in CameraManagement)
// ============================================================

const DETECTION_LABELS = {
    ppe: "PPE",
    pest: "Pest",
    fire: "Fire",
    intrusion: "Intrusion",
    person: "Person",
    vehicle: "Vehicle",
};

// ============================================================
// CAMERA THUMBNAIL — self-contained live HLS preview.
// Each grid card owns its own <video> + hls.js instance so N
// cameras can preview simultaneously without fighting over one ref.
// Muted + no controls, since this is a passive preview only.
// ============================================================

const CameraThumbnail = ({ streamUrl, active }) => {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    useEffect(() => {
        if (!active || !streamUrl || !videoRef.current) {
            return;
        }

        const video = videoRef.current;

        // Safari / native HLS
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = streamUrl;
            video.play().catch(() => {});

            return () => {
                video.pause();
                video.removeAttribute("src");
                video.load();
            };
        }

        // Chrome / Edge / Firefox
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

            hls.on(Hls.Events.ERROR, (_, data) => {
                // Thumbnails fail silently (no toast spam for many cards) —
                // just tear down so it falls back to the offline placeholder.
                if (data.fatal) {
                    hls.destroy();
                    hlsRef.current = null;
                }
            });

            return () => {
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                    hlsRef.current = null;
                }
            };
        }

        return undefined;
    }, [active, streamUrl]);

    if (!active) return null;

    return (
        <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            loop
            style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
            }}
        />
    );
};

// ============================================================
// CAMERA CARD — thumbnail + overlays. Clicking opens the live modal.
// ============================================================

const CameraCard = ({ camera, large = false, onOpen }) => {
    const isOnline = camera.status === "Online";
    const hasStream = !!camera.streamUrl;
    const detections = (camera.aiDetection || []).map(
        (value) => DETECTION_LABELS[value] || value
    );

    return (
        <div
            onClick={() => onOpen(camera)}
            style={{
                position: "relative",
                width: "100%",
                aspectRatio: large ? "16 / 9" : "16 / 10",
                minHeight: large ? 180 : 150,
                borderRadius: 12,
                overflow: "hidden",
                background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                cursor: "pointer",
            }}
        >
            {/* VIDEO / PLACEHOLDER AREA */}
            {isOnline && hasStream ? (
                <div style={{ width: "100%", height: "100%", background: "#000" }}>
                    <CameraThumbnail streamUrl={camera.streamUrl} active />
                </div>
            ) : isOnline ? (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "radial-gradient(circle at center, #374151, #111827)",
                        color: "#6b7280",
                    }}
                >
                    <VideoCameraOutlined style={{ fontSize: large ? 46 : 38 }} />
                </div>
            ) : (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#111827",
                        color: "#6b7280",
                    }}
                >
                    <VideoCameraOutlined style={{ fontSize: 38, marginBottom: 8 }} />
                    <Text style={{ color: "#9ca3af" }}>Camera Offline</Text>
                </div>
            )}

            {/* TOP LEFT */}
            <div
                style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}
            >
                <div
                    style={{
                        padding: "5px 9px",
                        borderRadius: 6,
                        background: "rgba(0,0,0,0.72)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                    }}
                >
                    {camera.name}
                </div>

                {isOnline && camera.alert && (
                    <div
                        style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: "rgba(220,38,38,0.9)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <AlertOutlined style={{ color: "#fff" }} />
                    </div>
                )}
            </div>

            {/* TOP RIGHT LIVE */}
            <div style={{ position: "absolute", top: 10, right: 10 }}>
                <Tag
                    color={isOnline ? "green" : "red"}
                    style={{ margin: 0, border: 0, fontSize: 11, fontWeight: 600 }}
                >
                    {isOnline ? "LIVE" : "OFFLINE"}
                </Tag>
            </div>

            {/* BOTTOM BAR */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "28px 10px 10px",
                    background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                    }}
                >
                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                color: "#fff",
                                fontSize: 12,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {camera.location}
                        </div>

                        {isOnline && detections.length > 0 && (
                            <Space size={4} style={{ marginTop: 4 }}>
                                {detections.map((detection) => (
                                    <Tag
                                        key={detection}
                                        color="blue"
                                        style={{ margin: 0, fontSize: 10, lineHeight: "18px" }}
                                    >
                                        {detection}
                                    </Tag>
                                ))}
                            </Space>
                        )}
                    </div>

                    {isOnline && (
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            style={{ color: "#fff", flexShrink: 0 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpen(camera);
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================================
// DETECTION ITEM
// ============================================================

const DetectionItem = ({ icon, title, value, percent, status }) => (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #f0f0f0" }}>
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
            }}
        >
            <Space>
                <div
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: "#f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {icon}
                </div>

                <div>
                    <Text strong>{title}</Text>
                    <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {value} detections
                        </Text>
                    </div>
                </div>
            </Space>

            <Text strong style={{ fontSize: 15 }}>
                {percent}%
            </Text>
        </div>

        <Progress percent={percent} showInfo={false} size="small" status={status} />
    </div>
);

// ============================================================
// LIVE VIEW MODAL — full playback, same pattern as CameraManagement.
// Owns nothing; video ref + play state are lifted to Dashboard so the
// <video> element stays mounted and never gets torn down mid-stream.
// ============================================================

const LiveViewModal = ({
    open,
    camera,
    isPlaying,
    isSmall,
    videoRef,
    onClose,
    onPlay,
    onStop,
    onFullscreen,
}) => (
    <Modal
        title={
            <Space>
                <VideoCameraOutlined style={{ color: "#1677ff" }} />
                {camera?.name}
                {camera && (
                    <Tag color={camera.status === "Online" ? "green" : "red"}>
                        {camera.status}
                    </Tag>
                )}
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
                <div
                    id="dashboard-live-preview"
                    style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "16 / 9",
                        background: "#080b0f",
                        borderRadius: 10,
                        overflow: "hidden",
                    }}
                >
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

                <Divider />

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
                    </Space>

                    <Button size="large" icon={<FullscreenOutlined />} onClick={onFullscreen}>
                        Fullscreen
                    </Button>
                </div>

                {camera.streamUrl && (
                    <Alert
                        style={{ marginTop: 16 }}
                        type="info"
                        showIcon
                        message="HLS Stream"
                        description={<Text code>{camera.streamUrl}</Text>}
                    />
                )}
            </div>
        )}
    </Modal>
);

// ============================================================
// DASHBOARD
// ============================================================

function Dashboard() {
    const screens = useBreakpoint();

    const isMobile = !screens.md;
    const isSmall = !screens.sm;

    const [allCameraOpen, setAllCameraOpen] = useState(false);

    // ========================================================
    // REDUX — same slice CameraManagement uses
    // ========================================================

    const dispatch = useDispatch();
    const { cameras, loading, error } = useSelector((state) => state.camera);

    useEffect(() => {
        dispatch(fetchCameras());
    }, [dispatch]);

    const refresh = () => {
        dispatch(fetchCameras());
    };

    // ========================================================
    // LIVE VIEW MODAL STATE
    // ========================================================

    const [viewOpen, setViewOpen] = useState(false);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    const destroyHls = useCallback(() => {
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
    }, []);

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

        // Safari / native HLS
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

        // Chrome / Edge / Firefox
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

    const openCameraView = (camera) => {
        if (camera.status !== "Online") {
            message.error("Camera is offline");
            return;
        }

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

    const fullscreenCamera = () => {
        const element = document.getElementById("dashboard-live-preview");
        if (!element) return;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        }
    };

    // ========================================================
    // DERIVED VALUES FROM REAL CAMERA DATA
    // ========================================================

    const totalCameras = cameras?.length || 0;

    const onlineCameras =
        cameras?.filter((camera) => camera.status === "Online").length || 0;

    const offlineCameras = totalCameras - onlineCameras;

    const onlinePercentage =
        totalCameras > 0 ? Math.round((onlineCameras / totalCameras) * 100) : 0;

    const alerts =
        cameras
            ?.filter((camera) => camera.status === "Online" && camera.alert)
            .map((camera, index) => ({
                key: camera.cameraId || index,
                camera: camera.name,
                location: camera.location,
                issue: camera.alertMessage || "PPE Violation Detected",
                time: camera.alertTime || "Just now",
                severity: camera.alertSeverity || "Medium",
            })) || [];

    // ========================================================
    // ALERT TABLE
    // ========================================================

    const alertColumns = [
        {
            title: "Camera",
            dataIndex: "camera",
            key: "camera",
            render: (value) => (
                <Space>
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: "#f0f5ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <VideoCameraOutlined style={{ color: "#1677ff" }} />
                    </div>
                    <Text strong>{value}</Text>
                </Space>
            ),
        },
        {
            title: "Location",
            dataIndex: "location",
            key: "location",
            render: (value) => (
                <Space size={6}>
                    <EnvironmentOutlined style={{ color: "#8c8c8c" }} />
                    <Text>{value}</Text>
                </Space>
            ),
        },
        {
            title: "Detection",
            dataIndex: "issue",
            key: "issue",
            render: (value) => <Text>{value}</Text>,
        },
        {
            title: "Time",
            dataIndex: "time",
            key: "time",
            render: (value) => <Text type="secondary">{value}</Text>,
        },
        {
            title: "Severity",
            dataIndex: "severity",
            key: "severity",
            render: (severity) => (
                <Tag color={severity === "High" ? "error" : "warning"}>{severity}</Tag>
            ),
        },
    ];

    // ========================================================
    // RETURN
    // ========================================================

    return (
        <div
            style={{
                minHeight: "100vh",
                width: "100%",
                background: "#f5f7fa",
                padding: isSmall ? 12 : isMobile ? 16 : 24,
                boxSizing: "border-box",
            }}
        >
            {/* HEADER */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <Title level={isSmall ? 3 : 2} style={{ margin: 0, lineHeight: 1.2 }}>
                        AI Camera Dashboard
                    </Title>
                    <Text type="secondary">
                        Real-time AI monitoring, safety and PPE detection
                    </Text>
                </div>

                <Space>
                    <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
                        {!isSmall && "Refresh"}
                    </Button>

                    <div
                        style={{
                            padding: "7px 12px",
                            borderRadius: 8,
                            background: "#f6ffed",
                            border: "1px solid #b7eb8f",
                        }}
                    >
                        <Badge
                            status="success"
                            text={
                                <Text strong style={{ color: "#389e0d", fontSize: 13 }}>
                                    System Online
                                </Text>
                            }
                        />
                    </div>
                </Space>
            </div>

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

            {/* KPI CARDS */}
            <Row gutter={[12, 12]}>
                <Col xs={12} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: 14, height: "100%" }}>
                        <Statistic
                            title="Total Cameras"
                            value={totalCameras}
                            prefix={<VideoCameraOutlined style={{ color: "#1677ff" }} />}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Configured cameras
                        </Text>
                    </Card>
                </Col>

                <Col xs={12} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: 14, height: "100%" }}>
                        <Statistic
                            title="Online"
                            value={onlineCameras}
                            prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                            valueStyle={{ color: "#389e0d" }}
                        />
                        <Progress percent={onlinePercentage} showInfo={false} size="small" />
                    </Card>
                </Col>

                <Col xs={12} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: 14, height: "100%" }}>
                        <Statistic
                            title="Active Alerts"
                            value={alerts.length}
                            prefix={<WarningOutlined style={{ color: "#ff4d4f" }} />}
                            valueStyle={{ color: "#cf1322" }}
                        />
                        <Text type="danger" style={{ fontSize: 12 }}>
                            Requires attention
                        </Text>
                    </Card>
                </Col>

                <Col xs={12} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: 14, height: "100%" }}>
                        <Statistic
                            title="PPE Compliance"
                            value={94.6}
                            precision={1}
                            suffix="%"
                            prefix={<SafetyOutlined style={{ color: "#722ed1" }} />}
                            valueStyle={{ color: "#722ed1" }}
                        />
                        <Progress percent={94.6} showInfo={false} size="small" />
                    </Card>
                </Col>
            </Row>

            {/* LIVE MONITORING */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                {/* CAMERA GRID */}
                <Col xs={24} xl={16}>
                    <Card
                        bordered={false}
                        style={{ borderRadius: 14 }}
                        title={
                            <div>
                                <div style={{ fontWeight: 600 }}>Live Camera Monitoring</div>
                                <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                                    Real-time surveillance feeds
                                </Text>
                            </div>
                        }
                        extra={
                            <Button
                                type="primary"
                                icon={<FullscreenOutlined />}
                                onClick={() => setAllCameraOpen(true)}
                                disabled={totalCameras === 0}
                            >
                                {!isSmall && "View All"}
                            </Button>
                        }
                    >
                        {loading ? (
                            <div style={{ textAlign: "center", padding: 60 }}>
                                <Spin size="large" />
                            </div>
                        ) : totalCameras === 0 ? (
                            <Empty description="No cameras configured" />
                        ) : (
                            <>
                                <Row gutter={[12, 12]}>
                                    {cameras.slice(0, 4).map((camera) => (
                                        <Col key={camera.cameraId} xs={24} sm={12}>
                                            <CameraCard camera={camera} onOpen={openCameraView} />
                                        </Col>
                                    ))}
                                </Row>

                                <Divider style={{ margin: "16px 0 12px" }} />

                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 12,
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Space wrap size={12}>
                                        <Badge status="success" text={`${onlineCameras} Online`} />
                                        <Badge status="error" text={`${offlineCameras} Offline`} />
                                        <Badge status="processing" text="AI Active" />
                                    </Space>

                                    <Button type="link" onClick={() => setAllCameraOpen(true)}>
                                        View all cameras →
                                    </Button>
                                </div>
                            </>
                        )}
                    </Card>
                </Col>

                {/* DETECTION SUMMARY */}
                <Col xs={24} xl={8}>
                    <Card
                        bordered={false}
                        style={{ borderRadius: 14, height: "100%" }}
                        title={
                            <div>
                                <div style={{ fontWeight: 600 }}>AI Detection Summary</div>
                                <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                                    Current detection activity
                                </Text>
                            </div>
                        }
                    >
                        <DetectionItem
                            icon={<UserOutlined style={{ color: "#1677ff" }} />}
                            title="Persons"
                            value="142"
                            percent={82}
                        />

                        <DetectionItem
                            icon={<SafetyOutlined style={{ color: "#722ed1" }} />}
                            title="Helmet"
                            value="136"
                            percent={96}
                        />

                        <DetectionItem
                            icon={<SafetyOutlined style={{ color: "#13c2c2" }} />}
                            title="Safety Vest"
                            value="130"
                            percent={92}
                        />

                        <DetectionItem
                            icon={<SafetyOutlined style={{ color: "#52c41a" }} />}
                            title="Safety Shoes"
                            value="126"
                            percent={89}
                        />

                        <div
                            style={{
                                marginTop: 16,
                                padding: 12,
                                borderRadius: 10,
                                background: "#f6ffed",
                            }}
                        >
                            <Space>
                                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                                <Text strong style={{ color: "#389e0d" }}>
                                    Overall PPE compliance is healthy
                                </Text>
                            </Space>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* ALERTS */}
            <Card
                bordered={false}
                style={{ marginTop: 16, borderRadius: 14 }}
                title={
                    <div>
                        <div style={{ fontWeight: 600 }}>Recent Safety Alerts</div>
                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                            Latest AI detected safety violations
                        </Text>
                    </div>
                }
                extra={
                    <Button type="link" size="small">
                        View All
                    </Button>
                }
            >
                {alerts.length === 0 ? (
                    <Empty description="No recent alerts" />
                ) : (
                    <Table
                        columns={alertColumns}
                        dataSource={alerts}
                        pagination={false}
                        size={isMobile ? "small" : "middle"}
                        scroll={{ x: 700 }}
                    />
                )}
            </Card>

            {/* ALL CAMERAS MODAL */}
            <Modal
                open={allCameraOpen}
                onCancel={() => setAllCameraOpen(false)}
                footer={null}
                width={isSmall ? "calc(100vw - 16px)" : "95vw"}
                style={{ top: isSmall ? 8 : 20 }}
                styles={{
                    body: { maxHeight: "calc(100vh - 120px)", overflowY: "auto" },
                }}
                title={
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <VideoCameraOutlined />
                        <span>All Live Cameras</span>
                        <Tag color="green">{onlineCameras} Online</Tag>
                        <Tag color="red">{offlineCameras} Offline</Tag>
                    </div>
                }
            >
                {totalCameras === 0 ? (
                    <Empty description="No cameras configured" />
                ) : (
                    <Row gutter={[12, 12]}>
                        {cameras.map((camera) => (
                            <Col key={camera.cameraId} xs={24} sm={12} md={8} lg={6}>
                                <CameraCard camera={camera} large onOpen={openCameraView} />
                            </Col>
                        ))}
                    </Row>
                )}
            </Modal>

            {/* LIVE VIEW MODAL */}
            <LiveViewModal
                open={viewOpen}
                camera={selectedCamera}
                isPlaying={isPlaying}
                isSmall={isSmall}
                videoRef={videoRef}
                onClose={closeCameraView}
                onPlay={playCamera}
                onStop={stopCamera}
                onFullscreen={fullscreenCamera}
            />
        </div>
    );
}

export default Dashboard;























// import { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";

// import {
//     Card,
//     Col,
//     Row,
//     Statistic,
//     Progress,
//     Tag,
//     Table,
//     Badge,
//     Button,
//     Modal,
//     Space,
//     Typography,
//     Divider,
//     Grid,
//     Empty,
//     Spin,
//     Alert,
// } from "antd";

// import {
//     VideoCameraOutlined,
//     WarningOutlined,
//     CheckCircleOutlined,
//     SafetyOutlined,
//     UserOutlined,
//     EyeOutlined,
//     ReloadOutlined,
//     FullscreenOutlined,
//     EnvironmentOutlined,
//     AlertOutlined,
// } from "@ant-design/icons";

// import { fetchCameras } from "../../feature/camera/cameraSlice";

// const { Title, Text } = Typography;
// const { useBreakpoint } = Grid;

// // ============================================================
// // DETECTION LABEL MAP (mirrors AI_DETECTIONS in CameraManagement)
// // ============================================================

// const DETECTION_LABELS = {
//     ppe: "PPE",
//     pest: "Pest",
//     fire: "Fire",
//     intrusion: "Intrusion",
//     person: "Person",
//     vehicle: "Vehicle",
// };

// // ============================================================
// // DASHBOARD
// // ============================================================

// function Dashboard() {
//     const screens = useBreakpoint();

//     const isMobile = !screens.md;
//     const isSmall = !screens.sm;

//     const [allCameraOpen, setAllCameraOpen] = useState(false);

//     // ========================================================
//     // REDUX — same slice CameraManagement uses
//     // ========================================================

//     const dispatch = useDispatch();
//     const { cameras, loading, error } = useSelector((state) => state.camera);

//     useEffect(() => {
//         dispatch(fetchCameras());
//     }, [dispatch]);

//     const refresh = () => {
//         dispatch(fetchCameras());
//     };

//     // ========================================================
//     // DERIVED VALUES FROM REAL CAMERA DATA
//     // ========================================================

//     const totalCameras = cameras?.length || 0;

//     const onlineCameras =
//         cameras?.filter((camera) => camera.status === "Online").length || 0;

//     const offlineCameras = totalCameras - onlineCameras;

//     const onlinePercentage =
//         totalCameras > 0 ? Math.round((onlineCameras / totalCameras) * 100) : 0;

//     // Alerts derived from cameras that are online and flagged.
//     // Real API may not send an "alert" flag — guard with optional chaining
//     // so this doesn't break if the field isn't present yet.
//     const alerts =
//         cameras
//             ?.filter((camera) => camera.status === "Online" && camera.alert)
//             .map((camera, index) => ({
//                 key: camera.cameraId || index,
//                 camera: camera.name,
//                 location: camera.location,
//                 issue: camera.alertMessage || "PPE Violation Detected",
//                 time: camera.alertTime || "Just now",
//                 severity: camera.alertSeverity || "Medium",
//             })) || [];

//     // ========================================================
//     // ALERT TABLE
//     // ========================================================

//     const alertColumns = [
//         {
//             title: "Camera",
//             dataIndex: "camera",
//             key: "camera",
//             render: (value) => (
//                 <Space>
//                     <div
//                         style={{
//                             width: 34,
//                             height: 34,
//                             borderRadius: 8,
//                             background: "#f0f5ff",
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                         }}
//                     >
//                         <VideoCameraOutlined style={{ color: "#1677ff" }} />
//                     </div>
//                     <Text strong>{value}</Text>
//                 </Space>
//             ),
//         },
//         {
//             title: "Location",
//             dataIndex: "location",
//             key: "location",
//             render: (value) => (
//                 <Space size={6}>
//                     <EnvironmentOutlined style={{ color: "#8c8c8c" }} />
//                     <Text>{value}</Text>
//                 </Space>
//             ),
//         },
//         {
//             title: "Detection",
//             dataIndex: "issue",
//             key: "issue",
//             render: (value) => <Text>{value}</Text>,
//         },
//         {
//             title: "Time",
//             dataIndex: "time",
//             key: "time",
//             render: (value) => <Text type="secondary">{value}</Text>,
//         },
//         {
//             title: "Severity",
//             dataIndex: "severity",
//             key: "severity",
//             render: (severity) => (
//                 <Tag color={severity === "High" ? "error" : "warning"}>{severity}</Tag>
//             ),
//         },
//     ];

//     // ========================================================
//     // CAMERA CARD
//     // ========================================================

//     const CameraCard = ({ camera, large = false }) => {
//         const isOnline = camera.status === "Online";
//         const detections = (camera.aiDetection || []).map(
//             (value) => DETECTION_LABELS[value] || value
//         );

//         return (
//             <div
//                 style={{
//                     position: "relative",
//                     width: "100%",
//                     aspectRatio: large ? "16 / 9" : "16 / 10",
//                     minHeight: large ? 180 : 150,
//                     borderRadius: 12,
//                     overflow: "hidden",
//                     background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
//                     border: "1px solid rgba(255,255,255,0.08)",
//                     boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
//                 }}
//             >
//                 {/* VIDEO AREA */}
//                 {isOnline ? (
//                     <div
//                         style={{
//                             width: "100%",
//                             height: "100%",
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             background: "radial-gradient(circle at center, #374151, #111827)",
//                             color: "#6b7280",
//                         }}
//                     >
//                         <VideoCameraOutlined style={{ fontSize: large ? 46 : 38 }} />
//                     </div>
//                 ) : (
//                     <div
//                         style={{
//                             width: "100%",
//                             height: "100%",
//                             display: "flex",
//                             flexDirection: "column",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             background: "#111827",
//                             color: "#6b7280",
//                         }}
//                     >
//                         <VideoCameraOutlined style={{ fontSize: 38, marginBottom: 8 }} />
//                         <Text style={{ color: "#9ca3af" }}>Camera Offline</Text>
//                     </div>
//                 )}

//                 {/* TOP LEFT */}
//                 <div
//                     style={{
//                         position: "absolute",
//                         top: 10,
//                         left: 10,
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 8,
//                     }}
//                 >
//                     <div
//                         style={{
//                             padding: "5px 9px",
//                             borderRadius: 6,
//                             background: "rgba(0,0,0,0.72)",
//                             color: "#fff",
//                             fontSize: 12,
//                             fontWeight: 600,
//                         }}
//                     >
//                         {camera.name}
//                     </div>

//                     {isOnline && camera.alert && (
//                         <div
//                             style={{
//                                 width: 26,
//                                 height: 26,
//                                 borderRadius: 6,
//                                 background: "rgba(220,38,38,0.9)",
//                                 display: "flex",
//                                 alignItems: "center",
//                                 justifyContent: "center",
//                             }}
//                         >
//                             <AlertOutlined style={{ color: "#fff" }} />
//                         </div>
//                     )}
//                 </div>

//                 {/* TOP RIGHT LIVE */}
//                 <div style={{ position: "absolute", top: 10, right: 10 }}>
//                     <Tag
//                         color={isOnline ? "green" : "red"}
//                         style={{ margin: 0, border: 0, fontSize: 11, fontWeight: 600 }}
//                     >
//                         {isOnline ? "LIVE" : "OFFLINE"}
//                     </Tag>
//                 </div>

//                 {/* BOTTOM BAR */}
//                 <div
//                     style={{
//                         position: "absolute",
//                         bottom: 0,
//                         left: 0,
//                         right: 0,
//                         padding: "28px 10px 10px",
//                         background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
//                     }}
//                 >
//                     <div
//                         style={{
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "space-between",
//                             gap: 8,
//                         }}
//                     >
//                         <div style={{ minWidth: 0 }}>
//                             <div
//                                 style={{
//                                     color: "#fff",
//                                     fontSize: 12,
//                                     whiteSpace: "nowrap",
//                                     overflow: "hidden",
//                                     textOverflow: "ellipsis",
//                                 }}
//                             >
//                                 {camera.location}
//                             </div>

//                             {isOnline && detections.length > 0 && (
//                                 <Space size={4} style={{ marginTop: 4 }}>
//                                     {detections.map((detection) => (
//                                         <Tag
//                                             key={detection}
//                                             color="blue"
//                                             style={{ margin: 0, fontSize: 10, lineHeight: "18px" }}
//                                         >
//                                             {detection}
//                                         </Tag>
//                                     ))}
//                                 </Space>
//                             )}
//                         </div>

//                         {isOnline && (
//                             <Button
//                                 type="text"
//                                 size="small"
//                                 icon={<EyeOutlined />}
//                                 style={{ color: "#fff", flexShrink: 0 }}
//                             />
//                         )}
//                     </div>
//                 </div>
//             </div>
//         );
//     };

//     // ========================================================
//     // DETECTION ITEM
//     // ========================================================

//     const DetectionItem = ({ icon, title, value, percent, status }) => (
//         <div style={{ padding: "14px 0", borderBottom: "1px solid #f0f0f0" }}>
//             <div
//                 style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     marginBottom: 8,
//                 }}
//             >
//                 <Space>
//                     <div
//                         style={{
//                             width: 34,
//                             height: 34,
//                             borderRadius: 8,
//                             background: "#f5f5f5",
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                         }}
//                     >
//                         {icon}
//                     </div>

//                     <div>
//                         <Text strong>{title}</Text>
//                         <div>
//                             <Text type="secondary" style={{ fontSize: 12 }}>
//                                 {value} detections
//                             </Text>
//                         </div>
//                     </div>
//                 </Space>

//                 <Text strong style={{ fontSize: 15 }}>
//                     {percent}%
//                 </Text>
//             </div>

//             <Progress percent={percent} showInfo={false} size="small" status={status} />
//         </div>
//     );

//     // ========================================================
//     // RETURN
//     // ========================================================

//     return (
//         <div
//             style={{
//                 minHeight: "100vh",
//                 width: "100%",
//                 background: "#f5f7fa",
//                 padding: isSmall ? 12 : isMobile ? 16 : 24,
//                 boxSizing: "border-box",
//             }}
//         >
//             {/* HEADER */}
//             <div
//                 style={{
//                     display: "flex",
//                     flexWrap: "wrap",
//                     alignItems: "center",
//                     justifyContent: "space-between",
//                     gap: 16,
//                     marginBottom: 24,
//                 }}
//             >
//                 <div style={{ minWidth: 0 }}>
//                     <Title level={isSmall ? 3 : 2} style={{ margin: 0, lineHeight: 1.2 }}>
//                         AI Camera Dashboard
//                     </Title>
//                     <Text type="secondary">
//                         Real-time AI monitoring, safety and PPE detection
//                     </Text>
//                 </div>

//                 <Space>
//                     <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
//                         {!isSmall && "Refresh"}
//                     </Button>

//                     <div
//                         style={{
//                             padding: "7px 12px",
//                             borderRadius: 8,
//                             background: "#f6ffed",
//                             border: "1px solid #b7eb8f",
//                         }}
//                     >
//                         <Badge
//                             status="success"
//                             text={
//                                 <Text strong style={{ color: "#389e0d", fontSize: 13 }}>
//                                     System Online
//                                 </Text>
//                             }
//                         />
//                     </div>
//                 </Space>
//             </div>

//             {/* ERROR */}
//             {error && (
//                 <Alert
//                     type="error"
//                     showIcon
//                     message="Failed to load cameras"
//                     description={error}
//                     style={{ marginBottom: 20 }}
//                 />
//             )}

//             {/* KPI CARDS */}
//             <Row gutter={[12, 12]}>
//                 <Col xs={12} sm={12} lg={6}>
//                     <Card bordered={false} style={{ borderRadius: 14, height: "100%" }}>
//                         <Statistic
//                             title="Total Cameras"
//                             value={totalCameras}
//                             prefix={<VideoCameraOutlined style={{ color: "#1677ff" }} />}
//                         />
//                         <Text type="secondary" style={{ fontSize: 12 }}>
//                             Configured cameras
//                         </Text>
//                     </Card>
//                 </Col>

//                 <Col xs={12} sm={12} lg={6}>
//                     <Card bordered={false} style={{ borderRadius: 14, height: "100%" }}>
//                         <Statistic
//                             title="Online"
//                             value={onlineCameras}
//                             prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
//                             valueStyle={{ color: "#389e0d" }}
//                         />
//                         <Progress percent={onlinePercentage} showInfo={false} size="small" />
//                     </Card>
//                 </Col>

//                 <Col xs={12} sm={12} lg={6}>
//                     <Card bordered={false} style={{ borderRadius: 14, height: "100%" }}>
//                         <Statistic
//                             title="Active Alerts"
//                             value={alerts.length}
//                             prefix={<WarningOutlined style={{ color: "#ff4d4f" }} />}
//                             valueStyle={{ color: "#cf1322" }}
//                         />
//                         <Text type="danger" style={{ fontSize: 12 }}>
//                             Requires attention
//                         </Text>
//                     </Card>
//                 </Col>

//                 <Col xs={12} sm={12} lg={6}>
//                     <Card bordered={false} style={{ borderRadius: 14, height: "100%" }}>
//                         <Statistic
//                             title="PPE Compliance"
//                             value={94.6}
//                             precision={1}
//                             suffix="%"
//                             prefix={<SafetyOutlined style={{ color: "#722ed1" }} />}
//                             valueStyle={{ color: "#722ed1" }}
//                         />
//                         <Progress percent={94.6} showInfo={false} size="small" />
//                     </Card>
//                 </Col>
//             </Row>

//             {/* LIVE MONITORING */}
//             <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
//                 {/* CAMERA GRID */}
//                 <Col xs={24} xl={16}>
//                     <Card
//                         bordered={false}
//                         style={{ borderRadius: 14 }}
//                         title={
//                             <div>
//                                 <div style={{ fontWeight: 600 }}>Live Camera Monitoring</div>
//                                 <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
//                                     Real-time surveillance feeds
//                                 </Text>
//                             </div>
//                         }
//                         extra={
//                             <Button
//                                 type="primary"
//                                 icon={<FullscreenOutlined />}
//                                 onClick={() => setAllCameraOpen(true)}
//                                 disabled={totalCameras === 0}
//                             >
//                                 {!isSmall && "View All"}
//                             </Button>
//                         }
//                     >
//                         {loading ? (
//                             <div style={{ textAlign: "center", padding: 60 }}>
//                                 <Spin size="large" />
//                             </div>
//                         ) : totalCameras === 0 ? (
//                             <Empty description="No cameras configured" />
//                         ) : (
//                             <>
//                                 <Row gutter={[12, 12]}>
//                                     {cameras.slice(0, 4).map((camera) => (
//                                         <Col key={camera.cameraId} xs={24} sm={12}>
//                                             <CameraCard camera={camera} />
//                                         </Col>
//                                     ))}
//                                 </Row>

//                                 <Divider style={{ margin: "16px 0 12px" }} />

//                                 <div
//                                     style={{
//                                         display: "flex",
//                                         flexWrap: "wrap",
//                                         gap: 12,
//                                         justifyContent: "space-between",
//                                         alignItems: "center",
//                                     }}
//                                 >
//                                     <Space wrap size={12}>
//                                         <Badge status="success" text={`${onlineCameras} Online`} />
//                                         <Badge status="error" text={`${offlineCameras} Offline`} />
//                                         <Badge status="processing" text="AI Active" />
//                                     </Space>

//                                     <Button type="link" onClick={() => setAllCameraOpen(true)}>
//                                         View all cameras →
//                                     </Button>
//                                 </div>
//                             </>
//                         )}
//                     </Card>
//                 </Col>

//                 {/* DETECTION SUMMARY */}
//                 <Col xs={24} xl={8}>
//                     <Card
//                         bordered={false}
//                         style={{ borderRadius: 14, height: "100%" }}
//                         title={
//                             <div>
//                                 <div style={{ fontWeight: 600 }}>AI Detection Summary</div>
//                                 <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
//                                     Current detection activity
//                                 </Text>
//                             </div>
//                         }
//                     >
//                         <DetectionItem
//                             icon={<UserOutlined style={{ color: "#1677ff" }} />}
//                             title="Persons"
//                             value="142"
//                             percent={82}
//                         />

//                         <DetectionItem
//                             icon={<SafetyOutlined style={{ color: "#722ed1" }} />}
//                             title="Helmet"
//                             value="136"
//                             percent={96}
//                         />

//                         <DetectionItem
//                             icon={<SafetyOutlined style={{ color: "#13c2c2" }} />}
//                             title="Safety Vest"
//                             value="130"
//                             percent={92}
//                         />

//                         <DetectionItem
//                             icon={<SafetyOutlined style={{ color: "#52c41a" }} />}
//                             title="Safety Shoes"
//                             value="126"
//                             percent={89}
//                         />

//                         <div
//                             style={{
//                                 marginTop: 16,
//                                 padding: 12,
//                                 borderRadius: 10,
//                                 background: "#f6ffed",
//                             }}
//                         >
//                             <Space>
//                                 <CheckCircleOutlined style={{ color: "#52c41a" }} />
//                                 <Text strong style={{ color: "#389e0d" }}>
//                                     Overall PPE compliance is healthy
//                                 </Text>
//                             </Space>
//                         </div>
//                     </Card>
//                 </Col>
//             </Row>

//             {/* ALERTS */}
//             <Card
//                 bordered={false}
//                 style={{ marginTop: 16, borderRadius: 14 }}
//                 title={
//                     <div>
//                         <div style={{ fontWeight: 600 }}>Recent Safety Alerts</div>
//                         <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
//                             Latest AI detected safety violations
//                         </Text>
//                     </div>
//                 }
//                 extra={
//                     <Button type="link" size="small">
//                         View All
//                     </Button>
//                 }
//             >
//                 {alerts.length === 0 ? (
//                     <Empty description="No recent alerts" />
//                 ) : (
//                     <Table
//                         columns={alertColumns}
//                         dataSource={alerts}
//                         pagination={false}
//                         size={isMobile ? "small" : "middle"}
//                         scroll={{ x: 700 }}
//                     />
//                 )}
//             </Card>

//             {/* ALL CAMERAS MODAL */}
//             <Modal
//                 open={allCameraOpen}
//                 onCancel={() => setAllCameraOpen(false)}
//                 footer={null}
//                 width={isSmall ? "calc(100vw - 16px)" : "95vw"}
//                 style={{ top: isSmall ? 8 : 20 }}
//                 styles={{
//                     body: { maxHeight: "calc(100vh - 120px)", overflowY: "auto" },
//                 }}
//                 title={
//                     <div
//                         style={{
//                             display: "flex",
//                             flexWrap: "wrap",
//                             alignItems: "center",
//                             gap: 10,
//                         }}
//                     >
//                         <VideoCameraOutlined />
//                         <span>All Live Cameras</span>
//                         <Tag color="green">{onlineCameras} Online</Tag>
//                         <Tag color="red">{offlineCameras} Offline</Tag>
//                     </div>
//                 }
//             >
//                 {totalCameras === 0 ? (
//                     <Empty description="No cameras configured" />
//                 ) : (
//                     <Row gutter={[12, 12]}>
//                         {cameras.map((camera) => (
//                             <Col key={camera.cameraId} xs={24} sm={12} md={8} lg={6}>
//                                 <CameraCard camera={camera} large />
//                             </Col>
//                         ))}
//                     </Row>
//                 )}
//             </Modal>
//         </div>
//     );
// }

// export default Dashboard;













// import { useState } from "react";

// import {
//     Card,
//     Col,
//     Row,
//     Statistic,
//     Progress,
//     Tag,
//     Table,
//     Badge,
//     Button,
//     Modal,
//     Space,
//     Typography,
//     Divider,
//     Grid,
//     Empty,
// } from "antd";

// import {
//     VideoCameraOutlined,
//     WarningOutlined,
//     CheckCircleOutlined,
//     SafetyOutlined,
//     UserOutlined,
//     EyeOutlined,
//     FireOutlined,
//     BugOutlined,
//     CarOutlined,
//     ReloadOutlined,
//     FullscreenOutlined,
//     EnvironmentOutlined,
//     AlertOutlined,
// } from "@ant-design/icons";

// const { Title, Text } = Typography;
// const { useBreakpoint } = Grid;

// // ============================================================
// // DASHBOARD
// // ============================================================

// function Dashboard() {
//     const screens = useBreakpoint();

//     const isMobile = !screens.md;
//     const isTablet = !screens.lg;
//     const isSmall = !screens.sm;

//     const [allCameraOpen, setAllCameraOpen] =
//         useState(false);

//     // ========================================================
//     // CAMERA DATA
//     // ========================================================

//     const cameras = Array.from(
//         { length: 20 },
//         (_, index) => ({
//             id: index + 1,

//             name: `Camera ${String(
//                 index + 1
//             ).padStart(2, "0")}`,

//             location:
//                 [
//                     "Production Area A",
//                     "Production Area B",
//                     "Warehouse",
//                     "Assembly Area",
//                     "Main Entrance",
//                     "Loading Bay",
//                 ][index % 6],

//             online:
//                 index !== 5 &&
//                 index !== 12,

//             detections:
//                 index % 3 === 0
//                     ? [
//                           "PPE",
//                           "Person",
//                       ]
//                     : index % 3 === 1
//                     ? ["Person"]
//                     : ["PPE"],

//             alert:
//                 index === 0 ||
//                 index === 6,
//         })
//     );

//     // ========================================================
//     // SAFETY ALERTS
//     // ========================================================

//     const alerts = [
//         {
//             key: "1",
//             camera: "Camera 01",
//             location: "Production Area A",
//             issue: "No Safety Helmet",
//             time: "2 min ago",
//             severity: "High",
//         },

//         {
//             key: "2",
//             camera: "Camera 04",
//             location: "Warehouse",
//             issue: "No Safety Vest",
//             time: "5 min ago",
//             severity: "Medium",
//         },

//         {
//             key: "3",
//             camera: "Camera 07",
//             location: "Assembly Area",
//             issue: "No Safety Shoes",
//             time: "8 min ago",
//             severity: "High",
//         },

//         {
//             key: "4",
//             camera: "Camera 11",
//             location: "Loading Bay",
//             issue: "Person Without PPE",
//             time: "12 min ago",
//             severity: "Medium",
//         },
//     ];

//     // ========================================================
//     // COUNTS
//     // ========================================================

//     const totalCameras =
//         cameras.length;

//     const onlineCameras =
//         cameras.filter(
//             (camera) =>
//                 camera.online
//         ).length;

//     const offlineCameras =
//         totalCameras -
//         onlineCameras;

//     const onlinePercentage =
//         Math.round(
//             (onlineCameras /
//                 totalCameras) *
//                 100
//         );

//     // ========================================================
//     // ALERT TABLE
//     // ========================================================

//     const alertColumns = [
//         {
//             title: "Camera",
//             dataIndex: "camera",
//             key: "camera",

//             render: (value) => (
//                 <Space>
//                     <div
//                         style={{
//                             width: 34,
//                             height: 34,
//                             borderRadius: 8,
//                             background:
//                                 "#f0f5ff",
//                             display:
//                                 "flex",
//                             alignItems:
//                                 "center",
//                             justifyContent:
//                                 "center",
//                         }}
//                     >
//                         <VideoCameraOutlined
//                             style={{
//                                 color:
//                                     "#1677ff",
//                             }}
//                         />
//                     </div>

//                     <Text strong>
//                         {value}
//                     </Text>
//                 </Space>
//             ),
//         },

//         {
//             title: "Location",
//             dataIndex: "location",
//             key: "location",

//             render: (value) => (
//                 <Space size={6}>
//                     <EnvironmentOutlined
//                         style={{
//                             color:
//                                 "#8c8c8c",
//                         }}
//                     />

//                     <Text>
//                         {value}
//                     </Text>
//                 </Space>
//             ),
//         },

//         {
//             title: "Detection",
//             dataIndex: "issue",
//             key: "issue",

//             render: (value) => (
//                 <Text>
//                     {value}
//                 </Text>
//             ),
//         },

//         {
//             title: "Time",
//             dataIndex: "time",
//             key: "time",

//             render: (value) => (
//                 <Text type="secondary">
//                     {value}
//                 </Text>
//             ),
//         },

//         {
//             title: "Severity",
//             dataIndex: "severity",
//             key: "severity",

//             render: (severity) => (
//                 <Tag
//                     color={
//                         severity ===
//                         "High"
//                             ? "error"
//                             : "warning"
//                     }
//                 >
//                     {severity}
//                 </Tag>
//             ),
//         },
//     ];

//     // ========================================================
//     // CAMERA CARD
//     // ========================================================

//     const CameraCard = ({
//         camera,
//         large = false,
//     }) => {
//         return (
//             <div
//                 style={{
//                     position:
//                         "relative",

//                     width: "100%",

//                     aspectRatio:
//                         large
//                             ? "16 / 9"
//                             : "16 / 10",

//                     minHeight:
//                         large
//                             ? 180
//                             : 150,

//                     borderRadius: 12,

//                     overflow:
//                         "hidden",

//                     background:
//                         "linear-gradient(135deg, #111827 0%, #1f2937 100%)",

//                     border:
//                         "1px solid rgba(255,255,255,0.08)",

//                     boxShadow:
//                         "0 4px 16px rgba(0,0,0,0.12)",
//                 }}
//             >
//                 {/* ==================================================
//                     VIDEO AREA
//                 =================================================== */}

//                 {camera.online ? (
//                     <div
//                         style={{
//                             width:
//                                 "100%",
//                             height:
//                                 "100%",

//                             display:
//                                 "flex",

//                             alignItems:
//                                 "center",

//                             justifyContent:
//                                 "center",

//                             background:
//                                 "radial-gradient(circle at center, #374151, #111827)",

//                             color:
//                                 "#6b7280",
//                         }}
//                     >
//                         <VideoCameraOutlined
//                             style={{
//                                 fontSize:
//                                     large
//                                         ? 46
//                                         : 38,
//                             }}
//                         />
//                     </div>
//                 ) : (
//                     <div
//                         style={{
//                             width:
//                                 "100%",
//                             height:
//                                 "100%",

//                             display:
//                                 "flex",

//                             flexDirection:
//                                 "column",

//                             alignItems:
//                                 "center",

//                             justifyContent:
//                                 "center",

//                             background:
//                                 "#111827",

//                             color:
//                                 "#6b7280",
//                         }}
//                     >
//                         <VideoCameraOutlined
//                             style={{
//                                 fontSize:
//                                     38,
//                                 marginBottom:
//                                     8,
//                             }}
//                         />

//                         <Text
//                             style={{
//                                 color:
//                                     "#9ca3af",
//                             }}
//                         >
//                             Camera Offline
//                         </Text>
//                     </div>
//                 )}

//                 {/* ==================================================
//                     TOP LEFT
//                 =================================================== */}

//                 <div
//                     style={{
//                         position:
//                             "absolute",

//                         top: 10,
//                         left: 10,

//                         display:
//                             "flex",

//                         alignItems:
//                             "center",

//                         gap: 8,
//                     }}
//                 >
//                     <div
//                         style={{
//                             padding:
//                                 "5px 9px",

//                             borderRadius:
//                                 6,

//                             background:
//                                 "rgba(0,0,0,0.72)",

//                             color:
//                                 "#fff",

//                             fontSize:
//                                 12,

//                             fontWeight:
//                                 600,
//                         }}
//                     >
//                         {camera.name}
//                     </div>

//                     {camera.online &&
//                         camera.alert && (
//                             <div
//                                 style={{
//                                     width:
//                                         26,
//                                     height:
//                                         26,
//                                     borderRadius:
//                                         6,
//                                     background:
//                                         "rgba(220,38,38,0.9)",
//                                     display:
//                                         "flex",
//                                     alignItems:
//                                         "center",
//                                     justifyContent:
//                                         "center",
//                                 }}
//                             >
//                                 <AlertOutlined
//                                     style={{
//                                         color:
//                                             "#fff",
//                                     }}
//                                 />
//                             </div>
//                         )}
//                 </div>

//                 {/* ==================================================
//                     TOP RIGHT LIVE
//                 =================================================== */}

//                 <div
//                     style={{
//                         position:
//                             "absolute",

//                         top: 10,
//                         right: 10,
//                     }}
//                 >
//                     <Tag
//                         color={
//                             camera.online
//                                 ? "green"
//                                 : "red"
//                         }
//                         style={{
//                             margin: 0,
//                             border: 0,
//                             fontSize: 11,
//                             fontWeight: 600,
//                         }}
//                     >
//                         {camera.online
//                             ? "LIVE"
//                             : "OFFLINE"}
//                     </Tag>
//                 </div>

//                 {/* ==================================================
//                     BOTTOM BAR
//                 =================================================== */}

//                 <div
//                     style={{
//                         position:
//                             "absolute",

//                         bottom: 0,
//                         left: 0,
//                         right: 0,

//                         padding:
//                             "28px 10px 10px",

//                         background:
//                             "linear-gradient(transparent, rgba(0,0,0,0.85))",
//                     }}
//                 >
//                     <div
//                         style={{
//                             display:
//                                 "flex",

//                             alignItems:
//                                 "center",

//                             justifyContent:
//                                 "space-between",

//                             gap: 8,
//                         }}
//                     >
//                         <div
//                             style={{
//                                 minWidth:
//                                     0,
//                             }}
//                         >
//                             <div
//                                 style={{
//                                     color:
//                                         "#fff",

//                                     fontSize:
//                                         12,

//                                     whiteSpace:
//                                         "nowrap",

//                                     overflow:
//                                         "hidden",

//                                     textOverflow:
//                                         "ellipsis",
//                                 }}
//                             >
//                                 {camera.location}
//                             </div>

//                             {camera.online && (
//                                 <Space
//                                     size={4}
//                                     style={{
//                                         marginTop:
//                                             4,
//                                     }}
//                                 >
//                                     {camera.detections.map(
//                                         (
//                                             detection
//                                         ) => (
//                                             <Tag
//                                                 key={
//                                                     detection
//                                                 }
//                                                 color="blue"
//                                                 style={{
//                                                     margin: 0,
//                                                     fontSize:
//                                                         10,
//                                                     lineHeight:
//                                                         "18px",
//                                                 }}
//                                             >
//                                                 {
//                                                     detection
//                                                 }
//                                             </Tag>
//                                         )
//                                     )}
//                                 </Space>
//                             )}
//                         </div>

//                         {camera.online && (
//                             <Button
//                                 type="text"
//                                 size="small"
//                                 icon={
//                                     <EyeOutlined />
//                                 }
//                                 style={{
//                                     color:
//                                         "#fff",
//                                     flexShrink:
//                                         0,
//                                 }}
//                             />
//                         )}
//                     </div>
//                 </div>
//             </div>
//         );
//     };

//     // ========================================================
//     // DETECTION ITEM
//     // ========================================================

//     const DetectionItem = ({
//         icon,
//         title,
//         value,
//         percent,
//         status,
//     }) => (
//         <div
//             style={{
//                 padding:
//                     "14px 0",

//                 borderBottom:
//                     "1px solid #f0f0f0",
//             }}
//         >
//             <div
//                 style={{
//                     display:
//                         "flex",

//                     justifyContent:
//                         "space-between",

//                     alignItems:
//                         "center",

//                     marginBottom:
//                         8,
//                 }}
//             >
//                 <Space>
//                     <div
//                         style={{
//                             width: 34,
//                             height: 34,
//                             borderRadius: 8,
//                             background:
//                                 "#f5f5f5",
//                             display:
//                                 "flex",
//                             alignItems:
//                                 "center",
//                             justifyContent:
//                                 "center",
//                         }}
//                     >
//                         {icon}
//                     </div>

//                     <div>
//                         <Text strong>
//                             {title}
//                         </Text>

//                         <div>
//                             <Text
//                                 type="secondary"
//                                 style={{
//                                     fontSize:
//                                         12,
//                                 }}
//                             >
//                                 {value} detections
//                             </Text>
//                         </div>
//                     </div>
//                 </Space>

//                 <Text
//                     strong
//                     style={{
//                         fontSize:
//                             15,
//                     }}
//                 >
//                     {percent}%
//                 </Text>
//             </div>

//             <Progress
//                 percent={percent}
//                 showInfo={false}
//                 size="small"
//                 status={status}
//             />
//         </div>
//     );

//     // ========================================================
//     // RETURN
//     // ========================================================

//     return (
//         <div
//             style={{
//                 minHeight:
//                     "100vh",

//                 width: "100%",

//                 background:
//                     "#f5f7fa",

//                 padding: isSmall
//                     ? 12
//                     : isMobile
//                     ? 16
//                     : 24,

//                 boxSizing:
//                     "border-box",
//             }}
//         >
//             {/* ==================================================
//                 HEADER
//             =================================================== */}

//             <div
//                 style={{
//                     display:
//                         "flex",

//                     flexWrap:
//                         "wrap",

//                     alignItems:
//                         "center",

//                     justifyContent:
//                         "space-between",

//                     gap: 16,

//                     marginBottom:
//                         24,
//                 }}
//             >
//                 <div
//                     style={{
//                         minWidth:
//                             0,
//                     }}
//                 >
//                     <Title
//                         level={
//                             isSmall
//                                 ? 3
//                                 : 2
//                         }
//                         style={{
//                             margin: 0,
//                             lineHeight:
//                                 1.2,
//                         }}
//                     >
//                         AI Camera Dashboard
//                     </Title>

//                     <Text
//                         type="secondary"
//                     >
//                         Real-time AI monitoring,
//                         safety and PPE detection
//                     </Text>
//                 </div>

//                 <div
//                     style={{
//                         padding:
//                             "7px 12px",

//                         borderRadius:
//                             8,

//                         background:
//                             "#f6ffed",

//                         border:
//                             "1px solid #b7eb8f",
//                     }}
//                 >
//                     <Badge
//                         status="success"
//                         text={
//                             <Text
//                                 strong
//                                 style={{
//                                     color:
//                                         "#389e0d",
//                                     fontSize:
//                                         13,
//                                 }}
//                             >
//                                 System Online
//                             </Text>
//                         }
//                     />
//                 </div>
//             </div>

//             {/* ==================================================
//                 KPI CARDS
//             =================================================== */}

//             <Row
//                 gutter={[
//                     12,
//                     12,
//                 ]}
//             >
//                 {/* TOTAL */}

//                 <Col
//                     xs={12}
//                     sm={12}
//                     lg={6}
//                 >
//                     <Card
//                         bordered={false}
//                         style={{
//                             borderRadius:
//                                 14,
//                             height:
//                                 "100%",
//                         }}
//                     >
//                         <Statistic
//                             title="Total Cameras"
//                             value={
//                                 totalCameras
//                             }
//                             prefix={
//                                 <VideoCameraOutlined
//                                     style={{
//                                         color:
//                                             "#1677ff",
//                                     }}
//                                 />
//                             }
//                         />

//                         <Text
//                             type="secondary"
//                             style={{
//                                 fontSize:
//                                     12,
//                             }}
//                         >
//                             Configured cameras
//                         </Text>
//                     </Card>
//                 </Col>

//                 {/* ONLINE */}

//                 <Col
//                     xs={12}
//                     sm={12}
//                     lg={6}
//                 >
//                     <Card
//                         bordered={false}
//                         style={{
//                             borderRadius:
//                                 14,
//                             height:
//                                 "100%",
//                         }}
//                     >
//                         <Statistic
//                             title="Online"
//                             value={
//                                 onlineCameras
//                             }
//                             prefix={
//                                 <CheckCircleOutlined
//                                     style={{
//                                         color:
//                                             "#52c41a",
//                                     }}
//                                 />
//                             }
//                             valueStyle={{
//                                 color:
//                                     "#389e0d",
//                             }}
//                         />

//                         <Progress
//                             percent={
//                                 onlinePercentage
//                             }
//                             showInfo={
//                                 false
//                             }
//                             size="small"
//                         />
//                     </Card>
//                 </Col>

//                 {/* ALERTS */}

//                 <Col
//                     xs={12}
//                     sm={12}
//                     lg={6}
//                 >
//                     <Card
//                         bordered={false}
//                         style={{
//                             borderRadius:
//                                 14,
//                             height:
//                                 "100%",
//                         }}
//                     >
//                         <Statistic
//                             title="Active Alerts"
//                             value={6}
//                             prefix={
//                                 <WarningOutlined
//                                     style={{
//                                         color:
//                                             "#ff4d4f",
//                                     }}
//                                 />
//                             }
//                             valueStyle={{
//                                 color:
//                                     "#cf1322",
//                             }}
//                         />

//                         <Text
//                             type="danger"
//                             style={{
//                                 fontSize:
//                                     12,
//                             }}
//                         >
//                             Requires attention
//                         </Text>
//                     </Card>
//                 </Col>

//                 {/* PPE */}

//                 <Col
//                     xs={12}
//                     sm={12}
//                     lg={6}
//                 >
//                     <Card
//                         bordered={false}
//                         style={{
//                             borderRadius:
//                                 14,
//                             height:
//                                 "100%",
//                         }}
//                     >
//                         <Statistic
//                             title="PPE Compliance"
//                             value={94.6}
//                             precision={
//                                 1
//                             }
//                             suffix="%"
//                             prefix={
//                                 <SafetyOutlined
//                                     style={{
//                                         color:
//                                             "#722ed1",
//                                     }}
//                                 />
//                             }
//                             valueStyle={{
//                                 color:
//                                     "#722ed1",
//                             }}
//                         />

//                         <Progress
//                             percent={
//                                 94.6
//                             }
//                             showInfo={
//                                 false
//                             }
//                             size="small"
//                         />
//                     </Card>
//                 </Col>
//             </Row>

//             {/* ==================================================
//                 LIVE MONITORING
//             =================================================== */}

//             <Row
//                 gutter={[
//                     16,
//                     16,
//                 ]}
//                 style={{
//                     marginTop:
//                         16,
//                 }}
//             >
//                 {/* ==================================================
//                     CAMERA GRID
//                 =================================================== */}

//                 <Col
//                     xs={24}
//                     xl={16}
//                 >
//                     <Card
//                         bordered={false}
//                         style={{
//                             borderRadius:
//                                 14,
//                         }}
//                         title={
//                             <div>
//                                 <div
//                                     style={{
//                                         fontWeight:
//                                             600,
//                                     }}
//                                 >
//                                     Live Camera Monitoring
//                                 </div>

//                                 <Text
//                                     type="secondary"
//                                     style={{
//                                         fontSize:
//                                             12,
//                                         fontWeight:
//                                             400,
//                                     }}
//                                 >
//                                     Real-time surveillance feeds
//                                 </Text>
//                             </div>
//                         }
//                         extra={
//                             <Button
//                                 type="primary"
//                                 icon={
//                                     <FullscreenOutlined />
//                                 }
//                                 onClick={() =>
//                                     setAllCameraOpen(
//                                         true
//                                     )
//                                 }
//                             >
//                                 {!isSmall &&
//                                     "View All"}
//                             </Button>
//                         }
//                     >
//                         <Row
//                             gutter={[
//                                 12,
//                                 12,
//                             ]}
//                         >
//                             {cameras
//                                 .slice(
//                                     0,
//                                     4
//                                 )
//                                 .map(
//                                     (
//                                         camera
//                                     ) => (
//                                         <Col
//                                             key={
//                                                 camera.id
//                                             }
//                                             xs={
//                                                 24
//                                             }
//                                             sm={
//                                                 12
//                                             }
//                                         >
//                                             <CameraCard
//                                                 camera={
//                                                     camera
//                                                 }
//                                             />
//                                         </Col>
//                                     )
//                                 )}
//                         </Row>

//                         <Divider
//                             style={{
//                                 margin:
//                                     "16px 0 12px",
//                             }}
//                         />

//                         <div
//                             style={{
//                                 display:
//                                     "flex",

//                                 flexWrap:
//                                     "wrap",

//                                 gap: 12,

//                                 justifyContent:
//                                     "space-between",

//                                 alignItems:
//                                     "center",
//                             }}
//                         >
//                             <Space
//                                 wrap
//                                 size={
//                                     12
//                                 }
//                             >
//                                 <Badge
//                                     status="success"
//                                     text={`${onlineCameras} Online`}
//                                 />

//                                 <Badge
//                                     status="error"
//                                     text={`${offlineCameras} Offline`}
//                                 />

//                                 <Badge
//                                     status="processing"
//                                     text="AI Active"
//                                 />
//                             </Space>

//                             <Button
//                                 type="link"
//                                 onClick={() =>
//                                     setAllCameraOpen(
//                                         true
//                                     )
//                                 }
//                             >
//                                 View all cameras →
//                             </Button>
//                         </div>
//                     </Card>
//                 </Col>

//                 {/* ==================================================
//                     DETECTION SUMMARY
//                 =================================================== */}

//                 <Col
//                     xs={24}
//                     xl={8}
//                 >
//                     <Card
//                         bordered={false}
//                         style={{
//                             borderRadius:
//                                 14,
//                             height:
//                                 "100%",
//                         }}
//                         title={
//                             <div>
//                                 <div
//                                     style={{
//                                         fontWeight:
//                                             600,
//                                     }}
//                                 >
//                                     AI Detection Summary
//                                 </div>

//                                 <Text
//                                     type="secondary"
//                                     style={{
//                                         fontSize:
//                                             12,
//                                         fontWeight:
//                                             400,
//                                     }}
//                                 >
//                                     Current detection activity
//                                 </Text>
//                             </div>
//                         }
//                     >
//                         <DetectionItem
//                             icon={
//                                 <UserOutlined
//                                     style={{
//                                         color:
//                                             "#1677ff",
//                                     }}
//                                 />
//                             }
//                             title="Persons"
//                             value="142"
//                             percent={82}
//                         />

//                         <DetectionItem
//                             icon={
//                                 <SafetyOutlined
//                                     style={{
//                                         color:
//                                             "#722ed1",
//                                     }}
//                                 />
//                             }
//                             title="Helmet"
//                             value="136"
//                             percent={96}
//                         />

//                         <DetectionItem
//                             icon={
//                                 <SafetyOutlined
//                                     style={{
//                                         color:
//                                             "#13c2c2",
//                                     }}
//                                 />
//                             }
//                             title="Safety Vest"
//                             value="130"
//                             percent={92}
//                         />

//                         <DetectionItem
//                             icon={
//                                 <SafetyOutlined
//                                     style={{
//                                         color:
//                                             "#52c41a",
//                                     }}
//                                 />
//                             }
//                             title="Safety Shoes"
//                             value="126"
//                             percent={89}
//                         />

//                         <div
//                             style={{
//                                 marginTop:
//                                     16,

//                                 padding:
//                                     12,

//                                 borderRadius:
//                                     10,

//                                 background:
//                                     "#f6ffed",
//                             }}
//                         >
//                             <Space>
//                                 <CheckCircleOutlined
//                                     style={{
//                                         color:
//                                             "#52c41a",
//                                     }}
//                                 />

//                                 <Text
//                                     strong
//                                     style={{
//                                         color:
//                                             "#389e0d",
//                                     }}
//                                 >
//                                     Overall PPE compliance
//                                     is healthy
//                                 </Text>
//                             </Space>
//                         </div>
//                     </Card>
//                 </Col>
//             </Row>

//             {/* ==================================================
//                 ALERTS
//             =================================================== */}

//             <Card
//                 bordered={false}
//                 style={{
//                     marginTop:
//                         16,
//                     borderRadius:
//                         14,
//                 }}
//                 title={
//                     <div>
//                         <div
//                             style={{
//                                 fontWeight:
//                                     600,
//                             }}
//                         >
//                             Recent Safety Alerts
//                         </div>

//                         <Text
//                             type="secondary"
//                             style={{
//                                 fontSize:
//                                     12,
//                                 fontWeight:
//                                     400,
//                             }}
//                         >
//                             Latest AI detected safety violations
//                         </Text>
//                     </div>
//                 }
//                 extra={
//                     <Button
//                         type="link"
//                         size="small"
//                     >
//                         View All
//                     </Button>
//                 }
//             >
//                 <Table
//                     columns={
//                         alertColumns
//                     }
//                     dataSource={
//                         alerts
//                     }
//                     pagination={
//                         false
//                     }
//                     size={
//                         isMobile
//                             ? "small"
//                             : "middle"
//                     }
//                     scroll={{
//                         x: 700,
//                     }}
//                 />
//             </Card>

//             {/* ==================================================
//                 ALL CAMERAS MODAL
//             =================================================== */}

//             <Modal
//                 open={
//                     allCameraOpen
//                 }
//                 onCancel={() =>
//                     setAllCameraOpen(
//                         false
//                     )
//                 }
//                 footer={null}
//                 width={
//                     isSmall
//                         ? "calc(100vw - 16px)"
//                         : "95vw"
//                 }
//                 style={{
//                     top: isSmall
//                         ? 8
//                         : 20,
//                 }}
//                 styles={{
//                     body: {
//                         maxHeight:
//                             "calc(100vh - 120px)",
//                         overflowY:
//                             "auto",
//                     },
//                 }}
//                 title={
//                     <div
//                         style={{
//                             display:
//                                 "flex",

//                             flexWrap:
//                                 "wrap",

//                             alignItems:
//                                 "center",

//                             gap: 10,
//                         }}
//                     >
//                         <VideoCameraOutlined />

//                         <span>
//                             All Live Cameras
//                         </span>

//                         <Tag
//                             color="green"
//                         >
//                             {onlineCameras}{" "}
//                             Online
//                         </Tag>

//                         <Tag
//                             color="red"
//                         >
//                             {offlineCameras}{" "}
//                             Offline
//                         </Tag>
//                     </div>
//                 }
//             >
//                 <Row
//                     gutter={[
//                         12,
//                         12,
//                     ]}
//                 >
//                     {cameras.map(
//                         (
//                             camera
//                         ) => (
//                             <Col
//                                 key={
//                                     camera.id
//                                 }
//                                 xs={
//                                     24
//                                 }
//                                 sm={
//                                     12
//                                 }
//                                 md={
//                                     8
//                                 }
//                                 lg={
//                                     6
//                                 }
//                             >
//                                 <CameraCard
//                                     camera={
//                                         camera
//                                     }
//                                     large
//                                 />
//                             </Col>
//                         )
//                     )}
//                 </Row>
//             </Modal>
//         </div>
//     );
// }

// export default Dashboard;

























// // import { useState } from "react";

// // import {
// //     Card,
// //     Col,
// //     Row,
// //     Statistic,
// //     Progress,
// //     Tag,
// //     Table,
// //     Badge,
// //     Button,
// //     Modal,
// // } from "antd";

// // import {
// //     VideoCameraOutlined,
// //     WarningOutlined,
// //     CheckCircleOutlined,
// //     SafetyOutlined,
// //     UserOutlined,
// //     EyeOutlined,
// // } from "@ant-design/icons";

// // function Dashboard() {
// //     const [allCameraOpen, setAllCameraOpen] = useState(false);

// //     // Camera list
// //     const cameras = Array.from({ length: 20 }, (_, index) => ({
// //         id: index + 1,
// //         name: `Camera ${String(index + 1).padStart(2, "0")}`,
// //         location: `Area ${index + 1}`,
// //         online: index !== 5 && index !== 12,
// //     }));

// //     // Safety alerts
// //     const alerts = [
// //         {
// //             key: "1",
// //             camera: "Camera 01",
// //             location: "Production Area A",
// //             issue: "No Safety Helmet",
// //             time: "2 min ago",
// //             severity: "High",
// //         },
// //         {
// //             key: "2",
// //             camera: "Camera 04",
// //             location: "Warehouse",
// //             issue: "No Safety Vest",
// //             time: "5 min ago",
// //             severity: "Medium",
// //         },
// //         {
// //             key: "3",
// //             camera: "Camera 07",
// //             location: "Assembly Area",
// //             issue: "No Safety Shoes",
// //             time: "8 min ago",
// //             severity: "High",
// //         },
// //     ];

// //     // Alert table columns
// //     const columns = [
// //         {
// //             title: "Camera",
// //             dataIndex: "camera",
// //         },
// //         {
// //             title: "Location",
// //             dataIndex: "location",
// //         },
// //         {
// //             title: "Detection",
// //             dataIndex: "issue",
// //         },
// //         {
// //             title: "Time",
// //             dataIndex: "time",
// //         },
// //         {
// //             title: "Severity",
// //             dataIndex: "severity",
// //             render: (severity) => (
// //                 <Tag color={severity === "High" ? "red" : "orange"}>
// //                     {severity}
// //                 </Tag>
// //             ),
// //         },
// //     ];

// //     return (
// //         <div
// //             style={{
// //                 padding: "24px",
// //                 background: "#f5f7fa",
// //                 minHeight: "100vh",
// //             }}
// //         >
// //             {/* =====================================================
// //                 HEADER
// //             ====================================================== */}

// //             <div
// //                 style={{
// //                     display: "flex",
// //                     justifyContent: "space-between",
// //                     alignItems: "center",
// //                     marginBottom: "24px",
// //                 }}
// //             >
// //                 <div>
// //                     <h1
// //                         style={{
// //                             margin: 0,
// //                             fontSize: "28px",
// //                             fontWeight: 700,
// //                         }}
// //                     >
// //                         AI Camera Dashboard
// //                     </h1>

// //                     <p
// //                         style={{
// //                             marginTop: "6px",
// //                             color: "#6b7280",
// //                         }}
// //                     >
// //                         Real-time AI monitoring & PPE detection
// //                     </p>
// //                 </div>

// //                 <Badge
// //                     status="success"
// //                     text="System Online"
// //                 />
// //             </div>

// //             {/* =====================================================
// //                 STATISTICS
// //             ====================================================== */}

// //             <Row gutter={[20, 20]}>

// //                 {/* Total Cameras */}

// //                 <Col xs={24} sm={12} lg={6}>
// //                     <Card
// //                         bordered={false}
// //                         style={{
// //                             borderRadius: "12px",
// //                             boxShadow:
// //                                 "0 2px 10px rgba(0,0,0,0.05)",
// //                         }}
// //                     >
// //                         <Statistic
// //                             title="Total Cameras"
// //                             value={20}
// //                             prefix={
// //                                 <VideoCameraOutlined
// //                                     style={{
// //                                         color: "#1677ff",
// //                                     }}
// //                                 />
// //                             }
// //                         />

// //                         <div
// //                             style={{
// //                                 marginTop: "12px",
// //                                 color: "#6b7280",
// //                                 fontSize: "13px",
// //                             }}
// //                         >
// //                             20 cameras configured
// //                         </div>
// //                     </Card>
// //                 </Col>

// //                 {/* Online Cameras */}

// //                 <Col xs={24} sm={12} lg={6}>
// //                     <Card
// //                         bordered={false}
// //                         style={{
// //                             borderRadius: "12px",
// //                             boxShadow:
// //                                 "0 2px 10px rgba(0,0,0,0.05)",
// //                         }}
// //                     >
// //                         <Statistic
// //                             title="Online Cameras"
// //                             value={
// //                                 cameras.filter(
// //                                     (camera) => camera.online
// //                                 ).length
// //                             }
// //                             prefix={
// //                                 <CheckCircleOutlined
// //                                     style={{
// //                                         color: "#16a34a",
// //                                     }}
// //                                 />
// //                             }
// //                             valueStyle={{
// //                                 color: "#16a34a",
// //                             }}
// //                         />

// //                         <Progress
// //                             percent={
// //                                 (cameras.filter(
// //                                     (camera) => camera.online
// //                                 ).length /
// //                                     cameras.length) *
// //                                 100
// //                             }
// //                             size="small"
// //                             showInfo={false}
// //                             style={{
// //                                 marginTop: "8px",
// //                             }}
// //                         />
// //                     </Card>
// //                 </Col>

// //                 {/* Alerts */}

// //                 <Col xs={24} sm={12} lg={6}>
// //                     <Card
// //                         bordered={false}
// //                         style={{
// //                             borderRadius: "12px",
// //                             boxShadow:
// //                                 "0 2px 10px rgba(0,0,0,0.05)",
// //                         }}
// //                     >
// //                         <Statistic
// //                             title="Active Alerts"
// //                             value={6}
// //                             prefix={
// //                                 <WarningOutlined
// //                                     style={{
// //                                         color: "#dc2626",
// //                                     }}
// //                                 />
// //                             }
// //                             valueStyle={{
// //                                 color: "#dc2626",
// //                             }}
// //                         />

// //                         <div
// //                             style={{
// //                                 marginTop: "12px",
// //                                 color: "#dc2626",
// //                                 fontSize: "13px",
// //                             }}
// //                         >
// //                             Requires attention
// //                         </div>
// //                     </Card>
// //                 </Col>

// //                 {/* PPE Compliance */}

// //                 <Col xs={24} sm={12} lg={6}>
// //                     <Card
// //                         bordered={false}
// //                         style={{
// //                             borderRadius: "12px",
// //                             boxShadow:
// //                                 "0 2px 10px rgba(0,0,0,0.05)",
// //                         }}
// //                     >
// //                         <Statistic
// //                             title="PPE Compliance"
// //                             value={94.6}
// //                             suffix="%"
// //                             prefix={
// //                                 <SafetyOutlined
// //                                     style={{
// //                                         color: "#7c3aed",
// //                                     }}
// //                                 />
// //                             }
// //                             valueStyle={{
// //                                 color: "#7c3aed",
// //                             }}
// //                         />

// //                         <Progress
// //                             percent={94.6}
// //                             size="small"
// //                             showInfo={false}
// //                             style={{
// //                                 marginTop: "8px",
// //                             }}
// //                         />
// //                     </Card>
// //                 </Col>
// //             </Row>

// //             {/* =====================================================
// //                 LIVE CAMERA SECTION
// //             ====================================================== */}

// //             <Row
// //                 gutter={[20, 20]}
// //                 style={{
// //                     marginTop: "20px",
// //                 }}
// //             >
// //                 <Col xs={24} lg={16}>
// //                     <Card
// //                         title="Live Camera Monitoring"
// //                         extra={
// //                             <div
// //                                 style={{
// //                                     display: "flex",
// //                                     gap: "8px",
// //                                     alignItems: "center",
// //                                 }}
// //                             >
// //                                 <Tag color="green">
// //                                     LIVE
// //                                 </Tag>

// //                                 <Button
// //                                     type="primary"
// //                                     size="small"
// //                                     onClick={() =>
// //                                         setAllCameraOpen(true)
// //                                     }
// //                                 >
// //                                     View All Cameras
// //                                 </Button>
// //                             </div>
// //                         }
// //                         bordered={false}
// //                         style={{
// //                             borderRadius: "12px",
// //                             boxShadow:
// //                                 "0 2px 10px rgba(0,0,0,0.05)",
// //                         }}
// //                     >
// //                         <Row gutter={[12, 12]}>
// //                             {/* Show first 4 cameras */}

// //                             {cameras
// //                                 .slice(0, 4)
// //                                 .map((camera) => (
// //                                     <Col
// //                                         xs={24}
// //                                         sm={12}
// //                                         key={camera.id}
// //                                     >
// //                                         <div
// //                                             style={{
// //                                                 height: "180px",
// //                                                 background:
// //                                                     "linear-gradient(135deg,#111827,#374151)",
// //                                                 borderRadius:
// //                                                     "10px",
// //                                                 position:
// //                                                     "relative",
// //                                                 overflow:
// //                                                     "hidden",
// //                                                 display:
// //                                                     "flex",
// //                                                 alignItems:
// //                                                     "center",
// //                                                 justifyContent:
// //                                                     "center",
// //                                                 color: "#9ca3af",
// //                                             }}
// //                                         >
// //                                             <VideoCameraOutlined
// //                                                 style={{
// //                                                     fontSize:
// //                                                         "40px",
// //                                                 }}
// //                                             />

// //                                             {/* Camera Name */}

// //                                             <div
// //                                                 style={{
// //                                                     position:
// //                                                         "absolute",
// //                                                     top: "10px",
// //                                                     left: "10px",
// //                                                     background:
// //                                                         "rgba(0,0,0,0.65)",
// //                                                     color: "#fff",
// //                                                     padding:
// //                                                         "4px 8px",
// //                                                     borderRadius:
// //                                                         "5px",
// //                                                     fontSize:
// //                                                         "12px",
// //                                                 }}
// //                                             >
// //                                                 {camera.name}
// //                                             </div>

// //                                             {/* Online Status */}

// //                                             <div
// //                                                 style={{
// //                                                     position:
// //                                                         "absolute",
// //                                                     bottom:
// //                                                         "10px",
// //                                                     left: "10px",
// //                                                 }}
// //                                             >
// //                                                 <Badge
// //                                                     status={
// //                                                         camera.online
// //                                                             ? "success"
// //                                                             : "error"
// //                                                     }
// //                                                     text={
// //                                                         <span
// //                                                             style={{
// //                                                                 color:
// //                                                                     "#fff",
// //                                                             }}
// //                                                         >
// //                                                             {camera.online
// //                                                                 ? "Online"
// //                                                                 : "Offline"}
// //                                                         </span>
// //                                                     }
// //                                                 />
// //                                             </div>

// //                                             {/* Eye */}

// //                                             <EyeOutlined
// //                                                 style={{
// //                                                     position:
// //                                                         "absolute",
// //                                                     right: "12px",
// //                                                     bottom: "12px",
// //                                                     color: "#fff",
// //                                                     fontSize:
// //                                                         "18px",
// //                                                 }}
// //                                             />
// //                                         </div>
// //                                     </Col>
// //                                 ))}
// //                         </Row>
// //                     </Card>
// //                 </Col>

// //                 {/* =================================================
// //                     DETECTION SUMMARY
// //                 ================================================== */}

// //                 <Col xs={24} lg={8}>
// //                     <Card
// //                         title="Detection Summary"
// //                         bordered={false}
// //                         style={{
// //                             borderRadius: "12px",
// //                             height: "100%",
// //                             boxShadow:
// //                                 "0 2px 10px rgba(0,0,0,0.05)",
// //                         }}
// //                     >
// //                         {/* Persons */}

// //                         <div
// //                             style={{
// //                                 marginBottom: "22px",
// //                             }}
// //                         >
// //                             <div
// //                                 style={{
// //                                     display: "flex",
// //                                     justifyContent:
// //                                         "space-between",
// //                                     marginBottom: "8px",
// //                                 }}
// //                             >
// //                                 <span>
// //                                     <UserOutlined />{" "}
// //                                     Persons Detected
// //                                 </span>

// //                                 <strong>142</strong>
// //                             </div>

// //                             <Progress
// //                                 percent={82}
// //                                 showInfo={false}
// //                             />
// //                         </div>

// //                         {/* Helmet */}

// //                         <div
// //                             style={{
// //                                 marginBottom: "22px",
// //                             }}
// //                         >
// //                             <div
// //                                 style={{
// //                                     display: "flex",
// //                                     justifyContent:
// //                                         "space-between",
// //                                     marginBottom: "8px",
// //                                 }}
// //                             >
// //                                 <span>
// //                                     <SafetyOutlined />{" "}
// //                                     Helmet
// //                                 </span>

// //                                 <strong>96%</strong>
// //                             </div>

// //                             <Progress
// //                                 percent={96}
// //                                 showInfo={false}
// //                             />
// //                         </div>

// //                         {/* Vest */}

// //                         <div
// //                             style={{
// //                                 marginBottom: "22px",
// //                             }}
// //                         >
// //                             <div
// //                                 style={{
// //                                     display: "flex",
// //                                     justifyContent:
// //                                         "space-between",
// //                                     marginBottom: "8px",
// //                                 }}
// //                             >
// //                                 <span>
// //                                     Safety Vest
// //                                 </span>

// //                                 <strong>92%</strong>
// //                             </div>

// //                             <Progress
// //                                 percent={92}
// //                                 showInfo={false}
// //                             />
// //                         </div>

// //                         {/* Shoes */}

// //                         <div>
// //                             <div
// //                                 style={{
// //                                     display: "flex",
// //                                     justifyContent:
// //                                         "space-between",
// //                                     marginBottom: "8px",
// //                                 }}
// //                             >
// //                                 <span>
// //                                     Safety Shoes
// //                                 </span>

// //                                 <strong>89%</strong>
// //                             </div>

// //                             <Progress
// //                                 percent={89}
// //                                 showInfo={false}
// //                             />
// //                         </div>
// //                     </Card>
// //                 </Col>
// //             </Row>

// //             {/* =====================================================
// //                 RECENT ALERTS
// //             ====================================================== */}

// //             <Card
// //                 title="Recent Safety Alerts"
// //                 extra={
// //                     <a href="#">
// //                         View All
// //                     </a>
// //                 }
// //                 bordered={false}
// //                 style={{
// //                     marginTop: "20px",
// //                     borderRadius: "12px",
// //                     boxShadow:
// //                         "0 2px 10px rgba(0,0,0,0.05)",
// //                 }}
// //             >
// //                 <Table
// //                     columns={columns}
// //                     dataSource={alerts}
// //                     pagination={false}
// //                 />
// //             </Card>

// //             {/* =====================================================
// //                 ALL CAMERA MODAL
// //             ====================================================== */}

// //             <Modal
// //                 title={
// //                     <div
// //                         style={{
// //                             display: "flex",
// //                             alignItems: "center",
// //                             gap: "10px",
// //                         }}
// //                     >
// //                         <VideoCameraOutlined />

// //                         <span>
// //                             All Live Cameras
// //                         </span>

// //                         <Tag color="green">
// //                             {cameras.filter(
// //                                 (camera) =>
// //                                     camera.online
// //                             ).length}{" "}
// //                             Online
// //                         </Tag>
// //                     </div>
// //                 }
// //                 open={allCameraOpen}
// //                 onCancel={() =>
// //                     setAllCameraOpen(false)
// //                 }
// //                 footer={null}
// //                 width="95%"
// //                 style={{
// //                     top: 20,
// //                 }}
// //             >
// //                 <Row gutter={[12, 12]}>
// //                     {cameras.map((camera) => (
// //                         <Col
// //                             key={camera.id}
// //                             xs={24}
// //                             sm={12}
// //                             md={8}
// //                             lg={6}
// //                         >
// //                             <div
// //                                 style={{
// //                                     height: "180px",
// //                                     background:
// //                                         camera.online
// //                                             ? "linear-gradient(135deg,#111827,#374151)"
// //                                             : "#1f2937",
// //                                     borderRadius: "10px",
// //                                     position:
// //                                         "relative",
// //                                     overflow:
// //                                         "hidden",
// //                                     display:
// //                                         "flex",
// //                                     alignItems:
// //                                         "center",
// //                                     justifyContent:
// //                                         "center",
// //                                     color:
// //                                         "#9ca3af",
// //                                 }}
// //                             >
// //                                 {/* Camera Icon */}

// //                                 <VideoCameraOutlined
// //                                     style={{
// //                                         fontSize:
// //                                             "38px",
// //                                     }}
// //                                 />

// //                                 {/* Camera Name */}

// //                                 <div
// //                                     style={{
// //                                         position:
// //                                             "absolute",
// //                                         top: "8px",
// //                                         left: "8px",
// //                                         background:
// //                                             "rgba(0,0,0,0.7)",
// //                                         color: "#fff",
// //                                         padding:
// //                                             "4px 8px",
// //                                         borderRadius:
// //                                             "5px",
// //                                         fontSize:
// //                                             "12px",
// //                                         fontWeight:
// //                                             600,
// //                                     }}
// //                                 >
// //                                     {camera.name}
// //                                 </div>

// //                                 {/* Location */}

// //                                 <div
// //                                     style={{
// //                                         position:
// //                                             "absolute",
// //                                         top: "8px",
// //                                         right: "8px",
// //                                         background:
// //                                             "rgba(0,0,0,0.7)",
// //                                         color: "#d1d5db",
// //                                         padding:
// //                                             "4px 8px",
// //                                         borderRadius:
// //                                             "5px",
// //                                         fontSize:
// //                                             "11px",
// //                                     }}
// //                                 >
// //                                     {camera.location}
// //                                 </div>

// //                                 {/* Status */}

// //                                 <div
// //                                     style={{
// //                                         position:
// //                                             "absolute",
// //                                         bottom: "8px",
// //                                         left: "8px",
// //                                     }}
// //                                 >
// //                                     <Badge
// //                                         status={
// //                                             camera.online
// //                                                 ? "success"
// //                                                 : "error"
// //                                         }
// //                                         text={
// //                                             <span
// //                                                 style={{
// //                                                     color:
// //                                                         "#fff",
// //                                                 }}
// //                                             >
// //                                                 {camera.online
// //                                                     ? "LIVE"
// //                                                     : "OFFLINE"}
// //                                             </span>
// //                                         }
// //                                     />
// //                                 </div>

// //                                 {/* View Icon */}

// //                                 {camera.online && (
// //                                     <Button
// //                                         type="text"
// //                                         icon={
// //                                             <EyeOutlined />
// //                                         }
// //                                         style={{
// //                                             position:
// //                                                 "absolute",
// //                                             bottom:
// //                                                 "3px",
// //                                             right:
// //                                                 "5px",
// //                                             color:
// //                                                 "#fff",
// //                                         }}
// //                                     />
// //                                 )}
// //                             </div>
// //                         </Col>
// //                     ))}
// //                 </Row>
// //             </Modal>
// //         </div>
// //     );
// // }

// // export default Dashboard;



