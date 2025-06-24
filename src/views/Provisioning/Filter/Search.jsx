export default function SearchBar({ globalSearch, setGlobalSearch }) {
  return (
    <div className="relative w-full sm:w-56">
      <input
        type="text"
        value={globalSearch}
        onChange={(e) => setGlobalSearch(e.target.value)}
        placeholder="Search all columns"
        className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />
      <button className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-search"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      {/* Clear search button */}
      {globalSearch && (
        <button
          onClick={() => setGlobalSearch('')}
          className="absolute inset-y-0 right-10 flex items-center px-2 text-gray-400 hover:text-gray-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
}
