import React from 'react';
import { mySekaiTableData, powerColumnThresholds, scoreRowKeys } from '../data/mySekaiTableData';
import { useTranslation } from '../contexts/LanguageContext';

const MySekaiTable = () => {
  const { t } = useTranslation();
  return (
    <div id="my-sekai-table-container" style={{ marginTop: '10px', width: '100%', overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th className="diagonal-header">
              <span className="header-row-text">{t('my_sekai_table.event_points')}</span>
              <span className="header-col-text">{t('my_sekai_table.total_power')}</span>
            </th>
            {powerColumnThresholds.map((power) => (
              <th key={power}>{power}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scoreRowKeys.map((score) => {
            if (score === 9000) {
              return (
                <tr key={score}>
                  <td><b>{score}</b></td>
                  <td colSpan={9} style={{ textAlign: 'left', padding: '4px 8px', fontSize: '10px', whiteSpace: 'nowrap' }}>
                    {t('my_sekai_table.description')}
                  </td>
                  <td>{mySekaiTableData[score][9]}</td>
                </tr>
              );
            }
            return (
              <tr key={score}>
                <td><b>{score}</b></td>
                {powerColumnThresholds.map((power, idx) => {
                  const val = mySekaiTableData[score][idx];
                  return <td key={idx}>{val !== null ? val : ''}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MySekaiTable;
