import React, {useState, useMemo, useRef, useEffect} from 'react';

interface AuctionTableProps {
  data: any[];
  gradientColumns?: string[];
}

export default function AuctionTableHorses({
  data,
  gradientColumns = ["PRS", "PR","PS","Inbreeding Coef."]
  
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
  const filterableColumns = ["Sire", "Dam", "Horse", "Haras"];
  const maxValues: Record<string, number> = {};
  gradientColumns.forEach(col => {
    maxValues[col] = Math.max(
      ...data.map((row: any) =>
        parseFloat((col === "Inbreeding Coef." ? row[col]: row[col]) || 0)
      )
    );
  });

  const columnTypes: Record<string, 'string' | 'number' | 'date'> = {
    'PRS Value (2.200 USDB per Bps)': 'number',
    'Start': 'date',
    'End': 'date',
    'Birth Date': 'date',
    'Birth Month': 'date',
    'Age': 'number',
    'PR': 'number',
    'PS': 'number',
    'PRS': 'number',
    'Inbreeding Coef.': 'number',
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
    "Top BSNs":"bg-gray-100", 
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
     "Age","Top BSNs", "Raced Stk? Won G-Stk? Won-G1?","#Offs Ran","Offs Top BSNs","Offs Wnrs before 3yo(non-ALT)","Offs Stk Wnrs","CEI per offs(**)","Dam's Siblings(GS) Stk wins",
     "PRS Value (2.200 USDB per Bps)",
     "Start","End","Lote","Href"


   
  ];

  const columnWidths: Record<string, string> = {
    "Ranking Gen23": "min-w-[80px]",
    "Horse": "min-w-[100px]",
    "Sire": "min-w-[100px]",
    "Dam": "min-w-[100px]",
    "Haras": "min-w-[100px]",
    "Sex": "min-w-[20px]",
    "Birth Month": "min-w-[20px]",
    "Birth Date": "min-w-[20px]",
    "PRS": "min-w-[20px]",
    "PR": "min-w-[20px]",
    "PS": "min-w-[20px]",
    "Sire PS": "min-w-[20px]",
    "Dam's Age and Racing Career": "min-w-[20px]",
    "Dam's Offsprings Performance": "min-w-[20px]",
    "Dam's Family (Parents & Siblings)": "min-w-[20px]",
    "STK Races /Races": "min-w-[20px]",
    "STK Wins 2-5yo/#2-5yo": "min-w-[20px]",
    "Recent G1 Wnrs/Born": "min-w-[20px]",
    "Age": "min-w-[20px]",
    "Top BSNs": "min-w-[20px]",
    "Raced Stk? Won G-Stk? Won-G1?": "min-w-[20px]",
    "#Offs Ran": "min-w-[20px]",
    "Offs Top BSNs": "min-w-[20px]",
    "Offs Wnrs before 3yo(non-ALT)": "min-w-[20px]",
    "Offs Stk Wnrs": "min-w-[20px]",
    "CEI per offs(**)": "min-w-[20px]",
    "Dam's Siblings(GS) Stk wins": "min-w-[20px]",
    "PRS Value (2.200 USDB per Bps)": "min-w-[20px]",
    "Start": "min-w-[30px]",
    "End": "min-w-[30px]",
    "Lote": "min-w-[20px]"
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