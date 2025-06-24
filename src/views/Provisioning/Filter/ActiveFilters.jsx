import ClearIcon from '@mui/icons-material/Clear';

export default function ActiveFilter({ activeFilters, setActiveFilters }) {
  return (
    <div className="bg-blue-50 p-3 border-b border-blue-100 ">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-blue-700">Active Filters:</span>
        {activeFilters.map((filter, index) => (
          <div key={index} className="flex items-center bg-white px-3 py-1 rounded-full text-sm border border-blue-200">
            <span className="font-medium">{filter.column}:</span>
            <span className="ml-1">
              {filter.operator === 'isEmpty'
                ? 'is empty'
                : filter.operator === 'isNotEmpty'
                ? 'is not empty'
                : `${filter.operator} "${filter.value}"`}
            </span>
            <button onClick={() => removeFilter(index)} className="ml-2 text-gray-400 hover:text-gray-600">
              <ClearIcon className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button onClick={() => setActiveFilters([])} className="text-xs text-blue-600 hover:text-blue-800 ml-2">
          Clear All
        </button>
      </div>
    </div>
  );
}
