import React, { useState } from 'react';
import PopupModal from './DeleteModal';

const MobileTenantTable = ({
  props,
  handleTextChange,
  handleSwitchChange,
  handleEditClick,
  handleAddTenant,
  handleUpdateData,
  handleSaveEdit,
  handleDeleteFunction,
  manageSAcc,
  addTenant,
  setAddTenant,
  editingTenantId,
  setEditingTenantId,
  selectedTenant,
  setSelectedTenant,
  showDeleteConfirm,
  setShowDeleteConfirm,
  newData,
  setNewData,
  CustomSwitch
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event, tenant) => {
    setAnchorEl(event.currentTarget);
    setSelectedTenant(tenant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTenant(null);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setAnchorEl(null);
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white shadow-sm border-b border-gray-200 p-4 flex justify-between items-center z-10">
        <h1 className="text-xl font-semibold text-gray-900">Tenants</h1>
        <button
          onClick={handleAddTenant}
          disabled={addTenant}
          className={`p-2 rounded-full transition-colors ${
            addTenant
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        {/* Add New Tenant Form */}
        {addTenant && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Tenant</h3>
              <button onClick={() => setAddTenant(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  name="organization"
                  placeholder="Organization *"
                  value={newData.organization}
                  onChange={handleTextChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Name *"
                  value={newData.name}
                  onChange={handleTextChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <textarea
                  name="address"
                  placeholder="Address"
                  value={newData.address}
                  onChange={handleTextChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <input
                  type="text"
                  name="database"
                  placeholder="Database"
                  value={newData.database}
                  onChange={handleTextChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <input
                  type="text"
                  name="resellerOrg"
                  placeholder="Reseller Organization"
                  value={newData.resellerOrg}
                  onChange={handleTextChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <CustomSwitch label="MQTT Push" checked={newData.mqttPush} onChange={handleSwitchChange('mqttPush')} />

              <CustomSwitch
                label="Sync Enabled"
                checked={newData.syncEnabled}
                onChange={handleSwitchChange('syncEnabled')}
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleUpdateData(newData)}
                  disabled={!newData.organization || !newData.name}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    !newData.organization || !newData.name
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Submit
                </button>
                <button
                  onClick={() => setAddTenant(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tenant Cards */}
        <div className="space-y-4">
          {props.map((tenant) => (
            <div key={tenant._id} className="bg-white rounded-lg shadow-md border border-gray-200">
              {editingTenantId === tenant._id ? (
                /* Edit Mode */
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Edit Tenant</h3>
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-full">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setEditingTenantId(null)}
                        className="p-2 text-gray-500 hover:bg-gray-50 rounded-full"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      name="organization"
                      placeholder="Organization"
                      value={newData.organization || ''}
                      onChange={handleTextChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      value={newData.name || ''}
                      onChange={handleTextChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <textarea
                      name="address"
                      placeholder="Address"
                      value={newData.address || ''}
                      onChange={handleTextChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                      type="text"
                      name="database"
                      placeholder="Database"
                      value={newData.database || ''}
                      onChange={handleTextChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                      type="text"
                      name="resellerOrg"
                      placeholder="Reseller Organization"
                      value={newData.resellerOrg || ''}
                      onChange={handleTextChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <CustomSwitch
                      label="MQTT Push"
                      checked={newData.mqttPush || false}
                      onChange={handleSwitchChange('mqttPush')}
                    />

                    <CustomSwitch
                      label="Sync Enabled"
                      checked={newData.syncEnabled || false}
                      onChange={handleSwitchChange('syncEnabled')}
                    />
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{tenant.organization}</h3>
                      <p className="text-sm text-gray-600">{tenant.name}</p>
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => handleMenuClick(e, tenant)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>

                      {anchorEl && selectedTenant?._id === tenant._id && (
                        <div className="absolute right-0 top-10 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => handleEditClick(tenant)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={handleDeleteClick}
                            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {tenant.address && <p className="text-sm text-gray-600 mb-3">{tenant.address}</p>}

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">MQTT Push:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          tenant.mqttPush ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tenant.mqttPush ? 'On' : 'Off'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Sync:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          tenant.syncEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tenant.syncEnabled ? 'On' : 'Off'}
                      </span>
                    </div>

                    {tenant.database && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Database: </span>
                        <span className="text-gray-900">{tenant.database}</span>
                      </div>
                    )}

                    {tenant.resellerOrg && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Reseller: </span>
                        <span className="text-gray-900">{tenant.resellerOrg}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <button
                      onClick={() => manageSAcc(tenant)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      {tenant.hasServiceAccount ? 'Edit Service Account' : 'Set Service Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Click outside to close menu */}
      {anchorEl && <div className="fixed inset-0 z-10" onClick={handleMenuClose} />}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <PopupModal
          message="Are you sure you want to proceed? This action cannot be undone."
          onConfirm={() => handleDeleteFunction()}
          onCancel={() => setShowDeleteConfirm(null)}
          title="Delete Tenant"
        />
      )}
    </div>
  );
};

export default MobileTenantTable;
