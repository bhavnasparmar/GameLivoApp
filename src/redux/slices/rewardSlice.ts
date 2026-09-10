import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Reward {
  id: string;
  type: 'daily' | 'achievement' | 'referral' | 'event';
  title: string;
  description: string;
  coins: number;
  isClaimed: boolean;
  expiresAt?: string;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: string;
}

interface RewardState {
  coins: number;
  rewards: Reward[];
  transactions: Transaction[];
  referralCode: string | null;
  referralCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: RewardState = {
  coins: 0,
  rewards: [],
  transactions: [],
  referralCode: null,
  referralCount: 0,
  isLoading: false,
  error: null,
};

const rewardSlice = createSlice({
  name: 'reward',
  initialState,
  reducers: {
    setCoins: (state, action: PayloadAction<number>) => {
      state.coins = action.payload;
    },
    addCoins: (state, action: PayloadAction<number>) => {
      state.coins += action.payload;
    },
    deductCoins: (state, action: PayloadAction<number>) => {
      state.coins = Math.max(0, state.coins - action.payload);
    },
    setRewards: (state, action: PayloadAction<Reward[]>) => {
      state.rewards = action.payload;
    },
    claimReward: (state, action: PayloadAction<string>) => {
      const r = state.rewards.find(r => r.id === action.payload);
      if (r) r.isClaimed = true;
    },
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },
    setReferralCode: (state, action: PayloadAction<string>) => {
      state.referralCode = action.payload;
    },
    setReferralCount: (state, action: PayloadAction<number>) => {
      state.referralCount = action.payload;
    },
  },
});

export const { setCoins, addCoins, deductCoins, setRewards, claimReward, setTransactions, setReferralCode, setReferralCount } = rewardSlice.actions;
export default rewardSlice.reducer;
