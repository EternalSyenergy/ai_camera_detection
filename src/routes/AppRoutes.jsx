import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/login/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../components/layout/dashboardLayout/DashboardLayout";
import UserManagement from "../pages/UserManagement/UserManagement";
import CameraManagement from "../pages/cameraManagement/CameraManagement";
// import CameraList from "../pages/cameras/CameraList";   

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/" element={<Navigate to="/login" replace />} />

                <Route path="/login" element={<Login />} />

                {/* <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        /> */}


                <Route element={<DashboardLayout />}>

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/users"
                        element={<UserManagement />}
                    />

                    <Route
                        path="/cameras"
                        element={<CameraManagement/>}
                    />

                </Route>

            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;