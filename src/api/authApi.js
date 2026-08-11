import axiosClient from "./axiosClient";

export const login = (data) => {
  return axiosClient.post("/auth/login", data);
};

export const getProfile = () => {
  return axiosClient.get("/users/profile");
};