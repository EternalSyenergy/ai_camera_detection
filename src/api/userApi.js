
import axiosClient from "./axiosClient";
import API_ENDPOINTS from "../constants/API_ENDPOINTS";

// Fetch all users
export const getUsers = () => {
    return axiosClient.get(API_ENDPOINTS.USER.LIST);
};

// Fetch user by ID
export const getUserById = (id) => {
    return axiosClient.get(`${API_ENDPOINTS.USER.LIST}/${id}`);
};

// Update user
export const updateUserApi = (id, data) => {
    return axiosClient.patch(
        `${API_ENDPOINTS.USER.UPDATE}/${id}`,
        data
    );
};

// Activate or deactivate user
export const updateUserStatusApi = (id, status) => {
    return axiosClient.patch(
        `${API_ENDPOINTS.USER.UPDATE}/${id}/status`,
        { status }
    );
};

// Delete user
export const deleteUserApi = (id) => {
    return axiosClient.delete(
        `${API_ENDPOINTS.USER.DELETE}/${id}`
    );
};



export const createUserApi = (data) =>
  axiosClient.post(API_ENDPOINTS.USER.CREATE, data);