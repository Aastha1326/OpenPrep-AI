import React from 'react';
import WeightageChart from './WeightageChart';

const ChapterWeightageChart = ({ data = [], onChapterClick }) => {
  return (
    <WeightageChart
      data={data}
      onChapterClick={onChapterClick}
      title="Chapter Weightage Breakdown (%)"
    />
  );
};

export default ChapterWeightageChart;
