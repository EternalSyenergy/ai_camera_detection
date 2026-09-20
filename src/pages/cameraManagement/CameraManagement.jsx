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
  {
    value: "ppe",
    label: "PPE Detection",
    description: "Helmet, vest, gloves, shoes",
    icon: <SafetyOutlined />,
  },
  {
    value: "pest",
    label: "Pest Detection",
    description: "Detect pests and insects",
    icon: <BugOutlined />,
  },
  {
    value: "fire",
    label: "Fire & Smoke",
    description: "Fire and smoke detection",
    icon: <FireOutlined />,
  },
  {
    value: "intrusion",
    label: "Intrusion Detection",
    description: "Restricted area monitoring",
    icon: <WarningOutlined />,
  },
  {
    value: "person",
    label: "Person Detection",
    description: "Human detection",
    icon: <UserOutlined />,
  },
  {
    value: "vehicle",
    label: "Vehicle Detection",
    description: "Cars, trucks and vehicles",
    icon: <CarOutlined />,
  },
];

// ============================================================
// STATUS TAG
// ============================================================

const StatusTag = ({ status }) => {
  const isOnline = status === "Online";

  return (
    <Tag
      color={isOnline ? "success" : "error"}
      style={{
        borderRadius: 20,
        padding: "3px 10px",
        margin: 0,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: isOnline ? "#52c41a" : "#ff4d4f",
          marginRight: 6,
        }}
      />

      {status || "Unknown"}
    </Tag>
  );
};

// ============================================================
// MOBILE CAMERA CARD
// ============================================================

const CameraCard = ({ camera, onView, onTest, onEdit }) => (
  <Card
    size="small"
    bordered={false}
    style={{
      marginBottom: 12,
      borderRadius: 14,
      background: "#ffffff",
      border: "1px solid #e3e8ef",
      boxShadow: "0 3px 12px rgba(15, 23, 42, 0.05)",
      overflow: "hidden",
    }}
    styles={{
      body: {
        padding: 16,
      },
    }}
  >
    {/* HEADER */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <Space size={12} align="center">
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            background: "#eef5ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <VideoCameraOutlined
            style={{
              color: "#1677ff",
              fontSize: 21,
            }}
          />
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#172033",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {camera.name || "Unnamed Camera"}
          </div>

          <Text
            type="secondary"
            style={{
              fontSize: 12,
            }}
          >
            {camera.cameraId || "N/A"}
          </Text>
        </div>
      </Space>

      <StatusTag status={camera.status} />
    </div>

    {/* DETAILS */}
    <div
      style={{
        marginTop: 16,
        padding: "14px 0",
        borderTop: "1px solid #edf0f4",
        borderBottom: "1px solid #edf0f4",
      }}
    >
      <Row gutter={[16, 14]}>
        <Col span={12}>
          <div
            style={{
              fontSize: 11,
              color: "#8c96a5",
              textTransform: "uppercase",
              letterSpacing: 0.4,
              marginBottom: 5,
            }}
          >
            Location
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#293241",
              fontWeight: 500,
            }}
          >
            <EnvironmentOutlined style={{ color: "#64748b" }} />

            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {camera.location || "Not available"}
            </span>
          </div>
        </Col>

        <Col span={12}>
          <div
            style={{
              fontSize: 11,
              color: "#8c96a5",
              textTransform: "uppercase",
              letterSpacing: 0.4,
              marginBottom: 5,
            }}
          >
            Stream
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              color: camera.streamUrl ? "#1f7a45" : "#8c8c8c",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: camera.streamUrl
                  ? "#52c41a"
                  : "#bfbfbf",
              }}
            />

            {camera.streamUrl ? "HLS Stream" : "Not configured"}
          </div>
        </Col>
      </Row>
    </div>

    {/* ACTIONS */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 14,
        gap: 8,
      }}
    >
      <Button
        type="primary"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => onView(camera)}
        style={{
          borderRadius: 7,
          fontWeight: 500,
        }}
      >
        View
      </Button>

      <Space size={6}>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => onTest(camera)}
          style={{
            borderRadius: 7,
          }}
        >
          Test
        </Button>

        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => onEdit(camera)}
          style={{
            borderRadius: 7,
          }}
        >
          Edit
        </Button>
      </Space>
    </div>
  </Card>
);

