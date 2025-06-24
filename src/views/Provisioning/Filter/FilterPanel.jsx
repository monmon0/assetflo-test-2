export default function FilterPanel({ addFilter, tenantColumns, newFilter, setNewFilter }) {
  return (
    <div className="bg-white p-4 border-b border-gray-200">
      <h3 className="text-sm font-medium mb-3">Add Filter</h3>
      <div className="flex items-center space-x-2 mb-4">
        <select
          value={newFilter.column}
          onChange={(e) => setNewFilter({ ...newFilter, column: e.target.value })}
          className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {tenantColumns.slice(0, -1).map((col) => (
            <option key={col.id} value={col.id}>
              {col.label}
            </option>
          ))}
        </select>

        <select
          value={newFilter.operator}
          onChange={(e) => setNewFilter({ ...newFilter, operator: e.target.value })}
          className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="equals">equals</option>
          <option value="contains">contains</option>
          <option value="startsWith">starts with</option>
          <option value="endsWith">ends with</option>
          <option value="isEmpty">is empty</option>
          <option value="isNotEmpty">is not empty</option>
          <option value="isTrue">is True</option>
          <option value="isFalse">is False</option>
        </select>

        {!['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'].includes(newFilter.operator) && (
          <input
            type="text"
            value={newFilter.value}
            onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
            placeholder="Value"
            className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={addFilter}
          className="flex-1 sm:flex-none inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add
        </button>
        <button
          onClick={() => setShowFilterPanel(false)}
          className="flex-1 sm:flex-none text-gray-500 hover:text-gray-700 px-4 py-2 text-center border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
