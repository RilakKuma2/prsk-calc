import React from 'react';
import { mySekaiTableData, powerColumnThresholds, scoreRowKeys } from '../data/mySekaiTableData';

const MySekaiTable = () => {
  return (
    <div id="my-sekai-table-container" style={{ marginTop: '10px', width: '100%', overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th className="diagonal-header">
              <span className="header-row-text">이벤포</span>
              <span className="header-col-text">종합력</span>
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
                    ※ 목표 이벤포를 얻기 위한 최소 종합력 및 배수
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
