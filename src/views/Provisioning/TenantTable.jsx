import { useState, useEffect, useMemo } from 'react';
import MaterialTable from '@material-table/core';
import { connect } from 'react-redux';
import variables from '../../variables.json';
import { hasAccess } from '../../util/hasAccess';
import { Dialog, Chip, FormControl, Select, Input, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import ReactDOM from 'react-dom';
import ServiceAccountModal from '../TenantSettings/TenantSettings';
import CheckIcon from '@mui/icons-material/Check';
import RemoveIcon from '@mui/icons-material/Remove';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import EditNoteIcon from '@mui/icons-material/EditNote';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SplitscreenIcon from '@mui/icons-material/Splitscreen';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditTenantModal from './ServiceAccountModal';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import PopupModal from './DeleteModal';
import PaginationComponent from './Pagination';
import MobileTenantTable from './MobileTenantTable';
import {
  Box,
  Pagination,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import AdminTable from './AdminTable';
import SearchBar from './Filter/Search';
import ActiveFilter from './Filter/ActiveFilters';
import FilterPanel from './Filter/FilterPanel';

// Custom Switch Component
const CustomSwitch = ({ checked, onChange, label }) => (
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm text-gray-600">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  </div>
);

const label = { inputProps: { 'aria-label': 'Switch' } };

function TenantTable(props) {
  // State for column visibility dropdown
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Toggle column visibility
  const toggleColumnVisibility = (columnId) => {
    setTenantColumns(tenantColumns.map((col) => (col.id === columnId ? { ...col, visible: !col.visible } : col)));
  };

  // Filter state
  const [activeFilters, setActiveFilters] = useState([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [newFilter, setNewFilter] = useState({
    column: 'organization',
    operator: 'contains',
    value: ''
  });

  const handleAddTenant = () => {
    setNewData({});
    setAddTenant(!addTenant);
  };

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Adding Tenant
  const [addTenant, setAddTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({ userName: '', password: '' });
  const [globalSearch, setGlobalSearch] = useState('');

  // Define which columns to search through
  const searchableColumns = ['name', 'organization', 'address', 'database', 'reseller'];

  // Add a new filter
  const addFilter = () => {
    if (newFilter.value.trim() !== '' || ['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'].includes(newFilter.operator)) {
      setActiveFilters([...activeFilters, { ...newFilter }]);
      setNewFilter({ ...newFilter, value: '' });
    }
  };

  // Remove a filter
  const removeFilter = (index) => {
    const updatedFilters = [...activeFilters];
    updatedFilters.splice(index, 1);
    setActiveFilters(updatedFilters);
  };

  // Get tenants data from props and filter out archived ones
  const tenantsData = props.allTenants ? props.allTenants.filter((tenant) => !tenant.archived) : [];

  // Apply filters to data
  const filteredTenants = useMemo(() => {
    let filtered = tenantsData;

    if (activeFilters.length > 0) {
      filtered = filtered.filter((tenant) => {
        return activeFilters.some((filter) => {
          const rawValue = tenant[filter.column];
          let columnValue;

          if (typeof rawValue === 'boolean') {
            columnValue = rawValue ? 'true' : 'false';
          } else {
            columnValue = String(rawValue || '');
          }

          switch (filter.operator) {
            case 'equals':
              return columnValue === filter.value;
            case 'contains':
              return columnValue.toLowerCase().includes(filter.value.toLowerCase());
            case 'startsWith':
              return columnValue.toLowerCase().startsWith(filter.value.toLowerCase());
            case 'endsWith':
              return columnValue.toLowerCase().endsWith(filter.value.toLowerCase());
            case 'isEmpty':
              return columnValue === '' || columnValue === '—' || rawValue === null || rawValue === undefined;
            case 'isNotEmpty':
              return columnValue !== '' && columnValue !== '—' && rawValue !== null && rawValue !== undefined;
            case 'isTrue':
              return rawValue === true || columnValue.toLowerCase() === 'true';
            case 'isFalse':
              return rawValue === false || columnValue.toLowerCase() === 'false';
            default:
              return true;
          }
        });
      });
    }

    // Then apply global search
    if (globalSearch.trim()) {
      filtered = filtered.filter((tenant) => {
        return searchableColumns.some((columnName) => {
          const rawValue = tenant[columnName];
          let searchableValue;

          // Handle different data types
          if (typeof rawValue === 'boolean') {
            searchableValue = rawValue ? 'true' : 'false';
          } else if (rawValue === null || rawValue === undefined) {
            searchableValue = '';
          } else if (rawValue instanceof Date) {
            searchableValue = rawValue.toLocaleDateString();
          } else {
            searchableValue = String(rawValue);
          }

          return searchableValue.toLowerCase().includes(globalSearch.toLowerCase());
        });
      });
    }

    return filtered;
  }, [tenantsData, activeFilters, globalSearch, searchableColumns]);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [newTenantData, setNewTenantData] = useState({});

  // updating data using newData
  const [newData, setNewData] = useState({});

  const [oldData, setOldData] = useState({});

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setNewData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = () => {
    handleUpdateData(newData);
    setEditingTenantId(null);
  };

  const handleSwitchChange = (field) => (e) => {
    const checked = e.target.checked;
    setNewData((prev) => ({
      ...prev,
      [field]: checked
    }));
  };

  async function handleUpdateData(newData) {
    const { _id, createdAt, tableData, resellerOrg, ...updates } = newData;
    const org = newData.organization.trim().toLowerCase();
    const name = newData.name.trim();
    const payload = {
      ...updates,
      organization: org,
      name: name,
      ...(resellerOrg && { resellerOrg: resellerOrg.trim().toLowerCase() })
    };
    setAddTenant(false);
    setEditingId(null);
    setNewData({});
    setEditData({});
    setNewTenantData({});
    await props.findAndUpdateTenant(payload);
  }

  // State for tracking which row's dropdown is open
  const [activeRow, setActiveRow] = useState(0);

  const manageSAcc = (tenant) => {
    props.setSelectedTenant(tenant);
    setSelectedTenant(tenant);
    setIsEditModalOpen(true);
  };

  const [editingTenantId, setEditingTenantId] = useState(null);
  // this is for the Tenant Row Data
  const handleEditClick = (tenant) => {
    setEditingTenantId(tenant._id);
    setOldData({ ...tenant });
    setNewData({ ...tenant });
  };

  // Handle save changes
  // This is for modal
  const handleSaveChanges = (updatedTenant) => {
    // Use the prop function to update tenant
    if (props.findAndUpdateTenant) {
      props.findAndUpdateTenant(updatedTenant);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [deletedTagName, setDeletedTagName] = useState('');

  const handleDeleteFunction = (tenant) => {
    setShowDeleteConfirm(tenant);
    setSelectedTenant(tenant);
    setActiveRow(null);
  };

  const handleDeleteClick = (tenant) => {
    // Archive the tenant instead of deleting
    const updatedTenant = { ...tenant, archived: true };
    if (props.findAndUpdateTenant) {
      props.findAndUpdateTenant(updatedTenant);
    }
    handleUpdateData(updatedTenant);
    setShowDeleteConfirm(false);
    setShowToast(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowColumnSelector(false);
    };

    props.getAllTenants();

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const totalPages = Math.ceil(filteredTenants.length / rowsPerPage);

  const currentTenants = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return filteredTenants.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredTenants, page, rowsPerPage]);

  // Tenant Columns
  const [tenantColumns, setTenantColumns] = useState([
    {
      id: 'organization',
      label: 'Organization',
      type: 'text',
      editable: true,
      visible: true
    },
    {
      id: 'name',
      label: 'Name',
      type: 'text',
      editable: true,
      visible: true
    },
    {
      id: 'address',
      label: 'Address',
      type: 'text',
      truncate: true,
      editable: true,
      visible: true
    },
    {
      id: 'mqttPush',
      label: 'MQTT Push',
      type: 'boolean',
      editable: true,
      visible: true
    },
    {
      id: 'database',
      label: 'Database',
      type: 'text',
      editable: true,
      visible: true
    },
    {
      id: 'resellerOrg',
      label: 'Reseller',
      type: 'text',
      editable: true,
      visible: true
    },
    {
      id: 'syncEnabled',
      label: 'Sync',
      type: 'boolean',
      editable: true,
      visible: true
    },
    {
      id: 'serviceAccount',
      label: 'Service Account',
      type: 'action',
      actionText: 'Edit',
      icon: EditNoteIcon,
      onClick: (tenant) => manageSAcc(tenant),
      visible: true,
      editable: false
    }
  ]);

  const customActions = [
    {
      label: 'Manage SA',
      icon: EditNoteIcon,
      onClick: (tenant) => manageSAcc(tenant),
      className: 'text-blue-600'
    }
  ];

  // check for Mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="w-full h-screen bg-white ">
      {/* Header manage Tenants */}
      <div className="bg-slate-100 p-4 border-b">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-medium">Manage Tenants</h2>

          {/* Controls Container - Stack on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Search Input - Full width on mobile */}

            <SearchBar globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} />

            {/* Button Group - Stack on small screens, row on larger */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 whitespace-nowrap"
              >
                <FilterAltIcon className="h-4 w-4 flex-shrink-0" />
                <span>Filter</span>
              </button>

              {/* Columns Button */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColumnSelector(!showColumnSelector);
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 whitespace-nowrap"
                >
                  {!isMobile && (
                    <div className="">
                      <SplitscreenIcon className="h-4 w-4 flex-shrink-0" />
                      <span>Columns</span>
                    </div>
                  )}
                </button>

                {/* Column Selector Dropdown */}
                {showColumnSelector && (
                  <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1 divide-y divide-gray-100">
                      <div className="px-4 py-2 text-sm font-medium text-gray-700">Toggle Columns</div>
                      <div className="py-1">
                        {tenantColumns.map((column) => (
                          <div
                            key={column.id}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleColumnVisibility(column.id);
                            }}
                          >
                            <div className="flex items-center justify-center w-5 h-5 mr-3 border rounded border-gray-300 flex-shrink-0">
                              {column.visible && <CheckIcon className="h-3 w-3 text-blue-600" />}
                            </div>
                            <span className="capitalize">{column.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Tenant Button */}
              <button
                onClick={() => handleAddTenant()}
                disabled={editingTenantId != null}
                className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  editingTenantId != null
                    ? 'text-gray-400 bg-gray-300 cursor-not-allowed'
                    : 'text-blue-50 bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <span>{addTenant ? 'Cancel' : 'Add Tenants'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active filters display */}
      {activeFilters.length > 0 && <ActiveFilter activeFilters={activeFilters} setActiveFilters={setActiveFilters} />}

      {/* Filter panel */}
      {showFilterPanel && (
        <FilterPanel
          addFilter={addFilter}
          tenantColumns={tenantColumns}
          newFilter={newFilter}
          setNewFilter={setNewFilter}
        />
      )}

      {/* check for mobile view, display table mobile */}
      {isMobile && (
        <MobileTenantTable
          props={currentTenants}
          handleTextChange={handleTextChange}
          handleSwitchChange={handleSwitchChange}
          handleEditClick={handleEditClick}
          handleAddTenant={handleAddTenant}
          handleUpdateData={handleUpdateData}
          handleSaveEdit={handleSaveEdit}
          handleDeleteFunction={handleDeleteClick}
          manageSAcc={() => manageSAcc()}
          addTenant={addTenant}
          setAddTenant={setAddTenant}
          editingTenantId={editingTenantId}
          setEditingTenantId={setEditingTenantId}
          selectedTenant={selectedTenant}
          setSelectedTenant={setSelectedTenant}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          newData={newData}
          setNewData={setNewData}
          CustomSwitch={CustomSwitch}
        />
      )}

      {!isMobile && (
        <AdminTable
          data={currentTenants}
          columns={tenantColumns}
          enableAdd={true}
          enableEdit={true}
          enableDelete={true}
          isAdding={addTenant}
          newRowData={newTenantData}
          showDeleteConfirm={showDeleteConfirm}
          onNewRowDataChange={(field, value) => setNewTenantData((prev) => ({ ...prev, [field]: value }))}
          onSubmitNewRow={(newData) => handleUpdateData(newData)}
          editingRowId={editingId}
          editRowData={editData}
          onEditRowDataChange={(field, value) => setEditData((prev) => ({ ...prev, [field]: value }))}
          onStartEdit={(tenant) => {
            setEditingId(tenant._id);
            setEditData({ ...tenant });
          }}
          onSaveEdit={(newData) => handleUpdateData(newData)}
          onCancelEdit={() => setEditingId(null)}
          onDelete={(tenant) => handleDeleteFunction(tenant)}
          customActions={customActions}
        />
      )}

      {/* add padding  */}
      <div className="sx: py-20"></div>

      {/* Sticky Pagination */}
      {!isEditModalOpen && (
        <PaginationComponent
          totalItems={filteredTenants.length}
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          itemName="tenants"
        />
      )}

      {showDeleteConfirm && (
        <PopupModal
          message="Are you sure you want to proceed? This action cannot be undone."
          onConfirm={() => handleDeleteClick(selectedTenant)}
          onCancel={cancelDelete}
          title="Delete Tenant"
        />
      )}

      {/* Edit Modal */}
      <EditTenantModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        tenant={selectedTenant}
        onSave={handleSaveChanges}
      />
    </div>
  );
}

// import React, { useState, useEffect, createRef } from 'react';
// import MaterialTable from '@material-table/core';
// import { connect } from 'react-redux';
// import variables from '../../variables.json';
// import { hasAccess } from '../../util/hasAccess';
// import { Dialog, Chip, FormControl, Select, Input, MenuItem } from '@mui/material';
// import { styled } from '@mui/material/styles';
// import ReactDOM from 'react-dom';
// import ServiceAccountModal from '../TenantSettings/TenantSettings';
// import CheckIcon from '@mui/icons-material/Check';
// import RemoveIcon from '@mui/icons-material/Remove';

// let tableRef = createRef();

// const PREFIX = 'TenantTable';

// const classes = {
//   container: `${PREFIX}-container`
// };

// const Root = styled('div')(({ theme, ...props }) => ({
//   [`& .${classes.container}`]: {
//     display: 'flex',
//     justifyContent: 'center',
//     alignItems: 'center'
//   }
// }));

// const ITEM_HEIGHT = 48;
// const ITEM_PADDING_TOP = 8;
// const MenuProps = {
//   PaperProps: {
//     style: {
//       maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
//       width: 250
//     }
//   },
//   variant: 'menu',
//   getContentAnchorEl: null
// };

// function TenantTable(props) {
//   const [popupOpen, setPopupOpen] = useState(false);

//   const handleOpenPopup = () => {
//     setPopupOpen(true);
//   };
//   const handleClosePopup = () => {
//     setPopupOpen(false);
//     props.setSelectedTenant('');
//   };
//   useEffect(() => {
//     props.getAllTenants();
//   }, []);

//   function tableData() {
//     let columns = [
//       {
//         title: 'Organization',
//         field: 'organization',
//         filtering: false,
//         // width: '1%',
//         headerStyle: {
//           color: variables.ORANGE_COLOR,
//           fontWeight: 'bold'
//         },
//         cellStyle: {
//           color: variables.DARK_GRAY_COLOR,
//           textOverflow: 'ellipsis',
//           whiteSpace: 'nowrap',
//           overflow: 'hidden',
//           padding: ' 16px 3px'
//         },
//         editable: 'onAdd',
//         validate: (rowData) =>
//           rowData.organization === '' || (rowData.organization && rowData.organization.trim() === '')
//             ? { isValid: false, helperText: 'required field' }
//             : true
//       },
//       {
//         title: 'Name',
//         field: 'name',
//         filtering: false,
//         headerStyle: {
//           color: variables.ORANGE_COLOR,
//           fontWeight: 'bold'
//         },
//         cellStyle: {
//           color: variables.DARK_GRAY_COLOR,
//           textOverflow: 'ellipsis',
//           whiteSpace: 'nowrap',
//           overflow: 'hidden',
//           padding: ' 16px 3px'
//         },
//         validate: (rowData) =>
//           rowData.name === '' || (rowData.name && rowData.name.trim() === '')
//             ? { isValid: false, helperText: 'required field' }
//             : true
//       },
//       {
//         title: 'Address',
//         field: 'address',
//         filtering: false,
//         headerStyle: {
//           color: variables.ORANGE_COLOR,
//           fontWeight: 'bold'
//         },
//         cellStyle: {
//           color: variables.DARK_GRAY_COLOR,
//           overflow: 'hidden',
//           textOverflow: 'ellipsis',
//           padding: ' 16px 3px'
//         },
//         validate: (rowData) =>
//           rowData.address === '' || (rowData.address && rowData.address.trim() === '')
//             ? { isValid: false, helperText: 'required field' }
//             : true
//       },
//       {
//         title: 'MQTT Push',
//         field: 'mqttPush',
//         filtering: false,
//         headerStyle: {
//           color: variables.ORANGE_COLOR,
//           fontWeight: 'bold'
//         },
//         cellStyle: {
//           color: variables.DARK_GRAY_COLOR,
//           wordBreak: 'break-word',
//           padding: ' 16px 3px'
//         },
//         editComponent: (fieldProps) => {
//           const { rowData } = fieldProps;
//           const mqttPushVal =
//             rowData.mqttPush || (rowData.mqttPush === undefined && rowData.database && rowData.resellerOrg);

//           const tenantObj = { value: !!mqttPushVal, onChange: fieldProps.onChange };
//           return props.renderSwitcher(tenantObj);
//         },
//         render: (rowData) => {
//           const icon =
//             rowData.mqttPush || (rowData.mqttPush === undefined && rowData.database && rowData.resellerOrg) ? (
//               <CheckIcon />
//             ) : (
//               <RemoveIcon />
//             );
//           return icon;
//         },
//         type: 'boolean'
//       },
//       // {
//       //   title: 'Admin email',
//       //   field: 'primaryContactInfo.email',
//       //   filtering: false,
//       //   headerStyle: {
//       //     color: variables.ORANGE_COLOR,
//       //     fontWeight: 'bold'
//       //   },
//       //   cellStyle: {
//       //     color: variables.DARK_GRAY_COLOR,
//       //     wordBreak: 'break-word',
//       //     padding: ' 16px 3px'
//       //   },
//       //   required: true,
//       //   validate: (rowData) =>
//       //     rowData.primaryContactInfo &&
//       //     (rowData.primaryContactInfo.email === '' ||
//       //       (rowData.primaryContactInfo.email && rowData.primaryContactInfo.email.trim() === ''))
//       //       ? { isValid: false, helperText: 'required field' }
//       //       : rowData.primaryContactInfo &&
//       //         rowData.primaryContactInfo.email &&
//       //         !isValidEmail(rowData.primaryContactInfo.email)
//       //       ? { isValid: false, helperText: 'invalid email format' }
//       //       : true
//       // },
//       // {
//       //   title: 'Phone',
//       //   field: 'primaryContactInfo.phone',
//       //   filtering: false,
//       //   headerStyle: {
//       //     color: variables.ORANGE_COLOR,
//       //     fontWeight: 'bold'
//       //   },
//       //   cellStyle: {
//       //     color: variables.DARK_GRAY_COLOR,
//       //     padding: ' 16px 3px'
//       //   },
//       //   validate: (rowData) =>
//       //     rowData.primaryContactInfo &&
//       //     (rowData.primaryContactInfo.phone === '' ||
//       //       (rowData.primaryContactInfo.phone && rowData.primaryContactInfo.phone.trim() === ''))
//       //       ? { isValid: false, helperText: 'required field' }
//       //       : rowData.primaryContactInfo &&
//       //         rowData.primaryContactInfo.phone &&
//       //         (rowData.primaryContactInfo.phone.length < 10 || !isNumeric(rowData.primaryContactInfo.phone))
//       //       ? { isValid: false, helperText: 'invalid phone number' }
//       //       : true
//       // },
//       // {
//       //   title: 'Active',
//       //   field: 'active',
//       //   filtering: false,
//       //   headerStyle: {
//       //     color: variables.ORANGE_COLOR,
//       //     fontWeight: 'bold'
//       //   },
//       //   cellStyle: {
//       //     color: variables.DARK_GRAY_COLOR
//       //     // padding: '0 25px'
//       //   },
//       //   // lookup: { true: 'true', false: 'false' },
//       //   editable: 'never',
//       //   type: 'boolean'
//       // },
//       {
//         title: 'Database',
//         field: 'database',
//         filtering: false,
//         headerStyle: {
//           color: variables.ORANGE_COLOR,
//           fontWeight: 'bold'
//         },
//         cellStyle: {
//           color: variables.DARK_GRAY_COLOR,
//           textOverflow: 'ellipsis',
//           whiteSpace: 'nowrap',
//           overflow: 'hidden',
//           padding: ' 16px 3px'
//         }
//       },
//       // {
//       //   title: 'Is Geotab',
//       //   field: 'isGeotab',
//       //   filtering: false,
//       //   headerStyle: {
//       //     color: variables.ORANGE_COLOR,
//       //     fontWeight: 'bold'
//       //   },
//       //   cellStyle: {
//       //     color: variables.DARK_GRAY_COLOR
//       //   },
//       //   editable: 'never',
//       //   type: 'boolean'
//       // },
//       {
//         title: 'Reseller',
//         field: 'resellerOrg',
//         filtering: false,
//         headerStyle: {
//           color: variables.ORANGE_COLOR,
//           fontWeight: 'bold'
//         },
//         cellStyle: {
//           color: variables.DARK_GRAY_COLOR,
//           textOverflow: 'ellipsis',
//           whiteSpace: 'nowrap',
//           overflow: 'hidden',
//           padding: ' 16px 3px'
//         },
//         initialEditValue: ''
//       },
//       {
//         title: 'Sync',
//         field: 'syncEnabled',
//         filtering: false,
//         headerStyle: {
//           color: variables.ORANGE_COLOR,
//           fontWeight: 'bold'
//         },
//         cellStyle: {
//           color: variables.DARK_GRAY_COLOR
//         },
//         // render: (rowData) => {
//         //   return rowData && (!rowData.syncEnabled ? <div>false</div> : <div>true</div>);
//         // },
//         editable: 'never',
//         type: 'boolean'
//       },
//       {
//         title: 'Service account',
//         field: 'serviceAccount',
//         editable: 'never',
//         render: (rowData) => {
//           return (
//             <div
//               style={{ cursor: 'pointer' }}
//               onClick={() => {
//                 let search = tableRef.current.state.searchText;
//                 search && props.setTableSearch(search);
//                 props.setSelectedTenant(rowData);
//                 handleOpenPopup();
//               }}
//             >
//               {
//                 <Chip
//                   size="small"
//                   style={{
//                     backgroundColor: 'green',
//                     color: variables.WHITE_COLOR
//                   }}
//                   label={rowData.hasServiceAccount ? 'Edit' : 'Set'}
//                   disabled
//                 />
//               }
//             </div>
//           );
//         },
//         filtering: false,
//         headerStyle: {
//           color: variables.ORANGE_COLOR,
//           fontWeight: 'bold'
//         },
//         cellStyle: {
//           color: variables.DARK_GRAY_COLOR
//         },
//         sorting: false
//       },
//       // {
//       //   title: 'Service Account',
//       //   field: 'geotabAccount',
//       //   filtering: false,
//       //   headerStyle: {
//       //     color: variables.ORANGE_COLOR,
//       //     fontWeight: 'bold'
//       //   },
//       //   cellStyle: {
//       //     color: variables.DARK_GRAY_COLOR,
//       //     width: '100%',
//       //     textOverflow: 'ellipsis',
//       //     whiteSpace: 'nowrap',
//       //     overflow: 'hidden',
//       //     maxWidth: 100
//       //   },
//       //   editable: 'never',
//       //   hidden: true
//       // },
//       {
//         title: 'Sync Entities',
//         field: 'syncEntities',
//         filtering: false,
//         headerStyle: {
//           color: variables.ORANGE_COLOR,
//           fontWeight: 'bold'
//         },
//         cellStyle: {
//           color: variables.DARK_GRAY_COLOR,
//           textOverflow: 'ellipsis',
//           whiteSpace: 'nowrap',
//           overflow: 'hidden'
//         },
//         render: (rowData) => {
//           return (
//             rowData && (!rowData.syncEntities ? <div></div> : <div>{displaySyncEntities(rowData.syncEntities)}</div>)
//           );
//         },
//         editable: 'never',
//         hidden: true
//       }
//     ];

//     let data = [];
//     props.allTenants &&
//       props.allTenants.map((tenant) => {
//         // console.log('tenant', tenant);
//         let tableRowData = {
//           ...tenant
//         };
//         if (!tenant.archived) data.push(tableRowData);
//       });

//     return { columns, data };
//   }

//   const displaySyncEntities = (entities) => {
//     let result = [];
//     for (let prop in entities) {
//       if (entities[prop]) {
//         result.push(prop);
//       }
//     }
//     return result.join(',');
//   };

//   const isValidEmail = (email) => {
//     const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
//     return regex.test(email);
//   };

//   const isNumeric = (number) => {
//     const regex = new RegExp('^[0-9]*$');
//     return regex.test(number);
//   };

//   async function handleUpdateData(newData) {
//     const { _id, createdAt, tableData, resellerOrg, ...updates } = newData;
//     const org = newData.organization.trim().toLowerCase();
//     const name = newData.name.trim();
//     const payload = {
//       ...updates,
//       organization: org,
//       name: name,
//       ...(resellerOrg && { resellerOrg: resellerOrg.trim().toLowerCase() })
//     };
//     // return console.log(payload);
//     await props.findAndUpdateTenant(payload);
//   }

//   const handleAddNewTenant = async (newData) => {
//     const org = newData.organization.trim().toLowerCase();
//     const name = newData.name.trim();
//     let payload = {
//       ...newData,
//       organization: org,
//       name: name,
//       ...(newData.mqttPush === undefined && {
//         mqttPush: !!(newData.mqttPush === undefined && newData.database && newData.resellerOrg)
//       })
//     };

//     // console.log(payload);
//     await props.findAndUpdateTenant(payload);
//   };

//   return (
//     <Root style={{ width: '100%' }}>
//       {/* {popupOpen && ( */}
//       <Dialog open={popupOpen} onClose={handleClosePopup} className={classes.container}>
//         <ServiceAccountModal />
//       </Dialog>
//       {/* )} */}
//       <MaterialTable
//         tableRef={tableRef}
//         key={props.provisionType}
//         style={{
//           marginLeft: '30px',
//           marginRight: '30px',
//           outline: 'none'
//         }}
//         localization={{ body: { editRow: { deleteText: 'Delete?' } } }}
//         stickyHeader
//         options={{
//           tableLayout: 'fixed',
//           search: true,
//           maxBodyHeight: props.screenWidth > 700 ? '65vh' : '55vh',
//           thirdSortClick: false,
//           pageSize: 20,
//           pageSizeOptions: [20, 40, 60, 80, 100],
//           addRowPosition: 'first',
//           draggable: false,
//           rowStyle: (rowData) => ({
//             backgroundColor:
//               rowData.tableData &&
//               props.selectedRow.tableData &&
//               rowData.tableData.id === props.selectedRow.tableData.id
//                 ? variables.ORANGE_COLOR
//                 : variables.WHITE_COLOR,
//             maxHeight: '50px',
//             width: '10%'
//           })
//         }}
//         onChangePage={(e, page) => {
//           ReactDOM.findDOMNode(tableRef.current).children[1].children[0].children[0].scrollTo(0, 0);
//         }}
//         // onRowClick={(evt, selectedRow) => {
//         //   // console.log(tableRef.current && tableRef.current.state.lastEditingRow)
//         //   if (tableRef.current && tableRef.current.state.lastEditingRow === undefined)
//         //     props.setSelectedRow(selectedRow);
//         // }}
//         title={
//           <div className="text-value-sm" style={{ color: variables.DARK_GRAY_COLOR }}>
//             Manage {props.provisionType}s
//           </div>
//         }
//         columns={tableData().columns}
//         data={tableData().data}
//         components={props.groupCell}
//         editable={
//           hasAccess(props.userPermissions, variables.ALL_PROVISION_FEATURE, props.role, props.database, props.group)
//             ? {
//                 onRowAdd: (newData) =>
//                   new Promise((resolve, reject) => {
//                     if (!newData.name || !newData.organization) {
//                       reject();
//                       return;
//                     }
//                     handleAddNewTenant(newData);
//                     resolve();
//                     return;
//                   }),
//                 onRowUpdate: (newData, oldData) =>
//                   new Promise((resolve, reject) => {
//                     handleUpdateData(newData, oldData);
//                     resolve();
//                     return;
//                   }),
//                 onRowDelete: (oldData) =>
//                   new Promise((resolve, reject) => {
//                     let data = { ...oldData };
//                     data.archived = true;
//                     handleUpdateData(data);
//                     resolve();
//                   })
//               }
//             : {}
//         }
//       />
//     </Root>
//   );
// }

const mapStateToProps = ({ provision, user, location, map }) => ({
  provisionType: provision.provisionType,
  role: user.role,
  tenants: map.tenants,
  database: user.database,
  userPermissions: user.userPermissions,
  screenWidth: location.screenWidth,
  allTenants: provision.allTenants,
  selectedRow: provision.selectedRow,
  selectedTenant: provision.selectedTenant,
  tableSearch: provision.tableSearch,
  group: user.group
});

const mapDispatch = ({
  map: { getTenantsAction },
  provision: {
    setSelectedRowAction,
    getAllTenantsAction,
    findAndUpdateTenantAction,
    setSelectedTenantAction,
    setTableSearchAction
  }
}) => ({
  getTenants: getTenantsAction,
  findAndUpdateTenant: findAndUpdateTenantAction,
  getAllTenants: getAllTenantsAction,
  setSelectedRow: setSelectedRowAction,
  setSelectedTenant: setSelectedTenantAction,
  setTableSearch: setTableSearchAction
});

export default connect(mapStateToProps, mapDispatch)(TenantTable);
