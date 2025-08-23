import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import api from '../api';
import { toast } from 'react-toastify';
import { UserIcon, MinusIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';

const Assignments = () => {
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showExpendForm, setShowExpendForm] = useState(false);
  const [activeTab, setActiveTab] = useState('assignments');
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    assetCategory: ''
  });
  
  const queryClient = useQueryClient();
  
  const { register: registerAssign, handleSubmit: handleAssignSubmit, reset: resetAssign, formState: { errors: assignErrors } } = useForm();
  const { register: registerExpend, handleSubmit: handleExpendSubmit, reset: resetExpend, formState: { errors: expendErrors } } = useForm();

  // Fetch assignments
  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery(
    ['assignments', filters],
    async () => {
      const params = new URLSearchParams({ type: 'assignment' });
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.assetCategory) params.append('assetCategory', filters.assetCategory);
      
      const response = await api.get(`/transactions?${params}`);
      return response.data;
    }
  );

  // Fetch expenditures
  const { data: expendituresData, isLoading: expendituresLoading } = useQuery(
    ['expenditures', filters],
    async () => {
      const params = new URLSearchParams({ type: 'expenditure' });
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.assetCategory) params.append('assetCategory', filters.assetCategory);
      
      const response = await api.get(`/transactions?${params}`);
      return response.data;
    }
  );

  // Fetch assets for dropdown
  const { data: assets } = useQuery('assets', async () => {
    const res = await api.get('/assets', { params: { isActive: true, limit: 1000 } });
    return res.data.assets;
  });

  // Fetch bases for dropdown
  const { data: bases } = useQuery('bases', async () => {
    const res = await api.get('/bases', { params: { isActive: true, limit: 1000 } });
    return res.data.bases;
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation(
    (assignmentData) => api.post('/transactions/assignment', assignmentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('assignments');
        queryClient.invalidateQueries('dashboard-metrics');
        toast.success('Assignment recorded successfully');
        setShowAssignForm(false);
        resetAssign();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record assignment');
      }
    }
  );

  // Create expenditure mutation
  const createExpenditureMutation = useMutation(
    (expenditureData) => api.post('/transactions/expenditure', expenditureData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('expenditures');
        queryClient.invalidateQueries('dashboard-metrics');
        toast.success('Expenditure recorded successfully');
        setShowExpendForm(false);
        resetExpend();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record expenditure');
      }
    }
  );

  const onAssignSubmit = (data) => {
    const assignmentData = {
      ...data,
      quantity: parseFloat(data.quantity),
      assignedTo: {
        personnelId: data.personnelId,
        personnelName: data.personnelName,
        rank: data.rank,
        unit: data.unit
      }
    };
    createAssignmentMutation.mutate(assignmentData);
  };

  const onExpendSubmit = (data) => {
    const expenditureData = {
      ...data,
      quantity: parseFloat(data.quantity)
    };
    createExpenditureMutation.mutate(expenditureData);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments & Expenditures</h1>
          <p className="mt-2 text-gray-600">Track asset assignments to personnel and expenditures</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAssignForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-military-600 hover:bg-military-700"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            New Assignment
          </button>
          <button
            onClick={() => setShowExpendForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <MinusIcon className="h-4 w-4 mr-2" />
            Record Expenditure
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assignments'
                ? 'border-military-500 text-military-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Assignments
          </button>
          <button
            onClick={() => setActiveTab('expenditures')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'expenditures'
                ? 'border-military-500 text-military-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Expenditures
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => setFilters({ ...filters, startDate: date })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
              placeholderText="Select start date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => setFilters({ ...filters, endDate: date })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
              placeholderText="Select end date"
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

      {/* Assignment Form Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Assignment</h3>
              <form onSubmit={handleAssignSubmit(onAssignSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                    <select
                      {...registerAssign('assetId', { required: 'Asset is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    >
                      <option value="">Select Asset</option>
                      {assets?.map((asset) => (
                        <option key={asset._id} value={asset._id}>
                          {asset.name} ({asset.category})
                        </option>
                      ))}
                    </select>
                    {assignErrors.assetId && <p className="mt-1 text-sm text-red-600">{assignErrors.assetId.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base</label>
                    <select
                      {...registerAssign('baseId', { required: 'Base is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    >
                      <option value="">Select Base</option>
                      {bases?.map((base) => (
                        <option key={base._id} value={base._id}>
                          {base.name} ({base.code})
                        </option>
                      ))}
                    </select>
                    {assignErrors.baseId && <p className="mt-1 text-sm text-red-600">{assignErrors.baseId.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      {...registerAssign('quantity', { required: 'Quantity is required', min: 0.01 })}
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    />
                    {assignErrors.quantity && <p className="mt-1 text-sm text-red-600">{assignErrors.quantity.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personnel ID</label>
                    <input
                      {...registerAssign('personnelId', { required: 'Personnel ID is required' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    />
                    {assignErrors.personnelId && <p className="mt-1 text-sm text-red-600">{assignErrors.personnelId.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personnel Name</label>
                    <input
                      {...registerAssign('personnelName', { required: 'Personnel name is required' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    />
                    {assignErrors.personnelName && <p className="mt-1 text-sm text-red-600">{assignErrors.personnelName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
                    <input
                      {...registerAssign('rank', { required: 'Rank is required' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    />
                    {assignErrors.rank && <p className="mt-1 text-sm text-red-600">{assignErrors.rank.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      {...registerAssign('unit')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    {...registerAssign('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    placeholder="Assignment purpose and details"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAssignForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createAssignmentMutation.isLoading}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-military-600 hover:bg-military-700 disabled:opacity-50"
                  >
                    {createAssignmentMutation.isLoading ? 'Recording...' : 'Record Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Expenditure Form Modal */}
      {showExpendForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Record Expenditure</h3>
              <form onSubmit={handleExpendSubmit(onExpendSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                    <select
                      {...registerExpend('assetId', { required: 'Asset is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    >
                      <option value="">Select Asset</option>
                      {assets?.map((asset) => (
                        <option key={asset._id} value={asset._id}>
                          {asset.name} ({asset.category})
                        </option>
                      ))}
                    </select>
                    {expendErrors.assetId && <p className="mt-1 text-sm text-red-600">{expendErrors.assetId.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base</label>
                    <select
                      {...registerExpend('baseId', { required: 'Base is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    >
                      <option value="">Select Base</option>
                      {bases?.map((base) => (
                        <option key={base._id} value={base._id}>
                          {base.name} ({base.code})
                        </option>
                      ))}
                    </select>
                    {expendErrors.baseId && <p className="mt-1 text-sm text-red-600">{expendErrors.baseId.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      {...registerExpend('quantity', { required: 'Quantity is required', min: 0.01 })}
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    />
                    {expendErrors.quantity && <p className="mt-1 text-sm text-red-600">{expendErrors.quantity.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    {...registerExpend('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    placeholder="Expenditure reason and details"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    {...registerExpend('remarks')}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    placeholder="Additional notes"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowExpendForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createExpenditureMutation.isLoading}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    {createExpenditureMutation.isLoading ? 'Recording...' : 'Record Expenditure'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'assignments' ? (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Assignment History</h3>
          </div>
          {assignmentsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignmentsData?.transactions?.map((assignment) => (
                    <tr key={assignment._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(assignment.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.assetId?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.assignedTo?.rank} {assignment.assignedTo?.personnelName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.assignedTo?.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {assignment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.createdBy?.rank} {assignment.createdBy?.firstName} {assignment.createdBy?.lastName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Expenditure History</h3>
          </div>
          {expendituresLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expendituresData?.transactions?.map((expenditure) => (
                    <tr key={expenditure._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(expenditure.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expenditure.assetId?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expenditure.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expenditure.baseId?.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {expenditure.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expenditure.createdBy?.rank} {expenditure.createdBy?.firstName} {expenditure.createdBy?.lastName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Assignments;
