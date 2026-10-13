
import { createSlice } from "@reduxjs/toolkit";

import {
    fetchUsers,
    fetchUserById,
    updateUser,
    updateUserStatus,
    deleteUser,
} from "../user/userThunk";

const initialState = {
    users: [],
    selectedUser: null,
    loading: false,
    operationLoading: false,
    error: null,
};

const userSlice = createSlice({
    name: "users",
    initialState,

    reducers: {
        clearUserError: (state) => {
            state.error = null;
        },

        clearSelectedUser: (state) => {
            state.selectedUser = null;
        },
    },

    extraReducers: (builder) => {
        builder

            // Fetch all users
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            })

            // Fetch one user
            .addCase(fetchUserById.pending, (state) => {
                state.operationLoading = true;
                state.error = null;
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.operationLoading = false;
                state.selectedUser = action.payload;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.operationLoading = false;
                state.error = action.payload || action.error.message;
            })

            // Update user
            .addCase(updateUser.pending, (state) => {
                state.operationLoading = true;
                state.error = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.operationLoading = false;

                const updatedUser = action.payload;
                const index = state.users.findIndex(
                    (user) => user.id === updatedUser.id
                );

                if (index !== -1) {
                    state.users[index] = updatedUser;
                }

                state.selectedUser = updatedUser;
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.operationLoading = false;
                state.error = action.payload || action.error.message;
            })

            // Change user status
            .addCase(updateUserStatus.pending, (state) => {
                state.operationLoading = true;
                state.error = null;
            })
            .addCase(updateUserStatus.fulfilled, (state, action) => {
                state.operationLoading = false;

                const updatedUser = action.payload;
                const index = state.users.findIndex(
                    (user) => user.id === updatedUser.id
                );

                if (index !== -1) {
                    state.users[index] = updatedUser;
                }

                if (state.selectedUser?.id === updatedUser.id) {
                    state.selectedUser = updatedUser;
                }
            })
            .addCase(updateUserStatus.rejected, (state, action) => {
                state.operationLoading = false;
                state.error = action.payload || action.error.message;
            })

            // Delete user
            .addCase(deleteUser.pending, (state) => {
                state.operationLoading = true;
                state.error = null;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.operationLoading = false;

                state.users = state.users.filter(
                    (user) => user.id !== action.payload
                );

                if (state.selectedUser?.id === action.payload) {
                    state.selectedUser = null;
                }
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.operationLoading = false;
                state.error = action.payload || action.error.message;
            });
    },
});

export const { clearUserError, clearSelectedUser } = userSlice.actions;

export default userSlice.reducer;
