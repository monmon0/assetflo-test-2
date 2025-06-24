import { useState } from 'react';
import { TextField, Switch } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PopupModal from './DeleteModal';

const AdminTable = ({
  // Data props
  data = [],
  columns = [],

  // Configuration
  enableAdd = false,
  enableEdit = true,
  enableDelete = true,
  enableInlineEdit = true,

  // Add row props
  isAdding = false,
  newRowData = {},
  onNewRowDataChange = () => {},
  onSubmitNewRow = () => {},
  AddRowComponent = null,

  // Edit props
  editingRowId = null,
  editRowData = {},
  onEditRowDataChange = () => {},
  onStartEdit = () => {},
  onSaveEdit = () => {},
  onCancelEdit = () => {},
  EditRowComponent = null,

  // Action handlers
  onDelete = () => {},
  onCustomAction = () => {},

  showDeleteConfirm = false,

  // Custom components
  customActions = [],

  // Table styling
  className = '',
  rowClassName = 'hover:bg-blue-50',
  headerClassName = 'bg-gray-50'
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Render cell content based on column type and editing state
  const renderCellContent = (column, rowData, isEditing) => {
    const value = rowData[column.id];

    if (isEditing && column.editable !== false) {
      switch (column.type) {
        case 'boolean':
          return (
            <Switch
              checked={editRowData[column.id] || false}
              onChange={(e) => onEditRowDataChange(column.id, e.target.checked)}
            />
          );
        case 'text':
        case 'string':
        default:
          return (
            <TextField
              name={column.id}
              value={editRowData[column.id] || ''}
              onChange={(e) => onEditRowDataChange(column.id, e.target.value)}
              variant="outlined"
              size="small"
              label={column.editLabel || column.label}
            />
          );
      }
    }

    // Render display content
    if (column.render) {
      return column.render(value, rowData);
    }

    switch (column.type) {
      case 'boolean':
        return value ? (
          <CheckIcon className="h-5 w-5 text-green-600" />
        ) : (
          <ClearIcon className="h-5 w-5 text-red-600" />
        );
      case 'action':
        return (
          <div
            className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer"
            onClick={() => column.onClick && column.onClick(rowData)}
          >
            {column.icon && <column.icon className="h-4 w-4 mr-1" />}
            {column.actionText || 'Action'}
          </div>
        );
      default:
        return column.truncate ? (
          <div className="max-w-xs truncate" title={value}>
            {value}
          </div>
        ) : (
          value
        );
    }
  };

  // Render add row for new entries
  const renderAddRow = () => {
    if (!isAdding) return null;

    if (AddRowComponent) {
      return <AddRowComponent data={newRowData} onChange={onNewRowDataChange} onSubmit={onSubmitNewRow} />;
    }

    return (
      <tr className={rowClassName}>
        {columns.map((column) => (
          <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {column.type === 'boolean' ? (
              <Switch
                checked={newRowData[column.id] || false}
                onChange={(e) => onNewRowDataChange(column.id, e.target.checked)}
              />
            ) : column.editable !== false ? (
              <TextField
                name={column.id}
                value={newRowData[column.id] || ''}
                onChange={(e) => onNewRowDataChange(column.id, e.target.value)}
                label={column.addLabel || column.label}
                variant="outlined"
                size="small"
              />
            ) : null}
          </td>
        ))}
        <td className="px-6 py-4 whitespace-nowrap w-24">
          <button
            onClick={() => {
              if (!newRowData.name || !newRowData.organization) return;
              onSubmitNewRow(newRowData);
            }}
            disabled={!newRowData.name || !newRowData.organization}
            className={`px-3 py-1 rounded text-sm ${
              !newRowData.name || !newRowData.organization
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            Submit
          </button>
        </td>
      </tr>
    );
  };

  // Render action dropdown
  const renderActionsDropdown = (rowData) => {
    const rowId = rowData.id || rowData._id;
    const isEditing = editingRowId === rowId;

    if (isEditing) {
      return (
        <div className="flex space-x-2">
          <button className="text-green-600 hover:text-green-800" onClick={() => onSaveEdit(editRowData)}>
            Save
          </button>
          <button className="text-gray-500 hover:text-gray-700" onClick={onCancelEdit}>
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="relative">
        <button
          className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(activeDropdown === rowId ? null : rowId);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-more-vertical"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>

        {activeDropdown === rowId && (
          <div className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-1 w-24 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
            {enableEdit && enableInlineEdit && (
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEdit(rowData);
                  setActiveDropdown(null);
                }}
              >
                <CreateIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
            )}
            {/* 
            {customActions.map((action, index) => (
              <button
                key={index}
                className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 ${
                  action.className || 'text-gray-700'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(rowData);
                  setActiveDropdown(null);
                }}
              >
                {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                {action.label}
              </button>
            ))} */}

            {enableDelete && (
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(rowData);
                  setActiveDropdown(null);
                }}
              >
                <DeleteIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="">
      <table
        className={`min-w-full divide-y divide-gray-200 table-fixed border-b border-gray-200 sm:px-6 no-scrollbar mb-4 ${className}`}
      >
        <thead className={headerClassName}>
          <tr>
            {columns.map(
              (column) =>
                column.visible && (
                  <th
                    key={column.id}
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      column.headerClassName || 'text-blue-600 w-auto'
                    }`}
                  >
                    {column.label}
                  </th>
                )
            )}
            {(enableEdit || enableDelete || customActions.length > 0) && (
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {renderAddRow()}

          {data.map((rowData) => {
            const rowId = rowData.id || rowData._id;
            const isEditing = editingRowId === rowId;

            return (
              <tr key={rowId} className={rowClassName}>
                {columns.map(
                  (column) =>
                    column.visible && (
                      <td
                        key={column.id}
                        className={`px-6 py-2 text-sm text-gray-900 ${
                          column.cellClassName || (column.truncate ? 'max-w-xs' : 'whitespace-nowrap')
                        }`}
                      >
                        {renderCellContent(column, rowData, isEditing)}
                      </td>
                    )
                )}

                {(enableEdit || enableDelete || customActions.length > 0) && (
                  <td className="px-6 py-6 whitespace-nowrap w-24">{renderActionsDropdown(rowData)}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;
