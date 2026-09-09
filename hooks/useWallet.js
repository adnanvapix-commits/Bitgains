'use client';

import { useState, useEffect } from 'react';
import { walletApi, transactionApi } from '../lib/api/transactions.js';

export const useWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch wallet data
      const walletResponse = await walletApi.getWallet();
      if (walletResponse.success) {
        setWallet(walletResponse.data.wallet);
      }

      // Fetch recent transactions
      const transactionResponse = await transactionApi.getHistory({ limit: 10 });
      if (transactionResponse.success) {
        setTransactions(transactionResponse.data.transactions);
      }

    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setError(error.message || 'Failed to fetch wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const createDeposit = async (depositData) => {
    try {
      const response = await transactionApi.createDeposit(depositData);
      if (response.success) {
        // Refresh data after successful deposit request
        await fetchWalletData();
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error creating deposit:', error);
      return { success: false, message: error.message };
    }
  };

  const createWithdrawal = async (withdrawalData) => {
    try {
      const response = await transactionApi.createWithdrawal(withdrawalData);
      if (response.success) {
        // Refresh data after successful withdrawal request
        await fetchWalletData();
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      return { success: false, message: error.message };
    }
  };

  const stakeFunds = async (stakeData) => {
    try {
      const response = await transactionApi.stakeFunds(stakeData);
      if (response.success) {
        // Refresh data after successful stake
        await fetchWalletData();
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error staking funds:', error);
      return { success: false, message: error.message };
    }
  };

  const unstakeFunds = async (unstakeData) => {
    try {
      const response = await transactionApi.unstakeFunds(unstakeData);
      if (response.success) {
        // Refresh data after successful unstake
        await fetchWalletData();
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error unstaking funds:', error);
      return { success: false, message: error.message };
    }
  };

  const updateRewards = async () => {
    try {
      const response = await walletApi.updateRewards();
      if (response.success) {
        // Refresh data after rewards update
        await fetchWalletData();
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error updating rewards:', error);
      return { success: false, message: error.message };
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchWalletData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWalletData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    wallet,
    transactions,
    isLoading,
    error,
    fetchWalletData,
    createDeposit,
    createWithdrawal,
    stakeFunds,
    unstakeFunds,
    updateRewards,
  };
};

export default useWallet;