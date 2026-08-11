import axios from "axios";
import API_ENDPOINTS from "../constants/API_ENDPOINTS";

export const getCameras = () => {
    return axios.get(API_ENDPOINTS.CAMERA.LIST);
};

export const getCameraById = (cameraId) => {
    return axios.get(
        `${API_ENDPOINTS.CAMERA.LIST}/${cameraId}`
    );
};