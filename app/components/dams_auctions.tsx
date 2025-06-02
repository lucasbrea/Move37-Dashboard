import React, {useState, useMemo} from 'react';

interface AuctionTableProps {
  data: any[];
  gradientColumns?: string[];
}

export default function AuctionTable({
  data,
  gradientColumns = ["PRS", "PR", "PB", "TPBRS","PS","PBRS", "Inbreeding Coef."]
  
}: AuctionTableProps) {


  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const filterableColumns = ["Sire", "Dam", "Name", "Haras"];
  const maxValues: Record<string, number> = {};
  gradientColumns.forEach(col => {
    maxValues[col] = Math.max(
      ...data.map((row: any) =>
        parseFloat((col === "Inbreeding Coef." ? row[col]: row[col]) || 0)
      )
    );
  });
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

  const columnGroupColors: Record<string, string> = {
    "Ranking": "bg-green-100",
    "Name": "bg-green-100",
    "Sire": "bg-green-100",
    "Dam": "bg-green-100",
    "Haras": "bg-green-100",
  
    "TPBRS": "bg-green-50",
    "PBRS": "bg-green-50",
    "PB": "bg-green-50",
    "PRS": "bg-green-50",
    "PR": "bg-green-50",
    "PS": "bg-green-50",
  
    "Age and Racing Career": "bg-orange-50",
    "Offsprings' Quality": "bg-orange-50",
    "Siblings' quality": "bg-orange-50",
    "Parents Career": "bg-orange-50",
  
    "Age": "bg-yellow-50",
    "Top 3 BSN's": "bg-yellow-50",
    "Raced Stk? Won G-Stk?": "bg-yellow-50",
    "#Offs Ran": "bg-yellow-50",
    "Dam's Foals Top 3 BSN": "bg-yellow-50",
    "Foals before 3yo(non-ALT)": "bg-yellow-50",  
    "Foals Stk Rnrs": "bg-yellow-50",
    "Foals Stk Wnrs": "bg-yellow-50",
    "Siblings total G-stk runs": "bg-yellow-50",
    "Siblings total G-stk wins": "bg-yellow-50",
  
    "Inbreeding Coef.": "bg-red-100",

    "#Offs Ran / #Running age":"bg-gray-50",
    "#Services":"bg-gray-50",
    "#Births":"bg-gray-50",
    "Date last service":"bg-gray-50",
    "Birth Rate":"bg-gray-50",
  
    "Total Races": "bg-blue-50",
    "Total Wins": "bg-blue-50",
    "G1 Placed": "bg-blue-50",
    "G1 Wins": "bg-blue-50",
  
    "Start": "bg-gray-200",
    "End": "bg-gray-200",
    "Lote": "bg-gray-200",
    "Href": "bg-gray-200"
  };

  function handleSort(colName: string) {
    if (sortColumn === colName) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
  }

  function handleFilterChange(colName: string, value: string) {
    setFilters(prev => ({
      ...prev,
      [colName]: value
    }));
  }

  function getGradientStyle(columnName: string, value: number): React.CSSProperties {
    const maxValue = maxValues[columnName];
    if (isNaN(value) || !maxValue || maxValue === 0) return {};

    let ratio: number;

    if (columnName === "Inbreeding Coef.") {
      const minValue = 0;
      ratio = 1 - (value - minValue) / (maxValue - minValue);
    } else {
      ratio = value / maxValue;
    }

    ratio = Math.max(0, Math.min(1, ratio));
    const r = Math.floor(255 * (1 - ratio));
    const g = Math.floor(255 * ratio);
    const b = 0;
    const alpha = 0.15 + ratio * 0.35;

    return {
      backgroundImage: `linear-gradient(rgba(${r}, ${g}, ${b}, ${alpha}), rgba(${r}, ${g}, ${b}, ${alpha}))`,
    };
  }

  const columnTitles = [
    "Ranking", "Name", "Sire", "Dam", "Haras",
    "TPBRS",  "PBRS", "PB", "PRS", "PR", "PS",
    "Age and Racing Career", "Offsprings' Quality", "Siblings' quality", "Parents Career","Age","Top 3 BSN's",
    "Raced Stk? Won G-Stk?","#Offs Ran", "Dam's Foals Top 3 BSN", "Foals before 3yo(non-ALT)","Foals Stk Rnrs",
    "Foals Stk Wnrs","Siblings total G-stk runs", "Siblings total G-stk wins","Inbreeding Coef.",
    "#Offs Ran / #Running age","#Services","#Births","Date last service","Birth Rate", "Total Races", "Total Wins", "G1 Placed", "G1 Wins",
    "Lote", "Start", "End"
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
              <th colSpan={5} className="bg-green-100 text-center border border-gray-300 px-2 py-1">Basic Information</th>
              <th colSpan={6} className="bg-green-50 text-center border border-gray-300 px-2 py-1">Selection</th>
              <th colSpan={4} className="bg-orange-50 text-center border border-gray-300 px-2 py-1">Decomposing PS Factors</th>
              <th colSpan={10} className="bg-yellow-50 text-center border border-gray-300 px-2 py-1">Main Characteristics</th>
              <th className="bg-red-100 text-center border border-gray-300 px-2 py-1">Inbreeding</th>
              <th colSpan={5} className="bg-gray-100 text-center border border-gray-300 px-2 py-1">Factors PB/PR</th>
              <th colSpan={4} className="bg-blue-50 text-center border border-gray-300 px-2 py-1">Detailed Racing Career</th>
              <th colSpan={3} className="bg-gray-200 text-center border border-gray-300 px-2 py-1">Auction Info</th>
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
            {filteredData.map((row, idx) => (
              <tr key={idx} className="odd:bg-white even:bg-gray-50">
                {columnTitles.map((colName, colIdx) => {
                  let rawValue = row[colName];
                  if (colName === "Inbreeding Coef.") {
                    rawValue = typeof rawValue === 'number' ? (rawValue * 100).toFixed(0) : rawValue;
                  }
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
    </div>
  );
}