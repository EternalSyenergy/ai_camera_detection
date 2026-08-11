import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../feature/auth/authSlice";
import cameraReducer from "../feature/camera/cameraSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    camera: cameraReducer,
  },

  devTools: import.meta.env.DEV,
});

export default store;