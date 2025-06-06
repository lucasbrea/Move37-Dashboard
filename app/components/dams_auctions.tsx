import React, {useState, useMemo, useRef, useEffect} from 'react';

interface AuctionTableProps {
  data: any[];
  gradientColumns?: string[];
}

export default function AuctionTable({
  data,
  gradientColumns = ["PRS", "PR", "PB", "TPBRS","PS","PBRS", "Inbreeding Coef."]
  
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

  const columnWidths: Record<string, string> = {
    "Ranking": "min-w-[80px]",
    "Name": "min-w-[200px]",
    "Sire": "min-w-[160px]",
    "Dam": "min-w-[160px]",
    "Haras": "min-w-[200px]",
    "TPBRS": "min-w-[30px]",
    "PBRS": "min-w-[20px]",
    "PB": "min-w-[20px]",
    "PRS": "min-w-[20px]",
    "PR": "min-w-[20px]",
    "PS": "min-w-[20px]",
    "Age and Racing Career": "min-w-[20px]",
    "Offsprings' Quality": "min-w-[20px]",
    "Siblings' quality": "min-w-[20px]",
    "Parents Career": "min-w-[20px]",
    "Age": "min-w-[20px]",
    "Top 3 BSN's": "min-w-[20px]",
    "Raced Stk? Won G-Stk?": "min-w-[20px]",
    "#Offs Ran": "min-w-[20px]",
    "Dam's Foals Top 3 BSN": "min-w-[20px]",
    "Foals before 3yo(non-ALT)": "min-w-[20px]",
    "Foals Stk Rnrs": "min-w-[20px]",
    "Foals Stk Wnrs": "min-w-[20px]",
    "Siblings total G-stk runs": "min-w-[20px]",
    "Siblings total G-stk wins": "min-w-[20px]",
    "Inbreeding Coef.": "min-w-[20px]",
    "#Offs Ran / #Running age": "min-w-[20px]",
    "#Services": "min-w-[20px]",
    "#Births": "min-w-[20px]",
    "Date last service": "min-w-[30px]",
    "Birth Rate": "min-w-[20px]",
    "Total Races": "min-w-[20px]",
    "Total Wins": "min-w-[20px]",
    "G1 Placed": "min-w-[20px]",
    "G1 Wins": "min-w-[20px]",
    "Start": "min-w-[30px]",
    "End": "min-w-[30px]",
    "Lote": "min-w-[80px]"
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
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        <table className="w-full table-auto border text-[10px] leading-tight text-gray-800">
          <thead className="sticky top-0 bg-white">
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
                  className={`cursor-pointer border px-2 py-1 text-center align-bottom text-[10px] hover:bg-gray-200 ${columnGroupColors[title] || ''} ${columnWidths[title] || 'min-w-[80px]'}`}
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
    </div>
  );
}