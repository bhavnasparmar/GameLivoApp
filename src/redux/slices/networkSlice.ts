import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
}

const initialState: NetworkState = {
  isConnected: true,
  isInternetReachable: null,
  connectionType: null,
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkState: (state, action: PayloadAction<Partial<NetworkState>>) => {
      return { ...state, ...action.payload };
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
  },
});

export const { setNetworkState, setConnected } = networkSlice.actions;
export default networkSlice.reducer;
