
export const selectUsers = (state) => state.users.users;

export const selectSelectedUser = (state) => state.users.selectedUser;

export const selectUsersLoading = (state) => state.users.loading;

export const selectUserOperationLoading = (state) =>
    state.users.operationLoading;

export const selectUsersError = (state) => state.users.error;

export const selectUserById = (id) => (state) =>
    state.users.users.find((user) => String(user.id) === String(id));
