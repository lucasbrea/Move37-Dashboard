import React, { useState, useMemo } from 'react';

interface AuctionTableProps {
  data: any[];
  gradientColumns?: string[];
}

export default function AuctionTablePastAuctions({
  data,
  gradientColumns = ["PRS", "PR", "PS"]
}: AuctionTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 500;

  const filterableColumns = ["Sire", "Dam", "Name", "Haras", "Year"];

  const maxValues: Record<string, number> = {};
  gradientColumns.forEach(col => {
    maxValues[col] = Math.max(
      ...data.map((row: any) =>
        parseFloat((col === "Inbreeding Coef." ? row[col] : row[col]) || 0)
      )
    );
  });

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

    "Value USDB":"bg-yellow-100", 
    "Price per Bp":"bg-yellow-100", 
    "Auction Order":"bg-yellow-100", 
    "Auction Date":"bg-yellow-100", 
    "Year":"bg-yellow-100", 
    "Title":"bg-yellow-100"


  };

  const filteredData = useMemo(() => {
    let filtered = [...data];

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

        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);

        const aValNorm = isNaN(aNum) ? String(aVal) : aNum;
        const bValNorm = isNaN(bNum) ? String(bVal) : bNum;

        if (aValNorm < bValNorm) return sortDirection === 'asc' ? -1 : 1;
        if (aValNorm > bValNorm) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, filters, sortColumn, sortDirection]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
  };

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
    "PRS", "PS", "PR",
    "Value USDB", "Price per Bp", "Auction Order", "Auction Date", "Year", "Title"
  ];

  return (
    <div className="w-full overflow-x-auto text-gray-800 font-sans">
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

      <div className="w-full overflow-x-auto">
        <table className="w-full table-auto border text-[10px] leading-tight text-gray-800">
          <thead>
            <tr>
              <th colSpan={6} className="bg-gray-100 text-center border border-gray-300 px-2 py-1">Basic Information</th>
              <th colSpan={3} className="bg-green-100 text-center border border-gray-300 px-2 py-1">Selection</th>
              <th colSpan={6} className="bg-yellow-100 text-center border border-gray-300 px-2 py-1">Auction Info</th>
            </tr>
            <tr>
              {columnTitles.map((title, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(title)}
                  className={`cursor-pointer border px-2 py-1 text-center align-bottom text-[10px] hover:bg-gray-200 ${columnGroupColors[title] || ''}`}
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
                    className="px-2 py-1 text-center whitespace-nowrap"
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