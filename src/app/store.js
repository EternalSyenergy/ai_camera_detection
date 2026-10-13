import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../feature/auth/authSlice";
import cameraReducer from "../feature/camera/cameraSlice";
import reportReducer from "../feature/report/reportSlice";
import userReducer from "../feature/user/userSlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    camera: cameraReducer,
    report: reportReducer,
    users: userReducer,
  },

  devTools: import.meta.env.DEV,
});

export default store;