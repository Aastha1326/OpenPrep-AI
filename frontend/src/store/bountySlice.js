import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Enterprise Redux Toolkit Slice: Bounty / Gamification State
 * 
 * Manages the asynchronous decryption attempts, user inventory syncing, 
 * and global gamification metadata across the entire OpenPrep-AI frontend application.
 */

// Initial State Definition
const initialState = {
    isProcessingClaim: false,
    claimError: null,
    claimSuccess: null,
    studentStats: {
        reputationPoints: 0,
        globalRank: 0,
        tierData: {
            name: 'Bronze',
            hex: '#b45309'
        }
    },
    inventory: [],
    history: [],
    lastSynced: null,
    activeSponsors: [] // Hydrated on mount from public enterprise registry
};

// Async Thunks for Interfacing with BountyRPCService
export const submitTokenClaim = createAsyncThunk(
    'bounty/submitTokenClaim',
    async ({ token, metadata }, { rejectWithValue, dispatch }) => {
        try {
            // Standard fetch pattern matching the robust REST constraint in the backend
            const response = await fetch('/api/v1/gamification/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, metadata })
            });

            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.displayMessage || 'Decryption failed.');
            }

            const data = await response.json();

            // Dispatch secondary hydration immediately to sync inventory
            dispatch(fetchStudentInventory());

            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Network constraint dropped the connection.');
        }
    }
);

export const fetchStudentInventory = createAsyncThunk(
    'bounty/fetchInventory',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/v1/gamification/inventory');
            if (!response.ok) throw new Error('Inventory sync failed');
            return await response.json();
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

// Global Redux Slice Configuration
const bountySlice = createSlice({
    name: 'bounty',
    initialState,
    reducers: {
        clearClaimStatus: (state) => {
            state.claimError = null;
            state.claimSuccess = null;
        },
        resetGamificationState: () => initialState,
        applyOptimisticPoints: (state, action) => {
            // Allows the HUD to flash updates BEFORE the network confirms for a snappy UX
            state.studentStats.reputationPoints += action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Submit Token Flow
            .addCase(submitTokenClaim.pending, (state) => {
                state.isProcessingClaim = true;
                state.claimError = null;
                state.claimSuccess = null;
            })
            .addCase(submitTokenClaim.fulfilled, (state, action) => {
                state.isProcessingClaim = false;
                state.claimSuccess = action.payload.message;
                state.studentStats.reputationPoints = action.payload.newTotalReputation;

                // Push the sponsor interaction logically to the history log
                state.history.unshift({
                    companyName: action.payload.sponsorName,
                    brandColor: action.payload.bannerColor,
                    timestamp: new Date().toISOString()
                });

                // Ensure history cap to prevent memory bloating on SPA
                if (state.history.length > 50) {
                    state.history = state.history.slice(0, 50);
                }
            })
            .addCase(submitTokenClaim.rejected, (state, action) => {
                state.isProcessingClaim = false;
                state.claimError = action.payload;
            })

            // Inventory Sync Flow
            .addCase(fetchStudentInventory.fulfilled, (state, action) => {
                state.inventory = action.payload.items;
                state.lastSynced = new Date().toISOString();
            });
    }
});

// Selectors for Memoized Hook Extractions
export const selectBountyStats = (state) => state.bounty.studentStats;
export const selectBountyInventory = (state) => state.bounty.inventory;
export const selectBountyHistory = (state) => state.bounty.history;
export const selectClaimLoadingState = (state) => state.bounty.isProcessingClaim;

export const { clearClaimStatus, resetGamificationState, applyOptimisticPoints } = bountySlice.actions;

export default bountySlice.reducer;
