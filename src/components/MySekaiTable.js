import React from 'react';
import { mySekaiTableData, powerColumnThresholds, scoreRowKeys } from '../data/mySekaiTableData';
import { useTranslation } from '../contexts/LanguageContext';

const MySekaiTable = () => {
  const { t } = useTranslation();
  const [hoveredCell, setHoveredCell] = React.useState({ row: null, col: null });

  return (
    <div id="my-sekai-table-container">
      <div className="w-full bg-white">
        <table className="w-full text-[10px] sm:text-xs md:text-sm border-collapse table-fixed">
          <thead>
            <tr className="bg-gray-100 text-gray-600 border-b border-gray-200 divide-x divide-gray-200">
              <th className="py-1 px-0.5 w-[12%] bg-gray-50 font-extrabold text-blue-900 border-r border-gray-200 bg-[linear-gradient(to_top_right,transparent_49%,#cbd5e1_50%,transparent_51%)] relative">
                <span className="absolute bottom-0.5 left-0.5 text-[8px] sm:text-[10px] text-gray-500">{t('my_sekai_table.event_points')}</span>
                <span className="absolute top-0.5 right-0.5 text-[8px] sm:text-[10px] text-gray-500">{t('my_sekai_table.total_power')}</span>
              </th>
              {powerColumnThresholds.map((power, idx) => (
                <th key={power} className={`py-1 px-0.5 font-bold whitespace-nowrap transition-colors duration-150 ${hoveredCell.col === idx ? 'bg-blue-100 text-blue-900' : 'text-gray-700'}`}>
                  {power}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {scoreRowKeys.map((score) => {
              if (score === 9000) {
                return (
                  <tr key={score} className="bg-yellow-50/50">
                    <td className={`py-1 px-0.5 font-bold border-r border-gray-200 transition-colors duration-150 ${hoveredCell.row === score ? 'bg-blue-100 text-blue-900' : 'bg-gray-50 text-gray-900'}`}>{score}</td>
                    <td colSpan={10} className="py-1 px-1 text-left text-gray-500 italic">
                      {t('my_sekai_table.description')}
                    </td>
                  </tr>
                );
              }
              const isRowHovered = hoveredCell.row === score;
              return (
                <tr key={score} className="transition-colors duration-150">
                  <td className={`py-0.5 px-0.5 font-bold border-r border-gray-200 transition-colors duration-150 ${isRowHovered ? 'bg-blue-100 text-blue-900' : 'bg-gray-50 text-gray-800'}`}>
                    {score}
                  </td>
                  {powerColumnThresholds.map((power, idx) => {
                    const val = mySekaiTableData[score][idx];
                    const isCellHovered = isRowHovered && hoveredCell.col === idx;
                    return (
                      <td
                        key={idx}
                        className={`py-0.5 px-0.5 text-center border-r border-gray-100 last:border-r-0 cursor-default ${val ? 'text-gray-900 font-medium' : 'text-gray-300'} ${isCellHovered ? 'bg-blue-50 font-bold text-blue-800' : ''}`}
                        onMouseEnter={() => setHoveredCell({ row: score, col: idx })}
                        onMouseLeave={() => setHoveredCell({ row: null, col: null })}
                      >
                        {val !== null ? val : '-'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MySekaiTable;
