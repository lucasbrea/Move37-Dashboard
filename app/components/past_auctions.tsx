import React, { useState, useMemo, useRef, useEffect } from 'react';

interface AuctionTableProps {
  data: any[];
  gradientColumns?: string[];
}

export default function AuctionTablePastAuctions({
  data,
  gradientColumns = ["PRS", "PR", "PS"]
}: AuctionTableProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const headerScroll = headerRef.current;
    const bodyScroll = bodyRef.current;

    if (!headerScroll || !bodyScroll) return;

    const handleBodyScroll = () => {
      headerScroll.scrollLeft = bodyScroll.scrollLeft;
    };

    const handleHeaderScroll = () => {
      bodyScroll.scrollLeft = headerScroll.scrollLeft;
    };

    bodyScroll.addEventListener('scroll', handleBodyScroll);
    headerScroll.addEventListener('scroll', handleHeaderScroll);

    return () => {
      bodyScroll.removeEventListener('scroll', handleBodyScroll);
      headerScroll.removeEventListener('scroll', handleHeaderScroll);
    };
  }, []);

const twoWeeksAgo = useMemo(() => {
  const now = new Date();
  now.setDate(now.getDate() - 14);
  return now.getTime();
}, []);

const [onlyLastTwoWeeks, setOnlyLastTwoWeeks] = useState(false);

const [sortColumn, setSortColumn] = useState<string | null>(null);
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
const [filters, setFilters] = useState<Record<string, string>>({});
const [currentPage, setCurrentPage] = useState(1);
const rowsPerPage = 500;

const filterableColumns = ["Sire", "Dam", "Name", "Haras", "Year"];

// Define column types (adjust these based on your actual columns)
const columnTypes: Record<string, 'string' | 'number' | 'date'> = {
  'Value USDB': 'number',
  'Price per Bp': 'number',
  'Auction Date': 'date',
  'Start': 'date',
  'End': 'date',
  'Birth Date': 'date',
  'Year': 'number',
  'PR': 'number',
  'PS': 'number',
  'PRS': 'number',
  // Add other gradient columns here as numbers
  // Default to 'string' for unspecified columns
};

const getSortValue = (value: any, columnType: 'string' | 'number' | 'date') => {
  if (value === null || value === undefined || value === '') return null;
  
  switch (columnType) {
    case 'number':
      // Convert to number, handle various formats
      const numValue = typeof value === 'string' 
        ? parseFloat(value.replace(/[,$%]/g, '')) // Remove commas, dollar signs, percentages
        : Number(value);
      return isNaN(numValue) ? null : numValue;
    
    case 'date':
      // Handle DD/MM/YY format
      if (typeof value === 'string') {
        const [day, month, year] = value.split('/');
        if (day && month && year) {
          // Convert 2-digit year to 4-digit year
          const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
          const dateValue = new Date(fullYear, parseInt(month) - 1, parseInt(day));
          return isNaN(dateValue.getTime()) ? null : dateValue.getTime();
        }
      }
      // Fallback to standard date parsing for other formats
      const dateValue = new Date(value);
      return isNaN(dateValue.getTime()) ? null : dateValue.getTime();
    
    default:
      return String(value).toLowerCase();
  }
};

