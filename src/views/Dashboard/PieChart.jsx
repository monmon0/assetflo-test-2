import React, { Component } from 'react';
import { Pie } from 'react-chartjs-2';

const cardChartOpts4 = {
  tooltips: {
    enabled: false
  },
  hoverBackgroundColor: 'red',
  maintainAspectRatio: false,
  legend: {
    display: true,
    position: 'right'
  }
};
export default function pieChart(pieChartData) {
  return (
    <div
      style={{
        borderRadius: '10px',
        boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)',
        marginTop: '5px',
        background: 'white'
      }}
      className="metrics-row1"
    >
      <div
        style={{
          padding: '15px',
          textAlign: 'center',
          color: '#576574'
        }}
      >
        <strong>{pieChartData && pieChartData.type} chart </strong>
        <hr />
      </div>
      <div style={{ height: '' }}>
        <Pie data={pieChartData} options={cardChartOpts4} />
      </div>
    </div>
  );
}
