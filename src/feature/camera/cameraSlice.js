// feature/camera/cameraSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import axiosClient from "../../api/axiosClient";

const API_URL = "http://localhost:3000/api/cameras";

// export const fetchCameras = createAsyncThunk(
//     "camera/fetchCameras",
//     async (_, { rejectWithValue }) => {
//         try {
//             const response = await axios.get(API_URL);

//             return response.data.data;
//         } catch (error) {
//             return rejectWithValue(
//                 error.response?.data?.message ||
//                     "Failed to fetch cameras"
//             );
//         }
//     }
// );


export const fetchCameras = createAsyncThunk(
    "camera/fetchCameras",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get("/cameras");

            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Failed to fetch cameras"
            );
        }
    }
);

const cameraSlice = createSlice({
    name: "camera",

    initialState: {
        cameras: [],
        loading: false,
        error: null,
    },

    reducers: {},

    extraReducers: (builder) => {
        builder
            .addCase(
                fetchCameras.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                fetchCameras.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.cameras = action.payload;
                }
            )

            .addCase(
                fetchCameras.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                }
            );
    },
});

export default cameraSlice.reducer;



// import {
//     createSlice,
//     createAsyncThunk,
// } from "@reduxjs/toolkit";

// import {
//     getCameras,
// } from "../../api/cameraApi";

// import API_ENDPOINTS from "../../constants/API_ENDPOINTS";

// // ============================================================
// // INITIAL STATE
// // ============================================================

// const initialState = {
//     cameras: [],
//     loading: false,
//     error: null,
// };

// // ============================================================
// // GET ALL CAMERAS
// // ============================================================

// export const fetchCameras = createAsyncThunk(
//     API_ENDPOINTS.CAMERA.LIST,

//     async (_, { rejectWithValue }) => {
//         try {
//             const response = await getCameras();

//             return response.data;
//         } catch (error) {
//             return rejectWithValue(
//                 error.response?.data?.message ||
//                     "Failed to fetch cameras"
//             );
//         }
//     }
// );

// // ============================================================
// // SLICE
// // ============================================================

// const cameraSlice = createSlice({
//     name: "camera",

//     initialState,

//     reducers: {
//         clearCameraError: (state) => {
//             state.error = null;
//         },

//         clearCameras: (state) => {
//             state.cameras = [];
//         },
//     },

//     extraReducers: (builder) => {
//         builder

//             // ==================================================
//             // FETCH CAMERAS - PENDING
//             // ==================================================

//             .addCase(
//                 fetchCameras.pending,
//                 (state) => {
//                     state.loading = true;
//                     state.error = null;
//                 }
//             )

//             // ==================================================
//             // FETCH CAMERAS - SUCCESS
//             // ==================================================

//             .addCase(
//                 fetchCameras.fulfilled,
//                 (state, action) => {
//                     state.loading = false;

//                     // If API returns:
//                     // { cameras: [...] }

//                     state.cameras =
//                         action.payload.cameras || [];
//                 }
//             )

//             // ==================================================
//             // FETCH CAMERAS - FAILED
//             // ==================================================

//             .addCase(
//                 fetchCameras.rejected,
//                 (state, action) => {
//                     state.loading = false;
//                     state.error = action.payload;
//                 }
//             );
//     },
// });

// export const {
//     clearCameraError,
//     clearCameras,
// } = cameraSlice.actions;

// export default cameraSlice.reducer;