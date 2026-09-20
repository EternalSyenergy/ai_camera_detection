// feature/report/reportSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";


// =====================================================
// FETCH ALL REPORTS
// =====================================================

export const fetchReports = createAsyncThunk(
    "report/fetchReports",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(
                "/reports",
                {
                    params,
                }
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Failed to fetch reports"
            );
        }
    }
);


// =====================================================
// FETCH SINGLE REPORT
// =====================================================

export const fetchReportById = createAsyncThunk(
    "report/fetchReportById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(
                `/reports/${id}`
            );

            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Failed to fetch report"
            );
        }
    }
);


// =====================================================
// CREATE REPORT
// =====================================================

export const createReport = createAsyncThunk(
    "report/createReport",
    async (reportData, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(
                "/reports",
                reportData
            );

            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Failed to create report"
            );
        }
    }
);


// =====================================================
// UPDATE REPORT
// =====================================================

export const updateReport = createAsyncThunk(
    "report/updateReport",
    async (
        { id, data },
        { rejectWithValue }
    ) => {
        try {
            const response = await axiosClient.put(
                `/reports/${id}`,
                data
            );

            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Failed to update report"
            );
        }
    }
);


// =====================================================
// UPDATE REPORT STATUS
// =====================================================

export const updateReportStatus = createAsyncThunk(
    "report/updateReportStatus",
    async (
        { id, status },
        { rejectWithValue }
    ) => {
        try {
            const response = await axiosClient.patch(
                `/reports/${id}/status`,
                {
                    status,
                }
            );

            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Failed to update report status"
            );
        }
    }
);


// =====================================================
// DELETE REPORT
// =====================================================

export const deleteReport = createAsyncThunk(
    "report/deleteReport",
    async (id, { rejectWithValue }) => {
        try {
            await axiosClient.delete(
                `/reports/${id}`
            );

            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Failed to delete report"
            );
        }
    }
);


// =====================================================
// DELETE MULTIPLE REPORTS
// =====================================================

export const deleteMultipleReports =
    createAsyncThunk(
        "report/deleteMultipleReports",
        async (ids, { rejectWithValue }) => {
            try {
                const response =
                    await axiosClient.delete(
                        "/reports",
                        {
                            data: {
                                ids,
                            },
                        }
                    );

                return {
                    ids,
                    data: response.data.data,
                };
            } catch (error) {
                return rejectWithValue(
                    error.response?.data?.message ||
                        "Failed to delete reports"
                );
            }
        }
    );


// =====================================================
// FETCH REPORT SUMMARY
// =====================================================

export const fetchReportSummary =
    createAsyncThunk(
        "report/fetchReportSummary",
        async (_, { rejectWithValue }) => {
            try {
                const response =
                    await axiosClient.get(
                        "/reports/summary"
                    );

                return response.data.data;
            } catch (error) {
                return rejectWithValue(
                    error.response?.data?.message ||
                        "Failed to fetch report summary"
                );
            }
        }
    );


// =====================================================
// FETCH DETECTION COUNTS
// =====================================================

export const fetchDetectionCounts =
    createAsyncThunk(
        "report/fetchDetectionCounts",
        async (_, { rejectWithValue }) => {
            try {
                const response =
                    await axiosClient.get(
                        "/reports/detection-counts"
                    );

                return response.data.data;
            } catch (error) {
                return rejectWithValue(
                    error.response?.data?.message ||
                        "Failed to fetch detection counts"
                );
            }
        }
    );


// =====================================================
// FETCH STATUS COUNTS
// =====================================================

export const fetchStatusCounts =
    createAsyncThunk(
        "report/fetchStatusCounts",
        async (_, { rejectWithValue }) => {
            try {
                const response =
                    await axiosClient.get(
                        "/reports/status-counts"
                    );

                return response.data.data;
            } catch (error) {
                return rejectWithValue(
                    error.response?.data?.message ||
                        "Failed to fetch status counts"
                );
            }
        }
    );


// =====================================================
// FETCH LATEST REPORTS
// =====================================================

export const fetchLatestReports =
    createAsyncThunk(
        "report/fetchLatestReports",
        async (limit = 10, { rejectWithValue }) => {
            try {
                const response =
                    await axiosClient.get(
                        "/reports/latest",
                        {
                            params: {
                                limit,
                            },
                        }
                    );

                return response.data.data;
            } catch (error) {
                return rejectWithValue(
                    error.response?.data?.message ||
                        "Failed to fetch latest reports"
                );
            }
        }
    );


