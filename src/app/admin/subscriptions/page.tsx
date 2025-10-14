'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';
import {
  Search, Filter, Download, RefreshCw, TrendingUp, TrendingDown,
  Users, DollarSign, Calendar, AlertCircle, CheckCircle, XCircle,
  Edit, Trash2, Mail, Clock, CreditCard, BarChart3, ArrowUpRight
} from 'lucide-react';

// Types
interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  tier: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused';
  billing_period: 'monthly' | 'annual';
  amount: number;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  cancel_at: string | null;
  cancelled_at: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  card_brand?: string;
  card_last4?: string;
  receipt_url?: string;
}

interface SubscriptionHistory {
  id: string;
  action: string;
  old_tier?: string;
  new_tier?: string;
  old_status?: string;
  new_status?: string;
  reason?: string;
  performed_by?: string;
  is_automatic: boolean;
  created_at: string;
}

interface DashboardMetrics {
  total_subscriptions: number;
  active_subscriptions: number;
  trialing_subscriptions: number;
  cancelled_subscriptions: number;
  mrr: number;
  annual_revenue: number;
  churn_rate: number;
  trial_conversion_rate: number;
  avg_subscription_value: number;
  ltv: number;
}

export default function AdminSubscriptionsPage() {
  const { user, loading: authLoading, isEmployee } = useAuth();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // State
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [history, setHistory] = useState<SubscriptionHistory[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch subscriptions with user profiles
      const { data: subs, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format with user details
      const formattedSubs = subs.map((sub: any) => ({
        ...sub,
        user_email: sub.profiles?.email || 'N/A',
        user_name: sub.profiles?.full_name || 'Unknown'
      }));

      setSubscriptions(formattedSubs);
      setFilteredSubscriptions(formattedSubs);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Fetch dashboard metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_subscription_metrics');

      if (error) {
        console.error('Error fetching metrics:', error);
        // Calculate metrics manually if function doesn't exist
        calculateMetricsManually();
      } else {
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      calculateMetricsManually();
    }
  }, [supabase]);

  // Calculate metrics manually from subscriptions data
  const calculateMetricsManually = useCallback(() => {
    if (subscriptions.length === 0) {
      setMetrics(null);
      return;
    }

    const active = subscriptions.filter(s => s.status === 'active').length;
    const trialing = subscriptions.filter(s => s.status === 'trialing').length;
    const cancelled = subscriptions.filter(s => s.status === 'cancelled').length;

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = subscriptions
      .filter(s => s.status === 'active' || s.status === 'trialing')
      .reduce((sum, s) => {
        const monthly = s.billing_period === 'annual' ? s.amount / 12 : s.amount;
        return sum + monthly;
      }, 0);

    // Calculate ARR
    const arr = mrr * 12;

    // Churn rate (cancelled / total)
    const churnRate = subscriptions.length > 0
      ? (cancelled / subscriptions.length) * 100
      : 0;

    // Average subscription value
    const avgValue = subscriptions.length > 0
      ? subscriptions.reduce((sum, s) => sum + s.amount, 0) / subscriptions.length
      : 0;

    // Trial conversion rate (would need historical data)
    const trialConversion = 75; // Placeholder

    // LTV (simplified: avg value * 12 months / churn rate)
    const ltv = churnRate > 0 ? (avgValue * 12) / (churnRate / 100) : avgValue * 24;

    setMetrics({
      total_subscriptions: subscriptions.length,
      active_subscriptions: active,
      trialing_subscriptions: trialing,
      cancelled_subscriptions: cancelled,
      mrr: Math.round(mrr / 100),
      annual_revenue: Math.round(arr / 100),
      churn_rate: Math.round(churnRate * 10) / 10,
      trial_conversion_rate: trialConversion,
      avg_subscription_value: Math.round(avgValue / 100),
      ltv: Math.round(ltv / 100)
    });
  }, [subscriptions]);

  // Initial load
  useEffect(() => {
    if (isEmployee) {
      fetchSubscriptions();
    }
  }, [isEmployee, fetchSubscriptions]);

  useEffect(() => {
    calculateMetricsManually();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions]);

  // Filter subscriptions
  useEffect(() => {
    let filtered = subscriptions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.stripe_customer_id?.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(sub => sub.tier === tierFilter);
    }

    setFilteredSubscriptions(filtered);
  }, [searchTerm, statusFilter, tierFilter, subscriptions]);

  // Fetch subscription details
  const fetchSubscriptionDetails = async (subscription: Subscription) => {
    try {
      setSelectedSubscription(subscription);
      setShowDetailsModal(true);

      // Fetch payments
      const { data: paymentData } = await supabase
        .from('payments')
        .select('*')
        .eq('subscription_id', subscription.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (paymentData) setPayments(paymentData);

      // Fetch history
      const { data: historyData } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('subscription_id', subscription.id)
        .order('created_at', { ascending: false });

      if (historyData) setHistory(historyData);
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    }
  };

  // Admin actions
  const cancelSubscription = async (subscriptionId: string, reason: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      setActionLoading(true);

      // Call API to cancel in Stripe
      const response = await fetch('/api/admin/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: subscriptionId, reason })
      });

      if (!response.ok) throw new Error('Failed to cancel subscription');

      alert('Subscription cancelled successfully');
      fetchSubscriptions();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const upgradePlan = async (subscriptionId: string, newTier: string) => {
    if (!confirm(`Upgrade subscription to ${newTier}?`)) return;

    try {
      setActionLoading(true);

      const response = await fetch('/api/admin/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: subscriptionId, new_tier: newTier })
      });

      if (!response.ok) throw new Error('Failed to upgrade subscription');

      alert('Subscription upgraded successfully');
      fetchSubscriptions();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Failed to upgrade subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const extendTrial = async (subscriptionId: string, days: number) => {
    if (!confirm(`Extend trial by ${days} days?`)) return;

    try {
      setActionLoading(true);

      const response = await fetch('/api/admin/subscriptions/extend-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: subscriptionId, days })
      });

      if (!response.ok) throw new Error('Failed to extend trial');

      alert(`Trial extended by ${days} days`);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error extending trial:', error);
      alert('Failed to extend trial');
    } finally {
      setActionLoading(false);
    }
  };

  // Format helpers
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-blue-100 text-blue-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      paused: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      starter: 'bg-purple-100 text-purple-800',
      professional: 'bg-indigo-100 text-indigo-800',
      enterprise: 'bg-pink-100 text-pink-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tier as keyof typeof colors]}`}>
        {tier}
      </span>
    );
  };

  // Auth check
  if (!isEmployee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
              <p className="text-gray-600 mt-1">Monitor and manage all customer subscriptions</p>
            </div>
            <button
              onClick={fetchSubscriptions}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      {metrics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Subscriptions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Subscriptions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.total_subscriptions}</p>
                </div>
                <Users className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {metrics.active_subscriptions} Active
                </span>
                <span className="text-blue-600">{metrics.trialing_subscriptions} Trial</span>
              </div>
            </div>

            {/* MRR */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Monthly Recurring Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">${metrics.mrr.toLocaleString()}</p>
                </div>
                <DollarSign className="w-12 h-12 text-green-600 opacity-20" />
              </div>
              <div className="mt-4 text-sm text-gray-600">
                ARR: ${metrics.annual_revenue.toLocaleString()}
              </div>
            </div>

            {/* Churn Rate */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Churn Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.churn_rate}%</p>
                </div>
                <TrendingDown className="w-12 h-12 text-red-600 opacity-20" />
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Trial Conversion: {metrics.trial_conversion_rate}%
              </div>
            </div>

            {/* Average LTV */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Average LTV</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">${metrics.ltv.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Avg Value: ${metrics.avg_subscription_value}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by email, name, or customer ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="past_due">Past Due</option>
                <option value="cancelled">Cancelled</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            {/* Tier Filter */}
            <div>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="all">All Tiers</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading subscriptions...</p>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No subscriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Billing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => fetchSubscriptionDetails(sub)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{sub.user_name}</div>
                          <div className="text-sm text-gray-500">{sub.user_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTierBadge(sub.tier)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sub.billing_period === 'annual' ? 'Annual' : 'Monthly'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(sub.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {sub.next_billing_date ? formatDate(sub.next_billing_date) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchSubscriptionDetails(sub);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Details Modal */}
      {showDetailsModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Subscription Details</h2>
                <p className="text-gray-600 text-sm mt-1">{selectedSubscription.user_email}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Subscription Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tier</p>
                    <p className="font-medium text-gray-900 mt-1">{getTierBadge(selectedSubscription.tier)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium text-gray-900 mt-1">{getStatusBadge(selectedSubscription.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Billing Period</p>
                    <p className="font-medium text-gray-900 mt-1">{selectedSubscription.billing_period}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-medium text-gray-900 mt-1">{formatCurrency(selectedSubscription.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium text-gray-900 mt-1">{formatDate(selectedSubscription.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Next Billing</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedSubscription.next_billing_date ? formatDate(selectedSubscription.next_billing_date) : 'N/A'}
                    </p>
                  </div>
                  {selectedSubscription.trial_end && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Trial Start</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {selectedSubscription.trial_start ? formatDate(selectedSubscription.trial_start) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Trial End</p>
                        <p className="font-medium text-gray-900 mt-1">{formatDate(selectedSubscription.trial_end)}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedSubscription.status === 'trialing' && (
                    <button
                      onClick={() => extendTrial(selectedSubscription.stripe_subscription_id, 7)}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Clock className="w-4 h-4" />
                      Extend Trial (7 days)
                    </button>
                  )}
                  {selectedSubscription.tier !== 'enterprise' && (
                    <button
                      onClick={() => upgradePlan(selectedSubscription.stripe_subscription_id, 'enterprise')}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Upgrade to Enterprise
                    </button>
                  )}
                  {selectedSubscription.status !== 'cancelled' && (
                    <button
                      onClick={() => cancelSubscription(selectedSubscription.stripe_subscription_id, 'Admin cancellation')}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Subscription
                    </button>
                  )}
                  <a
                    href={`mailto:${selectedSubscription.user_email}`}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <Mail className="w-4 h-4" />
                    Email Customer
                  </a>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                {payments.length === 0 ? (
                  <p className="text-gray-600 text-sm">No payments recorded yet</p>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-gray-600">{formatDate(payment.created_at)}</p>
                          {payment.card_brand && (
                            <p className="text-sm text-gray-500">
                              {payment.card_brand} •••• {payment.card_last4}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {getStatusBadge(payment.status)}
                          {payment.receipt_url && (
                            <a
                              href={payment.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-purple-600 hover:text-purple-800 mt-1"
                            >
                              View Receipt
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subscription History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription History</h3>
                {history.length === 0 ? (
                  <p className="text-gray-600 text-sm">No history recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{event.action.replace(/_/g, ' ').toUpperCase()}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(event.created_at)} • {event.is_automatic ? 'Automatic' : 'Manual'}
                          </p>
                          {event.reason && (
                            <p className="text-sm text-gray-500 mt-1">Reason: {event.reason}</p>
                          )}
                        </div>
                        {(event.old_tier || event.new_tier) && (
                          <div className="text-right text-sm">
                            {event.old_tier && <span className="text-gray-500">{event.old_tier}</span>}
                            {event.old_tier && event.new_tier && <span className="text-gray-400 mx-1">→</span>}
                            {event.new_tier && <span className="font-medium text-gray-900">{event.new_tier}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end sticky bottom-0">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
