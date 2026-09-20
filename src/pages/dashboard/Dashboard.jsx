







import React, { useCallback, useEffect, useRef, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import Hls from "hls.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Grid,
  Modal,
  Progress,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";

import {
  AlertOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  BugOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FireOutlined,
  FullscreenOutlined,
  LockOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SafetyOutlined,
  StopOutlined,
  UserOutlined,
  VideoCameraOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import { fetchCameras } from "../../feature/camera/cameraSlice";

import {
  fetchReports,
  fetchReportSummary,
  fetchDetectionCounts,
} from "../../feature/report/reportSlice";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

/* ============================================================
   DETECTION LABELS
============================================================ */

const DETECTION_LABELS = {
  ppe: "PPE",
  pest: "Pest",
  fire_smoke: "Fire / Smoke",
  fire: "Fire",
  intrusion: "Intrusion",
  person: "Person",
  vehicle: "Vehicle",
};

/* ============================================================
   DETECTION CONFIG
============================================================ */

const DETECTION_CONFIG = {
  PERSON: {
    label: "Persons",
    description: "People detected",
    color: "#1677ff",
    bg: "#eef5ff",
    border: "#d9e8ff",
    icon: <UserOutlined />,
  },

  PPE: {
    label: "PPE",
    description: "Safety compliance",
    color: "#722ed1",
    bg: "#f7f0ff",
    border: "#eadcff",
    icon: <SafetyOutlined />,
  },

  VEHICLE: {
    label: "Vehicles",
    description: "Vehicle detections",
    color: "#13a8a8",
    bg: "#edfffd",
    border: "#d3f4f0",
    icon: <CarOutlined />,
  },

  INTRUSION: {
    label: "Intrusion",
    description: "Security events",
    color: "#eb2f96",
    bg: "#fff0f6",
    border: "#ffd9e9",
    icon: <LockOutlined />,
  },

  FIRE_SMOKE: {
    label: "Fire / Smoke",
    description: "Fire safety events",
    color: "#f5222d",
    bg: "#fff1f0",
    border: "#ffd9d6",
    icon: <FireOutlined />,
  },

  PEST: {
    label: "Pest",
    description: "Pest detections",
    color: "#fa8c16",
    bg: "#fff7e8",
    border: "#ffe3b3",
    icon: <BugOutlined />,
  },
};

/* ============================================================
   HELPERS
============================================================ */

const getDetectionName = (type) => {
  const normalized = String(type || "").toLowerCase();

  return DETECTION_LABELS[normalized] || type || "Unknown Detection";
};

const getDetectionIcon = (type) => {
  const normalized = String(type || "").toLowerCase();

  switch (normalized) {
    case "person":
      return <UserOutlined />;

    case "ppe":
      return <SafetyOutlined />;

    case "vehicle":
      return <CarOutlined />;

    case "fire":
    case "fire_smoke":
      return <FireOutlined />;

    case "pest":
      return <BugOutlined />;

    case "intrusion":
      return <LockOutlined />;

    default:
      return <WarningOutlined />;
  }
};

const formatReportTime = (date) => {
  if (!date) {
    return "Just now";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString();
};

const isCameraOnline = (camera) => {
  return (
    camera?.status === "Online" ||
    camera?.status === "ONLINE" ||
    camera?.status === "online" ||
    camera?.online === true ||
    camera?.isOnline === true
  );
};

/* ============================================================
   EXTRACT REPORTS FROM API RESPONSE
============================================================ */

const extractReportsFromResponse = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.reports)) {
    return response.reports;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.data?.reports)) {
    return response.data.reports;
  }

  if (Array.isArray(response.result)) {
    return response.result;
  }

  if (Array.isArray(response.result?.reports)) {
    return response.result.reports;
  }

  return [];
};

/* ============================================================
   IMAGE HELPER FOR PDF
============================================================ */

