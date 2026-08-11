const API_ENDPOINTS = {

  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REGISTER: "/auth/register",
    REFRESH_TOKEN: "/auth/refresh-token",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    CHANGE_PASSWORD: "/auth/change-password",
  },

  USER: {
    LIST: "/users",
    CREATE: "/users",
    UPDATE: "/users",
    DELETE: "/users",
    PROFILE: "/users/profile",
  },

  DEPARTMENT: {
    LIST: "/departments",
    CREATE: "/departments",
    UPDATE: "/departments",
    DELETE: "/departments",
  },

  ROLE: {
    LIST: "/roles",
    CREATE: "/roles",
    UPDATE: "/roles",
    DELETE: "/roles",
  },

  CAMERA: {
        LIST: "/cameras",
        BY_ID: "/cameras",
    },

};

export default API_ENDPOINTS;