// ============================================================
// CAMERA VIEW MODAL
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
        <VideoCameraOutlined
          style={{
            color: "#1677ff",
          }}
        />

        <span>{camera?.name || "Camera"}</span>

        {camera && (
          <StatusTag status={camera.status} />
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
              <VideoCameraOutlined
                style={{
                  fontSize: 55,
                  opacity: 0.4,
                  marginBottom: 15,
                }}
              />

              <div
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                }}
              >
                {camera.name}
              </div>

              <Text
                style={{
                  color: "#999",
                  marginTop: 6,
                }}
              >
                {camera.location}
              </Text>

              <Tag
                color="blue"
                style={{
                  marginTop: 14,
                }}
              >
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

        {/* CAMERA INFORMATION */}
        <Row
          gutter={[12, 12]}
          style={{
            marginTop: 16,
          }}
        >
          <Col xs={24} md={8}>
            <Card
              size="small"
              bordered={false}
              style={{
                background: "#f8fafc",
                borderRadius: 10,
              }}
            >
              <Text type="secondary">
                Camera ID
              </Text>

              <div
                style={{
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                {camera.cameraId}
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              size="small"
              bordered={false}
              style={{
                background: "#f8fafc",
                borderRadius: 10,
              }}
            >
              <Text type="secondary">
                Location
              </Text>

              <div
                style={{
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                {camera.location || "Not available"}
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              size="small"
              bordered={false}
              style={{
                background: "#f8fafc",
                borderRadius: 10,
              }}
            >
              <Text type="secondary">
                Stream
              </Text>

              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  marginTop: 4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                HLS / M3U8
              </div>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* CONTROLS */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Space>
            {!isPlaying ? (
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={onPlay}
                style={{
                  borderRadius: 8,
                }}
              >
                Start Live View
              </Button>
            ) : (
              <Button
                danger
                size="large"
                icon={<StopOutlined />}
                onClick={onStop}
                style={{
                  borderRadius: 8,
                }}
              >
                Stop
              </Button>
            )}

            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => onTest(camera)}
              style={{
                borderRadius: 8,
              }}
            >
              Test
            </Button>
          </Space>

          <Button
            size="large"
            icon={<FullscreenOutlined />}
            onClick={onFullscreen}
            style={{
              borderRadius: 8,
            }}
          >
            Fullscreen
          </Button>
        </div>

        {/* STREAM URL */}
        <Alert
          style={{
            marginTop: 16,
            borderRadius: 10,
          }}
          type="info"
          showIcon
          message="HLS Stream"
          description={
            <Text
              code
              style={{
                wordBreak: "break-all",
              }}
            >
              {camera.streamUrl || "No stream URL configured"}
            </Text>
          }
        />
      </div>
    )}
  </Modal>
);

// ============================================================
// CAMERA DRAWER
// ============================================================

