
import { createAsyncThunk } from "@reduxjs/toolkit";

import {
    getUsers,
    getUserById,
    updateUserApi,
    updateUserStatusApi,
    deleteUserApi,
    createUserApi
} from "../../api/userApi";

// Fetch all users
export const fetchUsers = createAsyncThunk(
    "users/fetchUsers",
    async (_, { rejectWithValue }) => {
        try {
            const response = await getUsers();
            const users = response.data?.data;

            if (!Array.isArray(users)) {
                throw new Error("Invalid users response");
            }

            return users;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch users"
            );
        }
    }
);

// Fetch user by ID
export const fetchUserById = createAsyncThunk(
    "users/fetchUserById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await getUserById(id);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch user"
            );
        }
    }
);

// Update user details
export const updateUser = createAsyncThunk(
    "users/updateUser",
    async ({ id, name, department }, { rejectWithValue }) => {
        try {
            const response = await updateUserApi(id, {
                name,
                department,
            });

            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to update user"
            );
        }
    }
);

// Activate or deactivate user
export const updateUserStatus = createAsyncThunk(
    "users/updateUserStatus",
    async ({ id, status }, { rejectWithValue }) => {
        try {
            const response = await updateUserStatusApi(id, status);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to update user status"
            );
        }
    }
);

// Delete user
export const deleteUser = createAsyncThunk(
    "users/deleteUser",
    async (id, { rejectWithValue }) => {
        try {
            await deleteUserApi(id);
            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to delete user"
            );
        }
    }
);


export const addUser = createAsyncThunk(
  "users/addUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await createUserApi(userData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to create user"
      );
    }
  }
);
