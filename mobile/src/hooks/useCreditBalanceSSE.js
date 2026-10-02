import { useEffect, useState } from 'react';
import { balanceSSEClient } from '../services/balanceSSEClient';
import { useAuthStore } from '../store/useAuthStore';

export function useCreditBalanceSSE(onBalanceUpdate) {
  const [latestData, setLatestData] = useState(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = balanceSSEClient.subscribe((data) => {
      setLatestData(data);
      if (typeof onBalanceUpdate === 'function') {
        try {
          onBalanceUpdate(data);
        } catch (err) {
          console.warn('[useCreditBalanceSSE] Error in callback:', err);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, onBalanceUpdate]);

  return {
    latestData,
    isConnected: balanceSSEClient.isConnected,
  };
}

export default useCreditBalanceSSE;
