import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SelectedLocation {
    latitude: number;
    longitude: number;
    address?: string;
}

interface LocationState {
    selectedLocation: SelectedLocation | null;
}

const initialState: LocationState = {
    selectedLocation: null,
};

const locationSlice = createSlice({
    name: 'location',
    initialState,
    reducers: {
        setSelectedLocation: (state, action: PayloadAction<SelectedLocation>) => {
            state.selectedLocation = action.payload;
        },
        clearSelectedLocation: (state) => {
            state.selectedLocation = null;
        },
    },
});

export const { setSelectedLocation, clearSelectedLocation } = locationSlice.actions;
export default locationSlice.reducer;