// =====================================================
// FETCH OPEN REPORTS
// =====================================================

export const fetchOpenReports =
    createAsyncThunk(
        "report/fetchOpenReports",
        async (_, { rejectWithValue }) => {
            try {
                const response =
                    await axiosClient.get(
                        "/reports/open"
                    );

                return response.data.data;
            } catch (error) {
                return rejectWithValue(
                    error.response?.data?.message ||
                        "Failed to fetch open reports"
                );
            }
        }
    );


// =====================================================
// REPORT SLICE
// =====================================================

const reportSlice = createSlice({
    name: "report",

    initialState: {
        reports: [],

        selectedReport: null,

        summary: {
            total: 0,
            open: 0,
            acknowledged: 0,
            resolved: 0,
            false_positive: 0,
        },

        detectionCounts: [],

        statusCounts: [],

        latestReports: [],

        openReports: [],

        pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
        },

        loading: false,

        creating: false,

        updating: false,

        deleting: false,

        summaryLoading: false,

        error: null,
    },

    reducers: {
        clearSelectedReport: (state) => {
            state.selectedReport = null;
        },

        clearReportError: (state) => {
            state.error = null;
        },

        clearReports: (state) => {
            state.reports = [];
        },
    },

    extraReducers: (builder) => {
        builder

            // =================================================
            // FETCH REPORTS
            // =================================================

            .addCase(
                fetchReports.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                fetchReports.fulfilled,
                (state, action) => {
                    state.loading = false;

                    state.reports =
                        action.payload.reports || [];

                    state.pagination =
                        action.payload.pagination || {
                            page: 1,
                            limit: 20,
                            total: 0,
                            totalPages: 0,
                        };
                }
            )

            .addCase(
                fetchReports.rejected,
                (state, action) => {
                    state.loading = false;

                    state.error =
                        action.payload;
                }
            )


            // =================================================
            // FETCH SINGLE REPORT
            // =================================================

            .addCase(
                fetchReportById.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                fetchReportById.fulfilled,
                (state, action) => {
                    state.loading = false;

                    state.selectedReport =
                        action.payload;
                }
            )

            .addCase(
                fetchReportById.rejected,
                (state, action) => {
                    state.loading = false;

                    state.error =
                        action.payload;
                }
            )


            // =================================================
            // CREATE REPORT
            // =================================================

            .addCase(
                createReport.pending,
                (state) => {
                    state.creating = true;
                    state.error = null;
                }
            )

            .addCase(
                createReport.fulfilled,
                (state, action) => {
                    state.creating = false;

                    state.reports.unshift(
                        action.payload
                    );

                    state.summary.total += 1;

                    if (
                        action.payload.status ===
                        "OPEN"
                    ) {
                        state.summary.open += 1;
                    }
                }
            )

            .addCase(
                createReport.rejected,
                (state, action) => {
                    state.creating = false;

                    state.error =
                        action.payload;
                }
            )


            // =================================================
            // UPDATE REPORT
            // =================================================

            .addCase(
                updateReport.pending,
                (state) => {
                    state.updating = true;
                    state.error = null;
                }
            )

            .addCase(
                updateReport.fulfilled,
                (state, action) => {
                    state.updating = false;

                    const updatedReport =
                        action.payload;

                    const index =
                        state.reports.findIndex(
                            (report) =>
                                report.id ===
                                updatedReport.id
                        );

                    if (index !== -1) {
                        state.reports[index] =
                            updatedReport;
                    }

                    if (
                        state.selectedReport?.id ===
                        updatedReport.id
                    ) {
                        state.selectedReport =
                            updatedReport;
                    }
                }
            )

            .addCase(
                updateReport.rejected,
                (state, action) => {
                    state.updating = false;

                    state.error =
                        action.payload;
                }
            )


            // =================================================
            // UPDATE STATUS
            // =================================================

            .addCase(
                updateReportStatus.pending,
                (state) => {
                    state.updating = true;
                    state.error = null;
                }
            )

            .addCase(
                updateReportStatus.fulfilled,
                (state, action) => {
                    state.updating = false;

                    const updatedReport =
                        action.payload;

                    const index =
                        state.reports.findIndex(
                            (report) =>
                                report.id ===
                                updatedReport.id
                        );

                    if (index !== -1) {
                        state.reports[index] =
                            updatedReport;
                    }

                    if (
                        state.selectedReport?.id ===
                        updatedReport.id
                    ) {
                        state.selectedReport =
                            updatedReport;
                    }
                }
            )

            .addCase(
                updateReportStatus.rejected,
                (state, action) => {
                    state.updating = false;

                    state.error =
                        action.payload;
                }
            )


            // =================================================
            // DELETE REPORT
            // =================================================

            .addCase(
                deleteReport.pending,
                (state) => {
                    state.deleting = true;
                    state.error = null;
                }
            )

            .addCase(
                deleteReport.fulfilled,
                (state, action) => {
                    state.deleting = false;

                    state.reports =
                        state.reports.filter(
                            (report) =>
                                report.id !==
                                action.payload
                        );

                    if (
                        state.selectedReport?.id ===
                        action.payload
                    ) {
                        state.selectedReport = null;
                    }
                }
            )

            .addCase(
                deleteReport.rejected,
                (state, action) => {
                    state.deleting = false;

                    state.error =
                        action.payload;
                }
            )


            // =================================================
            // DELETE MULTIPLE
            // =================================================

            .addCase(
                deleteMultipleReports.pending,
                (state) => {
                    state.deleting = true;
                    state.error = null;
                }
            )

            .addCase(
                deleteMultipleReports.fulfilled,
                (state, action) => {
                    state.deleting = false;

                    const ids =
                        action.payload.ids;

                    state.reports =
                        state.reports.filter(
                            (report) =>
                                !ids.includes(
                                    report.id
                                )
                        );
                }
            )

            .addCase(
                deleteMultipleReports.rejected,
                (state, action) => {
                    state.deleting = false;

                    state.error =
                        action.payload;
                }
            )


            // =================================================
            // SUMMARY
            // =================================================

            .addCase(
                fetchReportSummary.pending,
                (state) => {
                    state.summaryLoading = true;
                    state.error = null;
                }
            )

            .addCase(
                fetchReportSummary.fulfilled,
                (state, action) => {
                    state.summaryLoading = false;

                    state.summary =
                        action.payload;
                }
            )

            .addCase(
                fetchReportSummary.rejected,
                (state, action) => {
                    state.summaryLoading = false;

                    state.error =
                        action.payload;
                }
            )


            // =================================================
            // DETECTION COUNTS
            // =================================================

            .addCase(
                fetchDetectionCounts.fulfilled,
                (state, action) => {
                    state.detectionCounts =
                        action.payload;
                }
            )


            // =================================================
            // STATUS COUNTS
            // =================================================

            .addCase(
                fetchStatusCounts.fulfilled,
                (state, action) => {
                    state.statusCounts =
                        action.payload;
                }
            )


            // =================================================
            // LATEST REPORTS
            // =================================================

            .addCase(
                fetchLatestReports.fulfilled,
                (state, action) => {
                    state.latestReports =
                        action.payload;
                }
            )


            // =================================================
            // OPEN REPORTS
            // =================================================

            .addCase(
                fetchOpenReports.fulfilled,
                (state, action) => {
                    state.openReports =
                        action.payload;
                }
            );
    },
});


// =====================================================
// ACTIONS
// =====================================================

export const {
    clearSelectedReport,
    clearReportError,
    clearReports,
} = reportSlice.actions;


// =====================================================
// SELECTORS
// =====================================================

export const selectReports = (state) =>
    state.report.reports;

export const selectSelectedReport = (state) =>
    state.report.selectedReport;

export const selectReportSummary = (state) =>
    state.report.summary;

export const selectDetectionCounts = (state) =>
    state.report.detectionCounts;

export const selectStatusCounts = (state) =>
    state.report.statusCounts;

export const selectLatestReports = (state) =>
    state.report.latestReports;

export const selectOpenReports = (state) =>
    state.report.openReports;

export const selectReportPagination = (state) =>
    state.report.pagination;

export const selectReportLoading = (state) =>
    state.report.loading;

export const selectReportError = (state) =>
    state.report.error;


export default reportSlice.reducer;