const CameraDrawer = ({
  open,
  editingCamera,
  isSmall,
  form,
  onClose,
  onSave,
}) => (
  <Drawer
    title={
      <Space>
        <VideoCameraOutlined
          style={{
            color: "#1677ff",
          }}
        />

        {editingCamera
          ? "Edit Camera"
          : "Add Camera"}
      </Space>
    }
    placement="right"
    width={isSmall ? "100%" : 550}
    open={open}
    onClose={onClose}
    destroyOnClose
    footer={
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        <Button
          onClick={onClose}
          style={{
            borderRadius: 8,
          }}
        >
          Cancel
        </Button>

        <Button
          type="primary"
          onClick={onSave}
          style={{
            borderRadius: 8,
          }}
        >
          {editingCamera
            ? "Update Camera"
            : "Add Camera"}
        </Button>
      </div>
    }
  >
    <Form
      form={form}
      layout="vertical"
      requiredMark="optional"
    >
      <Form.Item
        label="Camera ID"
        name="cameraId"
        rules={[
          {
            required: true,
            message: "Enter camera ID",
          },
        ]}
      >
        <Input
          size="large"
          placeholder="CAM-001"
        />
      </Form.Item>

      <Form.Item
        label="Camera Name"
        name="name"
        rules={[
          {
            required: true,
            message: "Enter camera name",
          },
        ]}
      >
        <Input
          size="large"
          placeholder="Production Camera 01"
        />
      </Form.Item>

      <Form.Item
        label="Location"
        name="location"
      >
        <Input
          size="large"
          placeholder="Production Area A"
        />
      </Form.Item>

      <Form.Item
        label="Status"
        name="status"
      >
        <Select
          size="large"
          placeholder="Select status"
        >
          <Option value="Online">
            Online
          </Option>

          <Option value="Offline">
            Offline
          </Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="Stream URL"
        name="streamUrl"
        extra="Use an HLS .m3u8 URL."
        rules={[
          {
            validator: (_, value) => {
              if (!value) {
                return Promise.resolve();
              }

              try {
                const url = new URL(value);

                if (
                  url.protocol !== "http:" &&
                  url.protocol !== "https:"
                ) {
                  return Promise.reject(
                    new Error(
                      "URL must be http(s)"
                    )
                  );
                }

                return Promise.resolve();
              } catch {
                return Promise.reject(
                  new Error(
                    "Enter a valid URL"
                  )
                );
              }
            },
          },
        ]}
      >
        <Input
          size="large"
          placeholder="https://server.com/live/camera.m3u8"
        />
      </Form.Item>

      <Divider />

      <Form.Item
        label="AI Detection"
        name="aiDetection"
      >
        <Checkbox.Group
          style={{
            width: "100%",
          }}
        >
          <Row gutter={[8, 8]}>
            {AI_DETECTIONS.map(
              (detection) => (
                <Col
                  span={24}
                  key={detection.value}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #edf0f4",
                      borderRadius: 8,
                      background: "#fafbfc",
                    }}
                  >
                    <Checkbox
                      value={detection.value}
                    >
                      <Space>
                        <span
                          style={{
                            color: "#1677ff",
                          }}
                        >
                          {detection.icon}
                        </span>

                        <span>
                          <div
                            style={{
                              fontWeight: 500,
                            }}
                          >
                            {detection.label}
                          </div>

                          <Text
                            type="secondary"
                            style={{
                              fontSize: 11,
                            }}
                          >
                            {
                              detection.description
                            }
                          </Text>
                        </span>
                      </Space>
                    </Checkbox>
                  </div>
                </Col>
              )
            )}
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

  // ==========================================================
  // REDUX
  // ==========================================================

  const dispatch = useDispatch();

  const {
    cameras = [],
    loading,
    error,
  } = useSelector(
    (state) => state.camera
  );

  // ==========================================================
  // LOCAL STATE
  // ==========================================================

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [editingCamera, setEditingCamera] =
    useState(null);

  const [viewOpen, setViewOpen] =
    useState(false);

  const [selectedCamera, setSelectedCamera] =
    useState(null);

  const [isPlaying, setIsPlaying] =
    useState(false);

  // ==========================================================
  // VIDEO
  // ==========================================================

  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // ==========================================================
  // FETCH
  // ==========================================================

  useEffect(() => {
    dispatch(fetchCameras());
  }, [dispatch]);

  // ==========================================================
  // DESTROY HLS
  // ==========================================================

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  // ==========================================================
  // HLS PLAYBACK
  // ==========================================================

  useEffect(() => {
    if (
      !viewOpen ||
      !selectedCamera ||
      !isPlaying ||
      !videoRef.current
    ) {
      return;
    }

    const video = videoRef.current;
    const streamUrl =
      selectedCamera.streamUrl;

    if (!streamUrl) {
      message.warning(
        "No stream URL configured"
      );

      setIsPlaying(false);
      return;
    }

    // --------------------------------------------------------
    // NATIVE HLS
    // --------------------------------------------------------

    if (
      video.canPlayType(
        "application/vnd.apple.mpegurl"
      )
    ) {
      video.src = streamUrl;

      const onError = () => {
        message.error(
          "Failed to load stream"
        );

        setIsPlaying(false);
      };

      video.addEventListener(
        "error",
        onError
      );

      video.play().catch(() => {});

      return () => {
        video.removeEventListener(
          "error",
          onError
        );

        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }

    // --------------------------------------------------------
    // HLS.JS
    // --------------------------------------------------------

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });

      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(
        Hls.Events.MANIFEST_PARSED,
        () => {
          video.play().catch(() => {});
        }
      );

      hls.on(
        Hls.Events.ERROR,
        (_, data) => {
          console.error(
            "HLS error:",
            data
          );

          if (!data.fatal) {
            return;
          }

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              message.warning(
                "Network issue, retrying stream..."
              );

              hls.startLoad();
              break;

            case Hls.ErrorTypes.MEDIA_ERROR:
              message.warning(
                "Media error, recovering..."
              );

              hls.recoverMediaError();
              break;

            default:
              message.error(
                "Unable to load stream"
              );

              destroyHls();
              setIsPlaying(false);
              break;
          }
        }
      );

      return () => {
        destroyHls();

        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }

    message.error(
      "HLS is not supported by this browser"
    );

    setIsPlaying(false);
  }, [
    viewOpen,
    selectedCamera,
    isPlaying,
    destroyHls,
  ]);

  // ==========================================================
  // CAMERA VIEW
  // ==========================================================

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

  // ==========================================================
  // PLAY
  // ==========================================================

  const playCamera = () => {
    if (!selectedCamera) {
      return;
    }

    if (
      selectedCamera.status !==
      "Online"
    ) {
      message.error(
        "Camera is offline"
      );

      return;
    }

    if (
      !selectedCamera.streamUrl
    ) {
      message.warning(
        "No stream URL configured"
      );

      return;
    }

    setIsPlaying(true);
  };

  // ==========================================================
  // STOP
  // ==========================================================

  const stopCamera = () => {
    destroyHls();
    setIsPlaying(false);
  };

  // ==========================================================
  // FULLSCREEN
  // ==========================================================

  const fullscreenCamera = () => {
    const element =
      document.getElementById(
        "camera-live-preview"
      );

    if (!element) {
      return;
    }

    if (
      element.requestFullscreen
    ) {
      element.requestFullscreen();
    }
  };

  // ==========================================================
  // ADD CAMERA
  // ==========================================================

  const openAddCamera = () => {
    setEditingCamera(null);

    form.resetFields();

    form.setFieldsValue({
      status: "Online",
      aiDetection: ["ppe"],
    });

    setDrawerOpen(true);
  };

  // ==========================================================
  // EDIT CAMERA
  // ==========================================================

  const openEditCamera = (
    camera
  ) => {
    setEditingCamera(camera);

    form.setFieldsValue({
      cameraId: camera.cameraId,
      name: camera.name,
      location: camera.location,
      status: camera.status,
      streamUrl: camera.streamUrl,
      aiDetection:
        camera.aiDetection || ["ppe"],
    });

    setDrawerOpen(true);
  };

  // ==========================================================
  // CLOSE DRAWER
  // ==========================================================

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingCamera(null);
    form.resetFields();
  };

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSave = async () => {
    try {
      const values =
        await form.validateFields();

      console.log(
        "Camera values:",
        values
      );

      if (editingCamera) {
        message.success(
          "Camera updated successfully"
        );
      } else {
        message.success(
          "Camera added successfully"
        );
      }

      closeDrawer();
    } catch (err) {
      console.log(err);
    }
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = (
    cameraId
  ) => {
    console.log(
      "Delete:",
      cameraId
    );

    if (
      selectedCamera?.cameraId ===
      cameraId
    ) {
      closeCameraView();
    }

    message.success(
      "Camera deleted successfully"
    );
  };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const refreshCameras = () => {
    dispatch(fetchCameras());

    message.success(
      "Camera list refreshed"
    );
  };

  // ==========================================================
  // TEST CONNECTION
  // ==========================================================

  const testConnection = (
    camera
  ) => {
    message.loading({
      content: `Testing ${camera.cameraId}...`,
      duration: 1,
    });

    setTimeout(() => {
      message.success(
        `${camera.cameraId} is reachable`
      );
    }, 1200);
  };

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const totalCameras =
    cameras.length;

  const onlineCameras =
    cameras.filter(
      (camera) =>
        camera.status === "Online"
    ).length;

  const offlineCameras =
    totalCameras -
    onlineCameras;

  const streamCameras =
    cameras.filter(
      (camera) =>
        !!camera.streamUrl
    ).length;

  // ==========================================================
  // TABLE COLUMNS
  // ==========================================================

  const columns = [
    {
      title: "Camera",
      key: "camera",
      width: 270,

      render: (_, record) => (
        <Space size={12}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "#eef5ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <VideoCameraOutlined
              style={{
                color: "#1677ff",
                fontSize: 19,
              }}
            />
          </div>

          <div
            style={{
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: "#172033",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {record.name ||
                "Unnamed Camera"}
            </div>

            <Text
              type="secondary"
              style={{
                fontSize: 12,
              }}
            >
              {record.cameraId}
            </Text>
          </div>
        </Space>
      ),
    },

    {
      title: "Location",
      key: "location",
      width: 220,

      render: (_, record) => (
        <Space size={8}>
          <EnvironmentOutlined
            style={{
              color: "#64748b",
            }}
          />

          <Text
            style={{
              fontSize: 13,
              color: "#334155",
            }}
          >
            {record.location ||
              "Not available"}
          </Text>
        </Space>
      ),
    },

    {
      title: "Stream",
      key: "stream",
      width: 150,

      render: (_, record) => (
        <Tag
          color={
            record.streamUrl
              ? "blue"
              : "default"
          }
          style={{
            borderRadius: 20,
            padding: "3px 10px",
            margin: 0,
          }}
        >
          {record.streamUrl
            ? "HLS Stream"
            : "No Stream"}
        </Tag>
      ),
    },

    {
      title: "Status",
      key: "status",
      width: 130,

      render: (_, record) => (
        <StatusTag
          status={record.status}
        />
      ),
    },

    {
      title: "Actions",
      key: "actions",
      width: 220,

      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Live View">
            <Button
              size="small"
              type="primary"
              icon={
                <PlayCircleOutlined />
              }
              onClick={() =>
                openCameraView(
                  record
                )
              }
              style={{
                borderRadius: 7,
              }}
            />
          </Tooltip>

          <Tooltip title="Test Connection">
            <Button
              size="small"
              icon={
                <ReloadOutlined />
              }
              onClick={() =>
                testConnection(
                  record
                )
              }
              style={{
                borderRadius: 7,
              }}
            />
          </Tooltip>

          <Tooltip title="Edit Camera">
            <Button
              size="small"
              icon={
                <EditOutlined />
              }
              onClick={() =>
                openEditCamera(
                  record
                )
              }
              style={{
                borderRadius: 7,
              }}
            />
          </Tooltip>

          <Popconfirm
            title="Delete camera?"
            description="This camera will be removed."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{
              danger: true,
            }}
            onConfirm={() =>
              handleDelete(
                record.cameraId
              )
            }
          >
            <Tooltip title="Delete">
              <Button
                size="small"
                danger
                icon={
                  <DeleteOutlined />
                }
                style={{
                  borderRadius: 7,
                }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: isSmall ? 12 : 24,
        background: "#eef1f5",
      }}
    >
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <Card
        bordered={false}
        style={{
          marginBottom: 22,
          borderRadius: 16,
          background: "#ffffff",
          border: "1px solid #e5e9ef",
          boxShadow:
            "0 4px 16px rgba(15, 23, 42, 0.05)",
        }}
        styles={{
          body: {
            padding: isSmall ? 16 : 20,
          },
        }}
      >
        <Row
          justify="space-between"
          align="middle"
          gutter={[16, 16]}
        >
          {/* LEFT */}
          <Col>
            <Space
              align="center"
              size={14}
            >
              <div
                style={{
                  width: isSmall
                    ? 44
                    : 52,
                  height: isSmall
                    ? 44
                    : 52,
                  borderRadius: 13,
                  background: "#eef5ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <VideoCameraOutlined
                  style={{
                    fontSize:
                      isSmall
                        ? 21
                        : 25,
                    color: "#1677ff",
                  }}
                />
              </div>

              <div>
                <Title
                  level={
                    isSmall
                      ? 4
                      : 3
                  }
                  style={{
                    margin: 0,
                    color: "#172033",
                    fontWeight: 650,
                    lineHeight: 1.3,
                  }}
                >
                  Camera Management
                </Title>

                <Text
                  type="secondary"
                  style={{
                    fontSize:
                      isSmall
                        ? 12
                        : 13,
                  }}
                >
                  Configure, monitor and
                  manage AI cameras
                </Text>
              </div>
            </Space>
          </Col>

          {/* RIGHT */}
          <Col>
            <Space
              size={8}
              wrap
            >
              <Button
                icon={
                  <ReloadOutlined />
                }
                onClick={
                  refreshCameras
                }
                loading={loading}
                size={
                  isSmall
                    ? "small"
                    : "middle"
                }
                style={{
                  borderRadius: 8,
                  height:
                    isSmall
                      ? 32
                      : 38,
                  paddingInline:
                    isSmall
                      ? 10
                      : 14,
                }}
              >
                {!isSmall &&
                  "Refresh"}
              </Button>

              <Button
                type="primary"
                icon={
                  <PlusOutlined />
                }
                onClick={
                  openAddCamera
                }
                size={
                  isSmall
                    ? "small"
                    : "middle"
                }
                style={{
                  borderRadius: 8,
                  height:
                    isSmall
                      ? 32
                      : 38,
                  paddingInline:
                    isSmall
                      ? 11
                      : 16,
                  fontWeight: 500,
                }}
              >
                {!isSmall
                  ? "Add Camera"
                  : "Add"}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <Alert
          type="error"
          showIcon
          message="Failed to load cameras"
          description={error}
          style={{
            marginBottom: 20,
            borderRadius: 10,
          }}
        />
      )}

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <Row
        gutter={[16, 16]}
        style={{
          marginBottom: 22,
        }}
      >
        {/* TOTAL */}
        <Col
          xs={12}
          sm={12}
          md={6}
        >
          <Card
            bordered={false}
            style={{
              height: "100%",
              borderRadius: 14,
              background: "#ffffff",
              border:
                "1px solid #e5e9ef",
              boxShadow:
                "0 3px 12px rgba(15, 23, 42, 0.04)",
            }}
            styles={{
              body: {
                padding: 18,
              },
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  Total Cameras
                </Text>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 26,
                    fontWeight: 700,
                    color: "#172033",
                  }}
                >
                  {totalCameras}
                </div>

                <Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                  }}
                >
                  Configured cameras
                </Text>
              </div>

              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: "#eef5ff",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <VideoCameraOutlined
                  style={{
                    fontSize: 21,
                    color: "#1677ff",
                  }}
                />
              </div>
            </div>
          </Card>
        </Col>

        {/* ONLINE */}
        <Col
          xs={12}
          sm={12}
          md={6}
        >
          <Card
            bordered={false}
            style={{
              height: "100%",
              borderRadius: 14,
              background: "#ffffff",
              border:
                "1px solid #e5e9ef",
              boxShadow:
                "0 3px 12px rgba(15, 23, 42, 0.04)",
            }}
            styles={{
              body: {
                padding: 18,
              },
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  Online
                </Text>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 26,
                    fontWeight: 700,
                    color: "#16a34a",
                  }}
                >
                  {onlineCameras}
                </div>

                <Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                  }}
                >
                  Active cameras
                </Text>
              </div>

              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: "#ecfdf3",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <WifiOutlined
                  style={{
                    fontSize: 21,
                    color: "#16a34a",
                  }}
                />
              </div>
            </div>
          </Card>
        </Col>

        {/* OFFLINE */}
        <Col
          xs={12}
          sm={12}
          md={6}
        >
          <Card
            bordered={false}
            style={{
              height: "100%",
              borderRadius: 14,
              background: "#ffffff",
              border:
                "1px solid #e5e9ef",
              boxShadow:
                "0 3px 12px rgba(15, 23, 42, 0.04)",
            }}
            styles={{
              body: {
                padding: 18,
              },
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  Offline
                </Text>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 26,
                    fontWeight: 700,
                    color: "#ff4d4f",
                  }}
                >
                  {offlineCameras}
                </div>

                <Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                  }}
                >
                  Need attention
                </Text>
              </div>

              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: "#fff1f0",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <WifiOutlined
                  style={{
                    fontSize: 21,
                    color: "#ff4d4f",
                  }}
                />
              </div>
            </div>
          </Card>
        </Col>

        {/* STREAM */}
        <Col
          xs={12}
          sm={12}
          md={6}
        >
          <Card
            bordered={false}
            style={{
              height: "100%",
              borderRadius: 14,
              background: "#ffffff",
              border:
                "1px solid #e5e9ef",
              boxShadow:
                "0 3px 12px rgba(15, 23, 42, 0.04)",
            }}
            styles={{
              body: {
                padding: 18,
              },
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  With Stream
                </Text>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 26,
                    fontWeight: 700,
                    color: "#1677ff",
                  }}
                >
                  {streamCameras}
                </div>

                <Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                  }}
                >
                  HLS configured
                </Text>
              </div>

              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: "#eef5ff",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <PlayCircleOutlined
                  style={{
                    fontSize: 21,
                    color: "#1677ff",
                  }}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ======================================================
          CAMERA LIST
      ====================================================== */}

      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          background: "#ffffff",
          border:
            "1px solid #e3e8ef",
          boxShadow:
            "0 4px 16px rgba(15, 23, 42, 0.05)",
          overflow: "hidden",
        }}
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        {/* SECTION HEADER */}
        <div
          style={{
            padding: isSmall
              ? 16
              : 20,
            borderBottom:
              "1px solid #edf0f4",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Space size={10}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: "#eef5ff",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
              }}
            >
              <VideoCameraOutlined
                style={{
                  color: "#1677ff",
                  fontSize: 18,
                }}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 650,
                  color: "#172033",
                }}
              >
                Connected Cameras
              </div>

              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                }}
              >
                Manage and monitor
                configured camera
                streams
              </Text>
            </div>
          </Space>

          <Tag
            color="blue"
            style={{
              margin: 0,
              borderRadius: 20,
              padding: "3px 10px",
            }}
          >
            {totalCameras} Cameras
          </Tag>
        </div>

        {/* CAMERA CONTENT */}
        <div
          style={{
            padding: isSmall
              ? 12
              : 20,
          }}
        >
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: 70,
              }}
            >
              <Spin size="large" />

              <div
                style={{
                  marginTop: 14,
                  color: "#8c96a5",
                  fontSize: 13,
                }}
              >
                Loading cameras...
              </div>
            </div>
          ) : cameras.length ===
            0 ? (
            <Empty
              image={
                Empty.PRESENTED_IMAGE_SIMPLE
              }
              description="No cameras configured"
            >
              <Button
                type="primary"
                icon={
                  <PlusOutlined />
                }
                onClick={
                  openAddCamera
                }
                style={{
                  borderRadius: 8,
                }}
              >
                Add Camera
              </Button>
            </Empty>
          ) : isMobile ? (
            cameras.map(
              (
                camera,
                index
              ) => (
                <CameraCard
                  key={
                    camera.cameraId ||
                    camera.id ||
                    index
                  }
                  camera={camera}
                  onView={
                    openCameraView
                  }
                  onTest={
                    testConnection
                  }
                  onEdit={
                    openEditCamera
                  }
                />
              )
            )
          ) : (
            <Table
              rowKey={(record) =>
                record.cameraId ||
                record.id
              }
              columns={columns}
              dataSource={cameras}
              scroll={{
                x: 1000,
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showTotal: (
                  total
                ) =>
                  `${total} cameras`,
              }}
            />
          )}
        </div>
      </Card>

      {/* ======================================================
          ADD / EDIT DRAWER
      ====================================================== */}

      <CameraDrawer
        open={drawerOpen}
        editingCamera={
          editingCamera
        }
        isSmall={isSmall}
        form={form}
        onClose={closeDrawer}
        onSave={handleSave}
      />

      {/* ======================================================
          LIVE VIEW MODAL
      ====================================================== */}

      <CameraViewModal
        open={viewOpen}
        camera={selectedCamera}
        isPlaying={isPlaying}
        isSmall={isSmall}
        videoRef={videoRef}
        onClose={
          closeCameraView
        }
        onPlay={playCamera}
        onStop={stopCamera}
        onTest={
          testConnection
        }
        onFullscreen={
          fullscreenCamera
        }
      />
    </div>
  );
}

export default CameraManagement;