const getImageData = async (imageUrl) => {
  if (!imageUrl) {
    return null;
  }

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Image request failed: ${response.status}`);
    }

    const blob = await response.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        resolve(null);
      };

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Unable to load report image:", imageUrl, error);

    return null;
  }
};

/* ============================================================
   DETECT IMAGE FORMAT
============================================================ */

const getPdfImageFormat = (dataUrl) => {
  if (!dataUrl) {
    return "JPEG";
  }

  if (dataUrl.startsWith("data:image/png")) {
    return "PNG";
  }

  if (dataUrl.startsWith("data:image/webp")) {
    return "WEBP";
  }

  return "JPEG";
};

/* ============================================================
   NORMALIZE REPORT
============================================================ */

const normalizeReport = (report, index = 0) => {
  const detectionType = report?.detection_type || report?.detectionType || "";

  return {
    key: report?.id || report?.report_id || report?.reportId || index,

    id:
      report?.report_id ||
      report?.reportId ||
      report?.id ||
      `REPORT-${index + 1}`,

    detectionType,

    issue: getDetectionName(detectionType),

    camera:
      report?.camera_name ||
      report?.cameraName ||
      report?.camera_id ||
      report?.cameraId ||
      "Unknown Camera",

    location: report?.location || "Unknown Location",

    image: report?.image_url || report?.imageUrl || null,

    confidence: report?.confidence,

    status: report?.status || "OPEN",

    severity:
      report?.metadata?.severity || report?.metadata?.alertSeverity || "Medium",

    description:
      report?.metadata?.description ||
      report?.metadata?.message ||
      "No description available.",

    time: formatReportTime(
      report?.detected_at ||
        report?.detectedAt ||
        report?.created_at ||
        report?.createdAt,
    ),

    detectedAt: report?.detected_at || report?.detectedAt || null,

    createdAt: report?.created_at || report?.createdAt || null,
  };
};

/* ============================================================
   CAMERA THUMBNAIL
============================================================ */

const CameraThumbnail = ({ streamUrl, active = true }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    if (!active || !streamUrl || !videoRef.current) {
      return;
    }

    const video = videoRef.current;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;

      video.play().catch(() => {});

      return () => {
        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }

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

        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }

    return undefined;
  }, [active, streamUrl]);

  if (!active) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      muted
      autoPlay
      playsInline
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "cover",
      }}
    />
  );
};

/* ============================================================
   CAMERA CARD
============================================================ */

const CameraCard = ({ camera, onOpen }) => {
  const online = isCameraOnline(camera);

  const streamUrl =
    camera?.streamUrl ||
    camera?.stream_url ||
    camera?.hlsUrl ||
    camera?.hls_url;

  const detections = Array.isArray(camera?.aiDetection)
    ? camera.aiDetection
    : [];

  const cameraName = camera?.name || camera?.cameraName || "Camera";

  return (
    <div
      onClick={() => {
        if (online) {
          onOpen(camera);
        }
      }}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        minHeight: 190,
        overflow: "hidden",
        borderRadius: 17,
        background: "#0b111b",
        cursor: online ? "pointer" : "default",
        border: online ? "1px solid #263244" : "1px solid #d9dfe8",
        boxShadow: "0 9px 24px rgba(15,23,42,.13)",
      }}
    >
      {online && streamUrl ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000",
          }}
        >
          <CameraThumbnail streamUrl={streamUrl} active />
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#172131 0%,#0b111a 100%)",
            color: "#8c96a8",
          }}
        >
          <VideoCameraOutlined
            style={{
              fontSize: 42,
              marginBottom: 10,
              opacity: 0.65,
            }}
          />

          <span
            style={{
              fontSize: 12,
              color: "#9ca3af",
              fontWeight: 500,
            }}
          >
            {online ? "Stream unavailable" : "Camera Offline"}
          </span>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 90,
          background: "linear-gradient(to bottom,rgba(0,0,0,.78),transparent)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 125,
          background: "linear-gradient(to top,rgba(0,0,0,.94),transparent)",
          pointerEvents: "none",
        }}
      />

      {/* CAMERA NAME */}

      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 90,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            maxWidth: "100%",
            padding: "6px 9px",
            borderRadius: 8,
            background: "rgba(8,13,22,.74)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,.11)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <VideoCameraOutlined />

          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {cameraName}
          </span>
        </div>
      </div>

      {/* STATUS */}

      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 9px",
          borderRadius: 8,
          background: "rgba(8,13,22,.74)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,.10)",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: online ? "#52c41a" : "#ff4d4f",
            boxShadow: online
              ? "0 0 8px rgba(82,196,26,.85)"
              : "0 0 8px rgba(255,77,79,.85)",
          }}
        />

        <span
          style={{
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {online ? "LIVE" : "OFFLINE"}
        </span>
      </div>

      {/* CAMERA FOOTER */}

      <div
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 11,
          color: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div
            style={{
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 650,
                marginBottom: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {cameraName}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: "rgba(255,255,255,.70)",
                fontSize: 10,
              }}
            >
              <EnvironmentOutlined />

              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {camera.location || "Location unavailable"}
              </span>
            </div>
          </div>

          {online && (
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onOpen(camera);
              }}
              style={{
                color: "#fff",
                background: "rgba(0,0,0,.52)",
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 8,
                flexShrink: 0,
                width: 34,
                height: 32,
              }}
            />
          )}
        </div>

        {online && detections.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 5,
              marginTop: 7,
              overflow: "hidden",
            }}
          >
            {detections.slice(0, 3).map((detection) => (
              <span
                key={detection}
                style={{
                  padding: "3px 7px",
                  borderRadius: 5,
                  background: "rgba(22,119,255,.82)",
                  border: "1px solid rgba(255,255,255,.12)",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {DETECTION_LABELS[String(detection).toLowerCase()] || detection}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================
   KPI CARD
============================================================ */

const KpiCard = ({
  title,
  value,
  subtitle,
  icon,
  iconBackground,
  iconColor,
  valueColor,
  progress,
}) => {
  return (
    <Card
      bordered={false}
      style={{
        height: "100%",
        borderRadius: 18,
        background: "#fff",
        border: "1px solid #e2e7ee",
        boxShadow: "0 8px 25px rgba(31,41,55,.065)",
        overflow: "hidden",
        position: "relative",
      }}
      styles={{
        body: {
          padding: 20,
        },
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: iconColor || "#1677ff",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <div
          style={{
            minWidth: 0,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: "#7b8798",
              fontWeight: 600,
            }}
          >
            {title}
          </Text>

          <div
            style={{
              marginTop: 7,
              fontSize: 29,
              lineHeight: 1.1,
              fontWeight: 750,
              color: valueColor || "#172033",
            }}
          >
            {value}
          </div>

          <div
            style={{
              marginTop: 8,
              color: "#98a2b1",
              fontSize: 11,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            width: 46,
            height: 46,
            flexShrink: 0,
            borderRadius: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: iconBackground,
            color: iconColor,
            fontSize: 20,
          }}
        >
          {icon}
        </div>
      </div>

      {progress !== undefined && (
        <Progress
          percent={progress}
          showInfo={false}
          size="small"
          strokeLinecap="round"
          strokeColor={iconColor || "#1677ff"}
          trailColor="#edf1f5"
          style={{
            marginTop: 15,
          }}
        />
      )}
    </Card>
  );
};

/* ============================================================
   DETECTION ROW
============================================================ */

const DetectionRow = ({ type, value }) => {
  const config = DETECTION_CONFIG[type] || DETECTION_CONFIG.PERSON;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "11px 12px",
        borderRadius: 13,
        background: "#fafbfd",
        border: `1px solid ${config.border}`,
      }}
    >
      <Space size={10}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: config.bg,
            color: config.color,
            fontSize: 16,
          }}
        >
          {config.icon}
        </div>

        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 650,
              color: "#202938",
            }}
          >
            {config.label}
          </div>

          <div
            style={{
              marginTop: 2,
              fontSize: 10,
              color: "#8c96a8",
            }}
          >
            {config.description}
          </div>
        </div>
      </Space>

      <div
        style={{
          minWidth: 42,
          textAlign: "right",
          fontSize: 20,
          fontWeight: 750,
          color: config.color,
        }}
      >
        {value}
      </div>
    </div>
  );
};

/* ============================================================
   SECTION HEADER
============================================================ */

const SectionHeader = ({
  icon,
  title,
  subtitle,
  background,
  border,
  color,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background,
          border: `1px solid ${border}`,
          color,
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#172033",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 3,
            fontSize: 11,
            color: "#8994a5",
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   DASHBOARD
============================================================ */

function Dashboard() {
  const screens = useBreakpoint();

  const isMobile = !screens.md;
  const isSmall = !screens.sm;

  const dispatch = useDispatch();

  /* ==========================================================
     REDUX
  ========================================================== */

  const {
    cameras = [],
    loading: cameraLoading,
    error: cameraError,
  } = useSelector((state) => state.camera);

  const {
    reports = [],
    summary = {},
    detectionCounts = [],
    loading: reportLoading,
    summaryLoading,
    error: reportError,
    pagination = {},
  } = useSelector((state) => state.report);

  /* ==========================================================
     STATE
  ========================================================== */

  const [allCameraOpen, setAllCameraOpen] = useState(false);

  const [allReportsOpen, setAllReportsOpen] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);

  const [selectedCamera, setSelectedCamera] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const [pdfLoading, setPdfLoading] = useState(false);

  const videoRef = useRef(null);

  const hlsRef = useRef(null);

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  useEffect(() => {
    dispatch(fetchCameras());

    dispatch(
      fetchReports({
        page: 1,
        limit: 20,
      }),
    );

    dispatch(fetchReportSummary());

    dispatch(fetchDetectionCounts());
  }, [dispatch]);

  /* ==========================================================
     REFRESH
  ========================================================== */

  const refresh = () => {
    dispatch(fetchCameras());

    dispatch(
      fetchReports({
        page: 1,
        limit: 20,
      }),
    );

    dispatch(fetchReportSummary());

    dispatch(fetchDetectionCounts());
  };

  /* ==========================================================
     DESTROY HLS
  ========================================================== */

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  /* ==========================================================
     LIVE CAMERA STREAM
  ========================================================== */

  useEffect(() => {
    if (!viewOpen || !selectedCamera || !isPlaying || !videoRef.current) {
      return;
    }

    const video = videoRef.current;

    const streamUrl =
      selectedCamera.streamUrl ||
      selectedCamera.stream_url ||
      selectedCamera.hlsUrl ||
      selectedCamera.hls_url;

    if (!streamUrl) {
      message.warning("No stream URL configured");

      setIsPlaying(false);

      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;

      video.play().catch(() => {});

      return () => {
        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }

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
        if (!data.fatal) {
          return;
        }

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();

          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();

          return;
        }

        destroyHls();

        setIsPlaying(false);

        message.error("Unable to load camera stream");
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

  /* ==========================================================
     CAMERA ACTIONS
  ========================================================== */

  const openCameraView = (camera) => {
    if (!isCameraOnline(camera)) {
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
    if (!selectedCamera) {
      return;
    }

    const streamUrl =
      selectedCamera.streamUrl ||
      selectedCamera.stream_url ||
      selectedCamera.hlsUrl ||
      selectedCamera.hls_url;

    if (!streamUrl) {
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

    if (element?.requestFullscreen) {
      element.requestFullscreen();
    }
  };

  /* ==========================================================
     CAMERA COUNTS
  ========================================================== */

  const totalCameras = cameras.length;

  const onlineCameras = cameras.filter((camera) =>
    isCameraOnline(camera),
  ).length;

  const offlineCameras = totalCameras - onlineCameras;

  const onlinePercentage =
    totalCameras > 0 ? Math.round((onlineCameras / totalCameras) * 100) : 0;

  /* ==========================================================
     DETECTION COUNTS
  ========================================================== */

  const getDetectionCount = (type) => {
    if (!detectionCounts) {
      return 0;
    }

    if (Array.isArray(detectionCounts)) {
      const found = detectionCounts.find(
        (item) =>
          String(
            item.detection_type || item.detectionType || "",
          ).toUpperCase() === String(type).toUpperCase(),
      );

      return Number(found?.count || found?.total || 0);
    }

    const key = Object.keys(detectionCounts).find(
      (item) => item.toUpperCase() === String(type).toUpperCase(),
    );

    return Number(key ? detectionCounts[key] : 0);
  };

  const persons = getDetectionCount("PERSON");

  const ppe = getDetectionCount("PPE");

  const vehicles = getDetectionCount("VEHICLE");

  const intrusion = getDetectionCount("INTRUSION");

  const fireSmoke = getDetectionCount("FIRE_SMOKE");

  const pest = getDetectionCount("PEST");

  /* ==========================================================
     REPORTS
  ========================================================== */

  const alerts = reports.map((report, index) => normalizeReport(report, index));

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const activeAlerts = Number(
    summary?.open ?? summary?.openReports ?? summary?.OPEN ?? 0,
  );

  const totalReports = Number(
    summary?.total ??
      summary?.totalReports ??
      pagination?.total ??
      reports.length ??
      0,
  );

  /* ==========================================================
     INDIVIDUAL PDF
  ========================================================== */

  const downloadIndividualReportPdf = async (report) => {
    if (!report) {
      return;
    }

    try {
      setPdfLoading(true);

      message.loading({
        content: "Generating individual PDF...",
        key: "individual-pdf",
      });

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      const pageHeight = doc.internal.pageSize.getHeight();

      /* HEADER */

      doc.setFillColor(23, 32, 51);

      doc.rect(0, 0, pageWidth, 34, "F");

      doc.setTextColor(255, 255, 255);

      doc.setFont("helvetica", "bold");

      doc.setFontSize(19);

      doc.text("AI Safety Incident Report", 15, 15);

      doc.setFont("helvetica", "normal");

      doc.setFontSize(9);

      doc.text("AI CCTV Monitoring System", 15, 23);

      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        pageWidth - 15,
        23,
        {
          align: "right",
        },
      );

      /* TITLE */

      doc.setTextColor(23, 32, 51);

      doc.setFont("helvetica", "bold");

      doc.setFontSize(15);

      doc.text(report.issue, 15, 49);

      doc.setFont("helvetica", "normal");

      doc.setFontSize(9);

      doc.setTextColor(120, 128, 140);

      doc.text(`Report ID: ${report.id}`, 15, 56);

      /* STATUS */

      const status = String(report.status || "OPEN").toUpperCase();

      let statusColor = [22, 119, 255];

      if (status === "OPEN") {
        statusColor = [245, 34, 45];
      }

      if (status === "RESOLVED") {
        statusColor = [82, 196, 26];
      }

      if (status === "FALSE_POSITIVE") {
        statusColor = [140, 140, 140];
      }

      doc.setFillColor(...statusColor);

      doc.roundedRect(pageWidth - 55, 43, 40, 10, 2, 2, "F");

      doc.setTextColor(255, 255, 255);

      doc.setFont("helvetica", "bold");

      doc.setFontSize(8);

      doc.text(status, pageWidth - 35, 49.5, {
        align: "center",
      });

      /* DETAILS */

      const confidence =
        report.confidence !== null && report.confidence !== undefined
          ? `${Number(report.confidence).toFixed(1)}%`
          : "-";

      const details = [
        ["Report ID", report.id || "-"],
        ["Detection Type", report.issue || "-"],
        ["Camera", report.camera || "-"],
        ["Location", report.location || "-"],
        ["Confidence", confidence],
        ["Severity", report.severity || "-"],
        ["Status", status],
        ["Detected At", report.time || "-"],
      ];

      autoTable(doc, {
        startY: 65,
        body: details,
        theme: "grid",

        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: [55, 65, 81],
          lineColor: [225, 229, 235],
          lineWidth: 0.2,
        },

        columnStyles: {
          0: {
            cellWidth: 42,
            fontStyle: "bold",
            fillColor: [247, 248, 250],
          },

          1: {
            cellWidth: 130,
          },
        },
      });

      /* DESCRIPTION */

      let currentY = doc.lastAutoTable.finalY + 14;

      doc.setTextColor(23, 32, 51);

      doc.setFont("helvetica", "bold");

      doc.setFontSize(12);

      doc.text("Incident Description", 15, currentY);

      currentY += 7;

      doc.setFont("helvetica", "normal");

      doc.setFontSize(9);

      doc.setTextColor(75, 84, 96);

      const description = report.description || "No description available.";

      const descriptionLines = doc.splitTextToSize(description, pageWidth - 30);

      doc.text(descriptionLines, 15, currentY);

      currentY += Math.max(descriptionLines.length, 1) * 5;

      /* EVIDENCE */

      currentY += 10;

      doc.setTextColor(23, 32, 51);

      doc.setFont("helvetica", "bold");

      doc.setFontSize(12);

      doc.text("Detection Evidence", 15, currentY);

      currentY += 7;

      if (report.image) {
        const imageData = await getImageData(report.image);

        if (imageData) {
          try {
            const imageWidth = pageWidth - 30;

            const imageHeight = 85;

            const imageFormat = getPdfImageFormat(imageData);

            doc.setDrawColor(215, 220, 227);

            doc.roundedRect(
              14,
              currentY - 1,
              imageWidth + 2,
              imageHeight + 2,
              2,
              2,
            );

            doc.addImage(
              imageData,
              imageFormat,
              15,
              currentY,
              imageWidth,
              imageHeight,
            );

            currentY += imageHeight + 10;
          } catch (error) {
            console.error("Could not add image:", error);

            doc.setFontSize(9);

            doc.setFont("helvetica", "normal");

            doc.setTextColor(150, 150, 150);

            doc.text("Evidence image could not be embedded.", 15, currentY + 7);

            currentY += 15;
          }
        } else {
          doc.setFontSize(9);

          doc.setFont("helvetica", "normal");

          doc.setTextColor(150, 150, 150);

          doc.text("Evidence image could not be loaded.", 15, currentY + 7);

          currentY += 15;
        }
      } else {
        doc.setFontSize(9);

        doc.setFont("helvetica", "normal");

        doc.setTextColor(150, 150, 150);

        doc.text("No evidence image available.", 15, currentY + 7);

        currentY += 15;
      }

      /* FOOTER */

      doc.setDrawColor(225, 229, 235);

      doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18);

      doc.setFont("helvetica", "normal");

      doc.setFontSize(7);

      doc.setTextColor(145, 151, 160);

      doc.text("Confidential - AI CCTV Monitoring System", 15, pageHeight - 10);

      doc.text("1 / 1", pageWidth - 15, pageHeight - 10, {
        align: "right",
      });

      /* SAVE */

      const safeId = String(report.id || "report")
        .replace(/[^a-zA-Z0-9-_]/g, "_")
        .substring(0, 60);

      doc.save(`Safety-Report-${safeId}.pdf`);

      message.success({
        content: "Individual PDF downloaded",
        key: "individual-pdf",
      });
    } catch (error) {
      console.error("Individual PDF error:", error);

      message.error({
        content: "Failed to generate individual PDF",
        key: "individual-pdf",
      });
    } finally {
      setPdfLoading(false);
    }
  };

  /* ==========================================================
     FULL PDF
  ========================================================== */

  const downloadReportsPdf = async () => {
    if (pdfLoading) {
      return;
    }

    try {
      setPdfLoading(true);

      message.loading({
        content: "Fetching all reports...",
        key: "full-pdf",
      });

      /*
       * Request a large number of reports.
       * Your backend must support the limit parameter.
       */
      const result = await dispatch(
        fetchReports({
          page: 1,
          limit: 10000,
        }),
      ).unwrap();

      const returnedReports = extractReportsFromResponse(result);

      const sourceReports =
        returnedReports.length > 0 ? returnedReports : reports;

      if (sourceReports.length === 0) {
        message.warning({
          content: "No reports available",
          key: "full-pdf",
        });

        return;
      }

      const pdfReports = sourceReports.map((report, index) =>
        normalizeReport(report, index),
      );

      message.loading({
        content: `Generating ${pdfReports.length} reports...`,
        key: "full-pdf",
      });

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      const pageHeight = doc.internal.pageSize.getHeight();

      /* HEADER */

      doc.setFillColor(23, 32, 51);

      doc.rect(0, 0, pageWidth, 30, "F");

      doc.setTextColor(255, 255, 255);

      doc.setFont("helvetica", "bold");

      doc.setFontSize(19);

      doc.text("AI Safety Monitoring Report", 14, 13);

      doc.setFont("helvetica", "normal");

      doc.setFontSize(9);

      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 21);

      doc.text(`Total Reports: ${pdfReports.length}`, pageWidth - 14, 21, {
        align: "right",
      });

      /* SUMMARY */

      doc.setTextColor(40, 48, 61);

      doc.setFont("helvetica", "bold");

      doc.setFontSize(11);

      doc.text("Report Summary", 14, 40);

      const openCount = pdfReports.filter(
        (report) => String(report.status).toUpperCase() === "OPEN",
      ).length;

      const resolvedCount = pdfReports.filter(
        (report) => String(report.status).toUpperCase() === "RESOLVED",
      ).length;

      const acknowledgedCount = pdfReports.filter(
        (report) => String(report.status).toUpperCase() === "ACKNOWLEDGED",
      ).length;

      const falsePositiveCount = pdfReports.filter(
        (report) => String(report.status).toUpperCase() === "FALSE_POSITIVE",
      ).length;

      doc.setFont("helvetica", "normal");

      doc.setFontSize(9);

      doc.text(`Open: ${openCount}`, 14, 48);

      doc.text(`Resolved: ${resolvedCount}`, 55, 48);

      doc.text(`Acknowledged: ${acknowledgedCount}`, 105, 48);

      doc.text(`False Positive: ${falsePositiveCount}`, 175, 48);

      doc.text(`Cameras: ${totalCameras}`, 245, 48);

      /* DETECTION SUMMARY */

      const detectionSummary = {};

      pdfReports.forEach((report) => {
        const key = String(report.detectionType || "UNKNOWN").toUpperCase();

        detectionSummary[key] = (detectionSummary[key] || 0) + 1;
      });

      const detectionSummaryText = Object.entries(detectionSummary)
        .map(([key, value]) => `${getDetectionName(key)}: ${value}`)
        .join("   |   ");

      if (detectionSummaryText) {
        doc.setFontSize(8);

        doc.setTextColor(100, 108, 120);

        doc.text(detectionSummaryText, 14, 53);
      }

      /* TABLE */

      const tableData = pdfReports.map((report, index) => [
        index + 1,

        String(report.id || "-").substring(0, 36),

        report.camera || "-",

        report.location || "-",

        report.issue || "-",

        report.confidence !== null && report.confidence !== undefined
          ? `${Number(report.confidence).toFixed(1)}%`
          : "-",

        report.time || "-",

        report.severity || "-",

        report.status || "-",
      ]);

      autoTable(doc, {
        startY: 58,

        head: [
          [
            "#",
            "Report ID",
            "Camera",
            "Location",
            "Detection",
            "Confidence",
            "Time",
            "Severity",
            "Status",
          ],
        ],

        body: tableData,

        theme: "grid",

        styles: {
          fontSize: 7.2,
          cellPadding: 3,
          textColor: [55, 65, 81],
          lineColor: [220, 225, 231],
          lineWidth: 0.2,
          valign: "middle",
        },

        headStyles: {
          fillColor: [23, 32, 51],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7.2,
        },

        alternateRowStyles: {
          fillColor: [248, 249, 251],
        },

        columnStyles: {
          0: {
            cellWidth: 9,
          },

          1: {
            cellWidth: 32,
          },

          2: {
            cellWidth: 34,
          },

          3: {
            cellWidth: 40,
          },

          4: {
            cellWidth: 28,
          },

          5: {
            cellWidth: 23,
          },

          6: {
            cellWidth: 40,
          },

          7: {
            cellWidth: 23,
          },

          8: {
            cellWidth: 25,
          },
        },

        margin: {
          left: 14,
          right: 14,
          bottom: 15,
        },

        didDrawPage: () => {
          doc.setFontSize(7);

          doc.setTextColor(130, 138, 150);

          doc.text("AI CCTV Monitoring System", 14, pageHeight - 8);

          doc.text(
            `Page ${doc.internal.getNumberOfPages()}`,
            pageWidth - 14,
            pageHeight - 8,
            {
              align: "right",
            },
          );
        },
      });

      /* ====================================================
           EVIDENCE PAGES
        ==================================================== */

      const reportsWithImages = pdfReports.filter((report) =>
        Boolean(report.image),
      );

      if (reportsWithImages.length > 0) {
        doc.addPage();

        doc.setTextColor(23, 32, 51);

        doc.setFont("helvetica", "bold");

        doc.setFontSize(16);

        doc.text("Detection Evidence", 14, 18);

        doc.setFont("helvetica", "normal");

        doc.setFontSize(9);

        doc.setTextColor(110, 118, 130);

        doc.text(`Evidence images: ${reportsWithImages.length}`, 14, 25);

        let currentY = 35;

        for (let i = 0; i < reportsWithImages.length; i++) {
          const report = reportsWithImages[i];

          const imageData = await getImageData(report.image);

          if (!imageData) {
            continue;
          }

          if (currentY > pageHeight - 95) {
            doc.addPage();

            currentY = 20;
          }

          /* REPORT TITLE */

          doc.setFillColor(247, 248, 250);

          doc.roundedRect(14, currentY, pageWidth - 28, 12, 2, 2, "F");

          doc.setTextColor(40, 48, 61);

          doc.setFont("helvetica", "bold");

          doc.setFontSize(9);

          doc.text(`${report.id}  •  ${report.issue}`, 18, currentY + 8);

          currentY += 16;

          /* IMAGE */

          try {
            const imageWidth = 100;

            const imageHeight = 60;

            const imageFormat = getPdfImageFormat(imageData);

            doc.addImage(
              imageData,
              imageFormat,
              14,
              currentY,
              imageWidth,
              imageHeight,
            );

            /* DETAILS */

            const detailsX = 124;

            let detailY = currentY + 5;

            const details = [
              ["Report ID", report.id],

              ["Camera", report.camera],

              ["Location", report.location],

              ["Detection", report.issue],

              [
                "Confidence",
                report.confidence !== null && report.confidence !== undefined
                  ? `${Number(report.confidence).toFixed(1)}%`
                  : "-",
              ],

              ["Date / Time", report.time],

              ["Severity", report.severity],

              ["Status", report.status],

              ["Description", report.description],
            ];

            details.forEach(([label, value]) => {
              doc.setFont("helvetica", "bold");

              doc.setFontSize(8);

              doc.setTextColor(80, 88, 100);

              doc.text(`${label}:`, detailsX, detailY);

              doc.setFont("helvetica", "normal");

              doc.setTextColor(45, 52, 62);

              const wrapped = doc.splitTextToSize(String(value || "-"), 125);

              doc.text(wrapped, detailsX + 30, detailY);

              detailY += 6 * Math.max(wrapped.length, 1);
            });

            currentY += 68;

            doc.setDrawColor(225, 229, 234);

            doc.line(14, currentY, pageWidth - 14, currentY);

            currentY += 10;
          } catch (error) {
            console.warn("Could not add evidence:", error);
          }
        }
      }

      /* FINAL FOOTERS */

      const totalPages = doc.internal.getNumberOfPages();

      for (let page = 1; page <= totalPages; page++) {
        doc.setPage(page);

        doc.setFont("helvetica", "normal");

        doc.setFontSize(7);

        doc.setTextColor(145, 151, 160);

        doc.text(
          "Confidential - AI CCTV Monitoring System",
          14,
          pageHeight - 5,
        );

        doc.text(`${page} / ${totalPages}`, pageWidth - 14, pageHeight - 5, {
          align: "right",
        });
      }

      /* SAVE */

      const fileDate = new Date().toISOString().slice(0, 10);

      doc.save(`AI-Safety-Full-Report-${fileDate}.pdf`);

      message.success({
        content: `${pdfReports.length} reports exported successfully`,
        key: "full-pdf",
      });
    } catch (error) {
      console.error("Full PDF error:", error);

      message.error({
        content: "Failed to generate full PDF",
        key: "full-pdf",
      });
    } finally {
      setPdfLoading(false);
    }
  };

  /* ==========================================================
     TABLE COLUMNS
  ========================================================== */

  const alertColumns = [
    {
      title: "Camera",
      dataIndex: "camera",
      key: "camera",

      render: (value) => (
        <Space size={9}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eef4ff",
              border: "1px solid #dce8ff",
            }}
          >
            <VideoCameraOutlined
              style={{
                color: "#1677ff",
              }}
            />
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
        <Space size={5}>
          <EnvironmentOutlined
            style={{
              color: "#8c96a8",
            }}
          />

          <Text>{value}</Text>
        </Space>
      ),
    },

    {
      title: "Detection",
      dataIndex: "issue",
      key: "issue",

      render: (value, record) => (
        <Tag
          icon={getDetectionIcon(record.detectionType)}
          color="blue"
          style={{
            borderRadius: 6,
            fontWeight: 500,
          }}
        >
          {value}
        </Tag>
      ),
    },

    {
      title: "Confidence",
      dataIndex: "confidence",
      key: "confidence",

      render: (value) =>
        value !== null && value !== undefined
          ? `${Number(value).toFixed(1)}%`
          : "-",
    },

    {
      title: "Evidence",
      dataIndex: "image",
      key: "image",

      render: (image) =>
        image ? (
          <img
            src={image}
            alt="Detection evidence"
            style={{
              width: 60,
              height: 42,
              objectFit: "cover",
              borderRadius: 7,
              cursor: "pointer",
              border: "1px solid #e3e7ed",
            }}
            onClick={() => window.open(image, "_blank")}
          />
        ) : (
          "-"
        ),
    },

    {
      title: "Time",
      dataIndex: "time",
      key: "time",

      render: (value) => (
        <Space size={5}>
          <ClockCircleOutlined
            style={{
              color: "#8c96a8",
            }}
          />

          <Text type="secondary">{value}</Text>
        </Space>
      ),
    },

    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",

      render: (severity) => (
        <Tag
          color={
            severity === "Critical"
              ? "red"
              : severity === "High"
                ? "error"
                : severity === "Medium"
                  ? "warning"
                  : "success"
          }
          style={{
            borderRadius: 6,
          }}
        >
          {severity}
        </Tag>
      ),
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",

      render: (status) => (
        <Tag
          color={
            status === "OPEN"
              ? "red"
              : status === "RESOLVED"
                ? "green"
                : status === "FALSE_POSITIVE"
                  ? "default"
                  : "blue"
          }
          style={{
            borderRadius: 6,
          }}
        >
          {status}
        </Tag>
      ),
    },

    /* ========================================================
       INDIVIDUAL PDF BUTTON
    ======================================================== */

    {
      title: "PDF",
      key: "pdf",
      fixed: "right",

      render: (_, record) => (
        <Button
          type="text"
          icon={<DownloadOutlined />}
          loading={pdfLoading}
          disabled={pdfLoading}
          onClick={() => downloadIndividualReportPdf(record)}
          style={{
            color: "#1677ff",
            borderRadius: 7,
            fontWeight: 600,
          }}
        >
          {!isSmall && "PDF"}
        </Button>
      ),
    },
  ];

  /* ==========================================================
     LOADING
  ========================================================== */

  const loading = cameraLoading || reportLoading || summaryLoading;

  const error = cameraError || reportError;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: isSmall ? 12 : isMobile ? 16 : 28,
        background: "#f5f7fa",
      }}
    >
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title
            level={isSmall ? 3 : 2}
            style={{
              margin: 0,
              color: "#172033",
              fontWeight: 750,
            }}
          >
            AI Camera Dashboard
          </Title>

          <Text
            style={{
              display: "block",
              marginTop: 4,
              color: "#7d8999",
              fontSize: 13,
            }}
          >
            Real-time AI monitoring, safety and detection
          </Text>
        </div>

        <Space>
          <div
            style={{
              padding: "7px 11px",
              borderRadius: 9,
              background: "#f6ffed",
              border: "1px solid #d9f7be",
            }}
          >
            <Badge
              status="success"
              text={
                <span
                  style={{
                    color: "#389e0d",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  System Online
                </span>
              }
            />
          </div>

          <Button
            icon={<ReloadOutlined />}
            onClick={refresh}
            loading={loading}
            style={{
              borderRadius: 9,
              height: 36,
            }}
          >
            {!isSmall && "Refresh"}
          </Button>
        </Space>
      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <Alert
          type="error"
          showIcon
          message="Dashboard data error"
          description={error}
          style={{
            marginBottom: 18,
            borderRadius: 12,
          }}
        />
      )}

      {/* ====================================================
          KPI
      ==================================================== */}

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} lg={6}>
          <KpiCard
            title="Total Cameras"
            value={totalCameras}
            subtitle="Configured cameras"
            icon={<VideoCameraOutlined />}
            iconBackground="#eef4ff"
            iconColor="#1677ff"
          />
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <KpiCard
            title="Online Cameras"
            value={onlineCameras}
            subtitle={`${onlinePercentage}% availability`}
            icon={<CheckCircleOutlined />}
            iconBackground="#effff4"
            iconColor="#52c41a"
            valueColor="#389e0d"
            progress={onlinePercentage}
          />
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <KpiCard
            title="Active Alerts"
            value={activeAlerts}
            subtitle="Requires attention"
            icon={<WarningOutlined />}
            iconBackground="#fff1f0"
            iconColor="#ff4d4f"
            valueColor="#cf1322"
          />
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <KpiCard
            title="Total Reports"
            value={totalReports}
            subtitle="AI detections recorded"
            icon={<BarChartOutlined />}
            iconBackground="#fff7e6"
            iconColor="#fa8c16"
          />
        </Col>
      </Row>

      {/* ====================================================
          CAMERA + DETECTION
      ==================================================== */}

      <Row
        gutter={[18, 18]}
        style={{
          marginTop: 18,
        }}
      >
        <Col xs={24} xl={16}>
          <Card
            bordered={false}
            style={{
              height: "100%",
              borderRadius: 20,
              background: "#fff",
              border: "1px solid #e1e7ef",
              boxShadow: "0 10px 30px rgba(31,41,55,.07)",
              overflow: "hidden",
            }}
            styles={{
              body: {
                padding: 20,
              },
            }}
            title={
              <SectionHeader
                icon={<VideoCameraOutlined />}
                title="Live Camera Monitoring"
                subtitle="Real-time surveillance feeds"
                background="#eef4ff"
                border="#dce8ff"
                color="#1677ff"
              />
            }
            extra={
              <Button
                type="primary"
                icon={<FullscreenOutlined />}
                onClick={() => setAllCameraOpen(true)}
                disabled={totalCameras === 0}
                style={{
                  borderRadius: 9,
                }}
              >
                {!isSmall && "View All"}
              </Button>
            }
          >
            {cameraLoading ? (
              <div
                style={{
                  minHeight: 420,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Spin size="large" />
              </div>
            ) : totalCameras === 0 ? (
              <div
                style={{
                  minHeight: 420,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fafbfd",
                  borderRadius: 14,
                }}
              >
                <Empty description="No cameras configured" />
              </div>
            ) : (
              <>
                <Row gutter={[14, 14]}>
                  {cameras.slice(0, 4).map((camera) => (
                    <Col key={camera.cameraId || camera.id} xs={24} sm={12}>
                      <CameraCard camera={camera} onOpen={openCameraView} />
                    </Col>
                  ))}
                </Row>

                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 15,
                    borderTop: "1px solid #edf0f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <Space size={18}>
                    <Space size={6}>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "#52c41a",
                        }}
                      />

                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                        }}
                      >
                        {onlineCameras} Online
                      </Text>
                    </Space>

                    <Space size={6}>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "#ff4d4f",
                        }}
                      />

                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                        }}
                      >
                        {offlineCameras} Offline
                      </Text>
                    </Space>
                  </Space>

                  <Button
                    type="link"
                    size="small"
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                    onClick={() => setAllCameraOpen(true)}
                  >
                    View all cameras
                  </Button>
                </div>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card
            bordered={false}
            style={{
              height: "100%",
              borderRadius: 20,
              background: "#fff",
              border: "1px solid #e5ddf5",
              boxShadow: "0 10px 30px rgba(31,41,55,.07)",
              overflow: "hidden",
            }}
            styles={{
              body: {
                padding: 20,
              },
            }}
            title={
              <SectionHeader
                icon={<SafetyOutlined />}
                title="AI Detection"
                subtitle="Detection activity"
                background="#f6efff"
                border="#eadcff"
                color="#722ed1"
              />
            }
            extra={<Badge status="processing" text="Live" />}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <DetectionRow type="PERSON" value={persons} />

              <DetectionRow type="PPE" value={ppe} />

              <DetectionRow type="VEHICLE" value={vehicles} />

              <DetectionRow type="INTRUSION" value={intrusion} />

              <DetectionRow type="FIRE_SMOKE" value={fireSmoke} />

              <DetectionRow type="PEST" value={pest} />
            </div>

            <div
              style={{
                marginTop: 14,
                padding: "12px 13px",
                borderRadius: 13,
                background: "#f6ffed",
                border: "1px solid #d9f7be",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Space>
                <CheckCircleOutlined
                  style={{
                    color: "#52c41a",
                  }}
                />

                <Text strong>AI Detection Active</Text>
              </Space>

              <Badge status="success" text="Running" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ====================================================
          RECENT SAFETY ALERTS
      ==================================================== */}

      <Card
        bordered={false}
        style={{
          marginTop: 18,
          borderRadius: 20,
          background: "#ffffff",
          border: "1px solid #e1e7ef",
          boxShadow: "0 10px 30px rgba(31,41,55,.065)",
          overflow: "hidden",
        }}
        title={
          <SectionHeader
            icon={<WarningOutlined />}
            title="Recent Safety Alerts"
            subtitle="Latest AI detected safety events"
            background="#fff1f0"
            border="#ffe0dc"
            color="#ff4d4f"
          />
        }
        extra={
          <Space>
            {/* FULL PDF */}

            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              loading={pdfLoading}
              disabled={alerts.length === 0 || pdfLoading}
              onClick={downloadReportsPdf}
              style={{
                borderRadius: 8,
              }}
            >
              {!isSmall && "Download Full PDF"}
            </Button>

            <Button
              type="link"
              size="small"
              onClick={() => setAllReportsOpen(true)}
            >
              View All
            </Button>
          </Space>
        }
      >
        {reportLoading ? (
          <div
            style={{
              padding: 45,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Spin />
          </div>
        ) : alerts.length === 0 ? (
          <Empty description="No recent alerts" />
        ) : (
          <Table
            columns={alertColumns}
            dataSource={alerts}
            pagination={false}
            size={isMobile ? "small" : "middle"}
            scroll={{
              x: 1250,
            }}
          />
        )}
      </Card>

      {/* ====================================================
          ALL CAMERAS
      ==================================================== */}

      <Modal
        open={allCameraOpen}
        onCancel={() => setAllCameraOpen(false)}
        footer={null}
        width={isSmall ? "calc(100vw - 16px)" : "95vw"}
        title={
          <Space>
            <VideoCameraOutlined
              style={{
                color: "#1677ff",
              }}
            />

            <span
              style={{
                fontWeight: 700,
              }}
            >
              All Live Cameras
            </span>

            <Tag color="green">{onlineCameras} Online</Tag>

            <Tag color="red">{offlineCameras} Offline</Tag>
          </Space>
        }
        styles={{
          body: {
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
          },
        }}
      >
        {totalCameras === 0 ? (
          <Empty description="No cameras configured" />
        ) : (
          <Row gutter={[14, 14]}>
            {cameras.map((camera) => (
              <Col
                key={camera.cameraId || camera.id}
                xs={24}
                sm={12}
                md={8}
                lg={6}
              >
                <CameraCard camera={camera} onOpen={openCameraView} />
              </Col>
            ))}
          </Row>
        )}
      </Modal>

      {/* ====================================================
          ALL REPORTS
      ==================================================== */}

      <Modal
        open={allReportsOpen}
        onCancel={() => setAllReportsOpen(false)}
        footer={null}
        width={isSmall ? "calc(100vw - 16px)" : "95vw"}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              width: "100%",
            }}
          >
            <Space>
              <WarningOutlined
                style={{
                  color: "#ff4d4f",
                }}
              />

              <span
                style={{
                  fontWeight: 700,
                }}
              >
                Safety Reports
              </span>

              <Tag color="red">Open: {activeAlerts}</Tag>

              <Tag color="blue">Total: {totalReports}</Tag>
            </Space>

            {/* FULL PDF BUTTON */}

            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              loading={pdfLoading}
              disabled={alerts.length === 0 || pdfLoading}
              onClick={downloadReportsPdf}
              style={{
                borderRadius: 8,
              }}
            >
              Download Full PDF
            </Button>
          </div>
        }
        styles={{
          body: {
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
          },
        }}
      >
        <Table
          columns={alertColumns}
          dataSource={alerts}
          loading={reportLoading}
          rowKey={(record) => record.key || record.id}
          pagination={{
            current: pagination?.page || 1,
            pageSize: pagination?.limit || 20,
            total: pagination?.total || reports.length,
          }}
          scroll={{
            x: 1250,
          }}
          size={isMobile ? "small" : "middle"}
        />
      </Modal>

      {/* ====================================================
          LIVE CAMERA
      ==================================================== */}

      <Modal
        open={viewOpen}
        onCancel={closeCameraView}
        footer={null}
        centered
        width={isSmall ? "calc(100vw - 16px)" : 1000}
        title={
          <Space>
            <VideoCameraOutlined
              style={{
                color: "#1677ff",
              }}
            />

            <span>{selectedCamera?.name}</span>

            <Tag
              color={
                selectedCamera && isCameraOnline(selectedCamera)
                  ? "green"
                  : "red"
              }
            >
              {selectedCamera && isCameraOnline(selectedCamera)
                ? "LIVE"
                : "OFFLINE"}
            </Tag>
          </Space>
        }
      >
        {selectedCamera && (
          <>
            <div
              id="dashboard-live-preview"
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: 14,
                overflow: "hidden",
                background: "#080b0f",
                border: "1px solid #1e2938",
              }}
            >
              {isPlaying ? (
                <video
                  ref={videoRef}
                  controls
                  muted
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: "contain",
                  }}
                />
              ) : (
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
                      opacity: 0.3,
                      marginBottom: 15,
                    }}
                  />

                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                    }}
                  >
                    {selectedCamera.name}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: "#8c96a8",
                      fontSize: 12,
                    }}
                  >
                    {selectedCamera.location}
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {!isPlaying ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={playCamera}
                  style={{
                    borderRadius: 9,
                  }}
                >
                  Start Live View
                </Button>
              ) : (
                <Button
                  danger
                  size="large"
                  icon={<StopOutlined />}
                  onClick={stopCamera}
                  style={{
                    borderRadius: 9,
                  }}
                >
                  Stop
                </Button>
              )}

              <Button
                size="large"
                icon={<FullscreenOutlined />}
                onClick={fullscreenCamera}
                style={{
                  borderRadius: 9,
                }}
              >
                Fullscreen
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default Dashboard;