// IMPORTANT: Make sure filteredData is declared BEFORE sortedData
// This should be moved above the sortedData declaration:
const filteredData = useMemo(() => {
  let filtered = [...data];

  if (onlyLastTwoWeeks) {
    filtered = filtered.filter(row => {
      const endValue = row["Auction Date"];
      const endTimestamp = getSortValue(endValue, "date");
      return typeof endTimestamp === 'number' && endTimestamp >= twoWeeksAgo;
    });
  }

  Object.entries(filters).forEach(([col, val]) => {
    if (val && filterableColumns.includes(col)) {
      filtered = filtered.filter(row =>
        String(row[col] ?? '')
          .toLowerCase()
          .includes(val.toLowerCase())
      );
    }
  });

  if (sortColumn) {
    filtered.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const columnType = columnTypes[sortColumn] || 'string';
      const aSortValue = getSortValue(aVal, columnType);
      const bSortValue = getSortValue(bVal, columnType);

      if (aSortValue === null) return 1;
      if (bSortValue === null) return -1;

      if (aSortValue < bSortValue) return sortDirection === 'asc' ? -1 : 1;
      if (aSortValue > bSortValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return filtered;
}, [data, filters, sortColumn, sortDirection, onlyLastTwoWeeks, twoWeeksAgo]);
// Calculate max values for gradient columns
const maxValues: Record<string, number> = useMemo(() => {
  const values: Record<string, number> = {};
  
  // Make sure gradientColumns is defined before using it
  if (gradientColumns && data && data.length > 0) {
    gradientColumns.forEach(col => {
      const numericValues = data
        .map((row: any) => {
          const value = row[col];
          return parseFloat(String(value || 0).replace(/[,$%]/g, ''));
        })
        .filter(val => !isNaN(val) && val !== null);
      
      values[col] = numericValues.length > 0 ? Math.max(...numericValues) : 0;
    });
  }
  
  return values;
}, [data, gradientColumns]);


const handleSort = (column: string) => {
  if (sortColumn === column) {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  } else {
    setSortColumn(column);
    setSortDirection('asc');
  }
};

  const columnGroupColors: Record<string, string> = {
    "Name":"bg-gray-100", 
    "Sire":"bg-gray-100", 
    "Dam":"bg-gray-100", 
    "Birth Date":"bg-gray-100", 
    "Haras":"bg-gray-100", 
    "Sex":"bg-gray-100",

    "PRS":"bg-green-100", 
    "PS":"bg-green-100", 
    "PR":"bg-green-100",

    "Sire PS":"bg-red-100",

    "Value USDB":"bg-yellow-100", 
    "Price per Bp":"bg-yellow-100", 
    "Auction Order":"bg-yellow-100", 
    "Auction Date":"bg-yellow-100", 
    "Year":"bg-yellow-100", 
    "Title":"bg-yellow-100"


  };


  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleFilterChange = (colName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [colName]: value
    }));
    setCurrentPage(1); // reset to page 1 on new filter
  };

  const getGradientStyle = (columnName: string, value: number): React.CSSProperties => {
    const maxValue = maxValues[columnName];
    if (isNaN(value) || !maxValue || maxValue === 0) return {};

    let ratio = columnName === "Inbreeding Coef."
      ? 1 - (value / maxValue)
      : value / maxValue;

    ratio = Math.max(0, Math.min(1, ratio));
    const r = Math.floor(255 * (1 - ratio));
    const g = Math.floor(255 * ratio);
    const b = 0;
    const alpha = 0.15 + ratio * 0.35;
    return {
      backgroundImage: `linear-gradient(rgba(${r}, ${g}, ${b}, ${alpha}), rgba(${r}, ${g}, ${b}, ${alpha}))`,
    };
  };

  const columnTitles = [
    "Name", "Sire", "Dam", "Birth Date", "Haras", "Sex",
    "PRS", "PS", "PR", 'Sire PS',
    "Value USDB", "Price per Bp", "Auction Order", "Auction Date", "Year", "Title"
  ];

  const columnWidths: Record<string, string> = {
    "Name": "w-40",
    "Sire": "w-40",
    "Dam": "w-40",
    "Birth Date": "w-24",
    "Haras": "w-32",
    "Sex": "w-20",
    "PRS": "w-24",
    "PS": "w-24",
    "PR": "w-24",
    "Sire PS": "w-32",
    "Value USDB": "w-32",
    "Price per Bp": "w-32",
    "Auction Order": "w-32",
    "Auction Date": "w-32",
    "Year": "w-24",
    "Title": "w-40"
  };

  return (
    <div className="w-full text-gray-800 font-sans">
      <div className="grid grid-cols-4 gap-4 p-2">
        {filterableColumns.map((col, i) => (
          <div key={i} className="flex flex-col text-[10px]">
            <label htmlFor={col} className="text-gray-600 font-semibold mb-1">
              {col === "Name" ? "Horse" : col}
            </label>
            <input
              id={col}
              type="text"
              value={filters[col] || ''}
              onChange={e => handleFilterChange(col, e.target.value)}
              className="p-1 border text-[10px] rounded bg-white"
              placeholder={`Filter ${col}`}
            />
          </div>
        ))}
      </div>
      <label className="flex items-center space-x-2 text-[10px] bg-yellow-100">
      <input
        type="checkbox"
        checked={onlyLastTwoWeeks}
        onChange={() => setOnlyLastTwoWeeks(prev => !prev)}
      />
      <span>Show only auctions in the last two weeks</span>
    </label>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        <table className="w-full table-auto border text-[10px] leading-tight text-gray-800">
          <thead className="sticky top-0 bg-white">
            <tr>
              <th colSpan={6} className="bg-gray-100 text-center border border-gray-300 px-2 py-1">Basic Information</th>
              <th colSpan={3} className="bg-green-100 text-center border border-gray-300 px-2 py-1">Selection</th>
              <th className="bg-red-100 text-center border border-gray-300 px-2 py-1">Sire</th>
              <th colSpan={6} className="bg-yellow-100 text-center border border-gray-300 px-2 py-1">Auction Info</th>
            </tr>
            <tr>
              {columnTitles.map((title, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(title)}
                  className={`cursor-pointer border px-2 py-1 text-center align-bottom text-[10px] hover:bg-gray-200 ${columnGroupColors[title] || ''} ${columnWidths[title] || 'min-w-[80px]'}`}
                >
                  {title}
                  {sortColumn === title ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr key={idx} className="bg-white even:bg-gray-50">
                {columnTitles.map((colName, colIdx) => {
                  let rawValue = row[colName];
                  const displayValue = rawValue === null || rawValue === undefined || rawValue === '' || isNaN(rawValue as number)
                  ? "-"
                  : rawValue;
                const numValue = parseFloat(String(rawValue).replace('%', ''));
                const style = gradientColumns.includes(colName) ? getGradientStyle(colName, numValue) : {};
                return (
                  <td
                    key={colIdx}
                    className={`px-2 py-1 text-center whitespace-nowrap ${columnWidths[colName] || 'min-w-[80px]'}`}
                    style={style}
                    title={String(rawValue)}
                  >
                    {rawValue}
                  </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center p-2 text-[10px]">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-2 py-1 border rounded disabled:opacity-50 bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-2 py-1 border rounded disabled:opacity-50 bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}