import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { login } from "../../api/authApi";

import API_ENDPOINTS from "../../constants/API_ENDPOINTS";

let storedUser = null;

try {
  const user = localStorage.getItem("user");

  if (user && user !== "undefined") {
    storedUser = JSON.parse(user);
  }
} catch (error) {
  console.error("Invalid user in localStorage:", error);
  localStorage.removeItem("user");
}

const initialState = {
  // user: JSON.parse(localStorage.getItem("user")) || null,
   user:storedUser,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem("token"),
};

// Async Login Action
export const loginUser = createAsyncThunk(
  API_ENDPOINTS.AUTH.LOGIN,
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await login(credentials);

      // Save token & user
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.isAuthenticated = false;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // Login Pending
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // Login Success
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })

      // Login Failed
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });
  },
});





export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;