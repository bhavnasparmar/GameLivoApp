import { useAppSelector } from '../redux/hooks';

// ─── useNetwork Hook ──────────────────────────────────────────────────────────

export const useNetwork = () => {
  const isConnected = useAppSelector(state => state.network.isConnected);
  const isInternetReachable = useAppSelector(state => state.network.isInternetReachable);
  return { isConnected, isInternetReachable, isOffline: !isConnected };
};
