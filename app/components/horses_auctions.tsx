import React, {useState, useMemo} from 'react';

interface AuctionTableProps {
  data: any[];
  gradientColumns?: string[];
}

export default function AuctionTableHorses({
  data,
  gradientColumns = ["PRS", "PR","PS","Inbreeding Coef."]
  
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
    "Ranking Gen23":"bg-gray-100",
    "Horse":"bg-gray-100",
    "Sire":"bg-gray-100",
    "Dam":"bg-gray-100",
    "Haras":"bg-gray-100",
    "Sex":"bg-gray-100",
    "Birth Month":"bg-gray-100",
    "Birth Date":"bg-gray-100",

    "PRS":"bg-green-100",
    "PR":"bg-green-100",
    "PS":"bg-green-100",

    "Sire PS":"bg-orange-50",
    "Dam's Age and Racing Career":"bg-orange-50",
    "Dam's Offsprings Performance":"bg-orange-50",
    "Dam's Family (Parents & Siblings)":"bg-orange-50",

    "STK Races /Races":"bg-yellow-50",
    "STK Wins 2-5yo/#2-5yo":"bg-yellow-50",
    "Recent G1 Wnrs/Born":"bg-yellow-50",

    "Age":"bg-gray-100",
    "Top BSN's":"bg-gray-100", 
    "Raced Stk? Won G-Stk? Won-G1?":"bg-gray-100",
    "#Offs Ran":"bg-gray-100",
    "Offs Top BSNs":"bg-gray-100",
    "Offs Wnrs before 3yo(non-ALT)":"bg-gray-100",
    "Offs Stk Wnrs":"bg-gray-100",
    "CEI per offs(**)":"bg-gray-100",
    "Dam's Siblings(GS) Stk wins":"bg-gray-100",

    "PRS Value (2.200 USDB per Bps)":"bg-yellow-200",
    
    "Start":"bg-gray-200",
    "End":"bg-gray-200",
    "Lote":"bg-gray-200",
    "Href":"bg-gray-200"

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
    "Ranking Gen23", "Horse", "Sire", "Dam", "Haras","Sex","Birth Month","Birth Date",
     "PRS", "PR", "PS",
     "Sire PS","Dam's Age and Racing Career","Dam's Offsprings Performance","Dam's Family (Parents & Siblings)",
     "STK Races /Races","STK Wins 2-5yo/#2-5yo","Recent G1 Wnrs/Born",
     "Age","Top BSN's", "Raced Stk? Won G-Stk? Won-G1?","#Offs Ran","Offs Top BSNs","Offs Wnrs before 3yo(non-ALT)","Offs Stk Wnrs","CEI per offs(**)","Dam's Siblings(GS) Stk wins",
     "PRS Value (2.200 USDB per Bps)",
     "Start","End","Lote","Href"


   
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
              <th colSpan={8} className="bg-gray-100 text-center border border-gray-300 px-2 py-1">Basic Information</th>
              <th colSpan={3} className="bg-green-100 text-center border border-gray-300 px-2 py-1">Selection</th>
              <th colSpan={4} className="bg-orange-50 text-center border border-gray-300 px-2 py-1">Decomposing PS Factors</th>
              <th colSpan={3} className="bg-yellow-50 text-center border border-gray-300 px-2 py-1">Sire's PS Characteristics</th>
              <th colSpan={9} className="bg-gray-100 text-center border border-gray-300 px-2 py-1">Dam's PS Characteristics</th>
              <th className="bg-yellow-200 text-center border border-gray-300 px-2 py-1">Internal Value</th>
              <th colSpan={4} className="bg-gray-200 text-center border border-gray-300 px-2 py-1">Auction Info</th>
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