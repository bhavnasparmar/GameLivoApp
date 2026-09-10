import { RootState } from '../store';

export const selectUserProfile = (state: RootState) => state.user.profile;
export const selectUserCoins = (state: RootState) => state.user.profile?.coins ?? 0;
export const selectUserLevel = (state: RootState) => state.user.profile?.level ?? 1;
export const selectUserAvatar = (state: RootState) => state.user.profile?.avatar;
export const selectUserDisplayName = (state: RootState) => state.user.profile?.name ?? '';
