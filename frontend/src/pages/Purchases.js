import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';

const Purchases = () => {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    assetCategory: ''
  });
  
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch purchases
  const { data: purchasesData, isLoading } = useQuery(
    ['purchases', filters],
    async () => {
      const params = new URLSearchParams({ type: 'purchase' });
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.assetCategory) params.append('assetCategory', filters.assetCategory);
      
      const response = await axios.get(`/api/transactions?${params}`);
      return response.data;
    }
  );

  // Fetch assets for dropdown
  const { data: assets } = useQuery('assets', async () => {
    // This would be from an assets endpoint
    return [
      { _id: '66c7b8f4e1234567890abcd1', name: 'M4 Carbine', category: 'weapon' },
      { _id: '66c7b8f4e1234567890abcd2', name: 'Humvee', category: 'vehicle' },
      { _id: '66c7b8f4e1234567890abcd3', name: '5.56mm Ammunition', category: 'ammunition' },
      { _id: '66c7b8f4e1234567890abcd4', name: 'Body Armor', category: 'equipment' },
      { _id: '66c7b8f4e1234567890abcd5', name: 'MRE', category: 'supplies' }
    ];
  });

  // Fetch bases for dropdown
  const { data: bases } = useQuery('bases', async () => {
    return [
      { _id: '66c7b8f4e1234567890abce1', name: 'Fort Bragg', code: 'FB' },
      { _id: '66c7b8f4e1234567890abce2', name: 'Camp Pendleton', code: 'CP' },
      { _id: '66c7b8f4e1234567890abce3', name: 'Fort Hood', code: 'FH' },
      { _id: '66c7b8f4e1234567890abce4', name: 'Fort Campbell', code: 'FC' }
    ];
  });

  // Create purchase mutation
  const createPurchaseMutation = useMutation(
    (purchaseData) => axios.post('/api/transactions/purchase', purchaseData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('purchases');
        queryClient.invalidateQueries('dashboard-metrics');
        toast.success('Purchase recorded successfully');
        setShowForm(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record purchase');
      }
    }
  );

  const onSubmit = (data) => {
    const purchaseData = {
      ...data,
      quantity: parseFloat(data.quantity),
      unitPrice: parseFloat(data.unitPrice)
    };
    createPurchaseMutation.mutate(purchaseData);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchases</h1>
          <p className="mt-2 text-gray-600">Record and track asset purchases</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-military-600 hover:bg-military-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Purchase
        </button>
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

      {/* Purchase Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Record New Purchase</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                    <select
                      {...register('assetId', { required: 'Asset is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    >
                      <option value="">Select Asset</option>
                      {assets?.map((asset) => (
                        <option key={asset._id} value={asset._id}>
                          {asset.name} ({asset.category})
                        </option>
                      ))}
                    </select>
                    {errors.assetId && <p className="mt-1 text-sm text-red-600">{errors.assetId.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base</label>
                    <select
                      {...register('baseId', { required: 'Base is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    >
                      <option value="">Select Base</option>
                      {bases?.map((base) => (
                        <option key={base._id} value={base._id}>
                          {base.name} ({base.code})
                        </option>
                      ))}
                    </select>
                    {errors.baseId && <p className="mt-1 text-sm text-red-600">{errors.baseId.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      {...register('quantity', { required: 'Quantity is required', min: 0.01 })}
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    />
                    {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                    <input
                      {...register('unitPrice', { required: 'Unit price is required', min: 0 })}
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    />
                    {errors.unitPrice && <p className="mt-1 text-sm text-red-600">{errors.unitPrice.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                    <input
                      {...register('vendorName', { required: 'Vendor name is required' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    />
                    {errors.vendorName && <p className="mt-1 text-sm text-red-600">{errors.vendorName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Contact</label>
                    <input
                      {...register('vendorContact')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order Number</label>
                    <input
                      {...register('purchaseOrderNumber')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                    <input
                      {...register('invoiceNumber')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    {...register('remarks')}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-military-500 focus:border-military-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createPurchaseMutation.isLoading}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-military-600 hover:bg-military-700 disabled:opacity-50"
                  >
                    {createPurchaseMutation.isLoading ? 'Recording...' : 'Record Purchase'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Purchases Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Purchase History</h3>
        </div>
        {isLoading ? (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchasesData?.transactions?.map((purchase) => (
                  <tr key={purchase._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(purchase.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.assetId?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${purchase.unitPrice?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${purchase.totalValue?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.vendor?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.purchaseOrderNumber}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Purchases;
