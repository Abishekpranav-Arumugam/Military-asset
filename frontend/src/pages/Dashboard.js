import React, { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CubeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DatePicker from 'react-datepicker';

const Dashboard = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    assetCategory: '',
    baseId: user?.role !== 'admin' ? user?.baseId?._id : ''
  });

  const { data: metrics, isLoading } = useQuery(
    ['dashboard-metrics', filters],
    async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.assetCategory) params.append('assetCategory', filters.assetCategory);
      if (filters.baseId) params.append('baseId', filters.baseId);
      
      const response = await api.get(`/dashboard/metrics?${params}`);
      return response.data;
    },
    { refetchInterval: 30000 }
  );

  const MetricCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500'
    };

    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Icon className={`h-6 w-6 text-white p-1 rounded ${colorClasses[color]}`} />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </div>
                  {trend && (
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      trend > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trend > 0 ? (
                        <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                      ) : (
                        <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                      )}
                      <span className="sr-only">{trend > 0 ? 'Increased' : 'Decreased'} by</span>
                      {Math.abs(trend)}%
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Asset management overview for {user?.baseId?.name || 'All Bases'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => setFilters({ ...filters, startDate: date })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => setFilters({ ...filters, endDate: date })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset Category</label>
            <select
              value={filters.assetCategory}
              onChange={(e) => setFilters({ ...filters, assetCategory: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
            >
              <option value="">All Categories</option>
              <option value="vehicle">Vehicles</option>
              <option value="weapon">Weapons</option>
              <option value="ammunition">Ammunition</option>
              <option value="equipment">Equipment</option>
              <option value="supplies">Supplies</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <MetricCard
          title="Opening Balance"
          value={metrics?.openingBalance || 0}
          icon={ChartBarIcon}
          color="blue"
        />
        <MetricCard
          title="Closing Balance"
          value={metrics?.closingBalance || 0}
          icon={CubeIcon}
          color="green"
        />
        <MetricCard
          title="Net Movement"
          value={metrics?.netMovement || 0}
          icon={ArrowTrendingUpIcon}
          color="purple"
        />
        <MetricCard
          title="Assigned"
          value={metrics?.assigned || 0}
          icon={UserGroupIcon}
          color="yellow"
        />
        <MetricCard
          title="Expended"
          value={metrics?.expended || 0}
          icon={ArrowTrendingDownIcon}
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Transaction Summary Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Summary</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics?.transactionSummary || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalQuantity" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics?.categoryBreakdown || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="currentBalance"
              >
                {(metrics?.categoryBreakdown || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(metrics?.recentTransactions || []).map((transaction) => (
                <tr key={transaction._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'purchase' ? 'bg-green-100 text-green-800' :
                      transaction.type === 'transfer_out' ? 'bg-red-100 text-red-800' :
                      transaction.type === 'transfer_in' ? 'bg-blue-100 text-blue-800' :
                      transaction.type === 'assignment' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.assetId?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.baseId?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.createdBy?.rank} {transaction.createdBy?.firstName} {transaction.createdBy?.lastName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
