// feature/camera/cameraSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import axiosClient from "../../api/axiosClient";

const API_URL = "http://localhost:3000/api/cameras";


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


