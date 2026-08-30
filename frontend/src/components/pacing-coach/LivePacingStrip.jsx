import React from 'react';
import { Box, Typography, LinearProgress, Chip } from '@mui/material';

const LivePacingStrip = ({ 
  currentQuestionOrder, 
  budgetSeconds, 
  elapsedSeconds, 
  paceState, 
  remainingTime, 
  projectedUnanswered,
  bleedThreshold = 1.75
}) => {
  const budgetUtilization = budgetSeconds > 0 ? (elapsedSeconds / budgetSeconds) * 100 : 0;
  
  let stateColor = 'success';
  if (paceState === 'behind') stateColor = 'warning';
  else if (paceState === 'critical') stateColor = 'error';
  else if (paceState === 'ahead') stateColor = 'info';

  const isBleeding = elapsedSeconds > budgetSeconds * bleedThreshold;

  const formatTime = (secs) => {
    if (secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2, mb: 2, bgcolor: isBleeding ? '#fff0f0' : '#fff' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Q{currentQuestionOrder} Pacing
        </Typography>
        <Chip 
          label={isBleeding ? "Time Bleed Detected" : `Pace: ${paceState.replace('_', ' ').toUpperCase()}`} 
          color={isBleeding ? "error" : stateColor} 
          size="small" 
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">Current Q: {formatTime(elapsedSeconds)} / {formatTime(budgetSeconds)}</Typography>
        <Typography variant="body2">Remaining: {formatTime(remainingTime)}</Typography>
      </Box>

      <LinearProgress 
        variant="determinate" 
        value={Math.min(budgetUtilization, 100)} 
        color={isBleeding ? 'error' : (budgetUtilization > 100 ? 'warning' : 'primary')} 
        sx={{ height: 10, borderRadius: 5, mb: 1 }}
      />
      
      {isBleeding && (
        <Typography variant="caption" color="error">
          You're spending significantly longer than this question's budget. Consider flagging it and moving on.
        </Typography>
      )}

      {projectedUnanswered > 0 && (
        <Typography variant="caption" color="warning.main" display="block" mt={1}>
          Projected Unanswered: {projectedUnanswered} questions
        </Typography>
      )}
    </Box>
  );
};

export default LivePacingStrip;
