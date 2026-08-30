import React from 'react';
import { Box, Typography, Grid, Paper, Divider } from '@mui/material';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ZAxis, ReferenceLine } from 'recharts';

const AutopsyReport = ({ autopsy }) => {
  if (!autopsy) return null;

  const { classifications, totalTimeSpent, totalBudget, estimatedOpportunityCostMarks, analyzedQuestions, skipRecommendations } = autopsy;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}m ${s}s`;
  };

  const chartData = analyzedQuestions.map(q => ({
    x: parseFloat(q.ratio),
    y: q.marksEarned,
    classification: q.classification,
    questionId: q.questionId
  }));

  const getColor = (classification) => {
    switch(classification) {
      case 'efficient': return '#4caf50'; // green
      case 'slow_win': return '#ff9800'; // orange
      case 'time_sink': return '#f44336'; // red
      case 'rushed_loss': return '#2196f3'; // blue
      default: return '#9e9e9e';
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{ bgcolor: 'white', p: 1, border: '1px solid #ccc' }}>
          <Typography variant="body2">Ratio: {data.x.toFixed(2)}x budget</Typography>
          <Typography variant="body2">Marks: {data.y}</Typography>
          <Typography variant="body2">Class: {data.classification}</Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box>
      <Typography variant="h5" mb={2}>Post-Attempt Time Autopsy</Typography>
      
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="textSecondary">Time Spent / Budget</Typography>
            <Typography variant="h6">{formatTime(totalTimeSpent)} / {formatTime(totalBudget)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="textSecondary">Efficient / Slow Wins</Typography>
            <Typography variant="h6" color="success.main">{classifications.efficient} / {classifications.slow_win}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="textSecondary">Time Sinks / Rushed Losses</Typography>
            <Typography variant="h6" color="error.main">{classifications.time_sink} / {classifications.rushed_loss}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="textSecondary">Opportunity Cost</Typography>
            <Typography variant="h6" color="warning.main">{estimatedOpportunityCostMarks} Marks</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h6" mb={2}>Time vs Marks Visualization</Typography>
      <Paper sx={{ p: 2, mb: 4, height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="Time/Budget Ratio" unit="x" />
            <YAxis type="number" dataKey="y" name="Marks Earned" />
            <ZAxis type="number" range={[100, 100]} />
            <RechartsTooltip content={<CustomTooltip />} />
            <ReferenceLine x={1} stroke="red" strokeDasharray="3 3" />
            <Scatter name="Questions" data={chartData} fill="#8884d8">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.classification)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Paper>

      {skipRecommendations && skipRecommendations.length > 0 && (
        <>
          <Typography variant="h6" mb={2}>Skip Recommendations</Typography>
          <Paper sx={{ p: 2 }}>
            {skipRecommendations.map((rec, i) => (
              <Box key={i} mb={i < skipRecommendations.length - 1 ? 2 : 0}>
                <Typography variant="subtitle1">Question {rec.questionId}</Typography>
                <Typography variant="body2" color="textSecondary">{rec.message}</Typography>
                {i < skipRecommendations.length - 1 && <Divider sx={{ mt: 1 }} />}
              </Box>
            ))}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default AutopsyReport;
