import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Paper, Button, Grid } from '@mui/material';
import { getPacingPlan, getLivePacing, getPacingAutopsy, getSubjectPacingProfile } from '../../services/pacingCoachApi';
import AutopsyReport from '../components/pacing-coach/AutopsyReport';
import LivePacingStrip from '../components/pacing-coach/LivePacingStrip';

const PacingCoachDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [subjectProfile, setSubjectProfile] = useState(null);
  const [pacingPlan, setPacingPlan] = useState(null);
  const [livePacing, setLivePacing] = useState(null);
  const [autopsy, setAutopsy] = useState(null);

  // Mock data to simulate an attempt lifecycle for demonstration in the dashboard
  const [demoState, setDemoState] = useState('setup'); // setup -> live -> autopsy

  const handleSimulate = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Fetch Subject Profile (using a dummy subject ID for demo)
      const dummySubjectId = '00000000-0000-0000-0000-000000000000';
      try {
        const profileResponse = await getSubjectPacingProfile(dummySubjectId);
        setSubjectProfile(profileResponse.data);
      } catch (err) {
        console.log('No subject profile found, continuing with defaults');
      }

      // 2. Create Plan
      const planPayload = {
        totalDurationSeconds: 600, // 10 minutes
        reviewBufferPercent: 10,
        subjectId: dummySubjectId,
        questions: [
          { id: 'q1', maxScore: 1, difficulty: 'easy' },
          { id: 'q2', maxScore: 2, difficulty: 'medium' },
          { id: 'q3', maxScore: 4, difficulty: 'hard' },
          { id: 'q4', maxScore: 1, difficulty: 'medium' },
          { id: 'q5', maxScore: 2, difficulty: 'hard' },
        ]
      };
      
      const planResponse = await getPacingPlan(planPayload);
      setPacingPlan(planResponse.data);
      setDemoState('live');
      
      // 3. Simulate Live Pacing for Question 2
      const livePayload = {
        elapsedSeconds: 150,
        totalDurationSeconds: 600,
        completedQuestions: [
          { questionId: 'q1', timeSpent: 40 }
        ],
        pacingPlan: planResponse.data,
        currentQuestionId: 'q2',
        currentQuestionElapsed: 110 // Spending 110s on a question that probably has ~120s budget
      };
      
      const liveResponse = await getLivePacing(livePayload);
      setLivePacing(liveResponse.data);

    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishAttempt = async () => {
    try {
      setLoading(true);
      const attemptData = {
        timeSpent: 580,
        answers: [
          { questionId: 'q1', timeSpent: 40, isCorrect: true },
          { questionId: 'q2', timeSpent: 130, isCorrect: true }, // slow win
          { questionId: 'q3', timeSpent: 300, isCorrect: false }, // time sink
          { questionId: 'q4', timeSpent: 20, isCorrect: false }, // rushed loss
          { questionId: 'q5', timeSpent: 90, isCorrect: true }, // efficient
        ]
      };

      const autopsyResponse = await getPacingAutopsy({
        attemptData,
        pacingPlan
      });
      
      setAutopsy(autopsyResponse.data);
      setDemoState('autopsy');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" mb={2}>Pacing Coach Dashboard</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {demoState === 'setup' && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" mb={2}>Welcome to the Pacing Coach</Typography>
          <Typography variant="body1" color="textSecondary" mb={4}>
            The Pacing Coach allocates time budgets based on question difficulty and your historical performance.
            It provides live time-bleed warnings during your attempt and a detailed post-attempt autopsy to help you improve your exam strategy.
          </Typography>
          <Button variant="contained" color="primary" onClick={handleSimulate} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Start Simulation Attempt'}
          </Button>
        </Paper>
      )}

      {demoState !== 'setup' && pacingPlan && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>Exam Summary</Typography>
              <Typography variant="body2">Total Duration: {Math.floor(pacingPlan.totalDurationSeconds / 60)}m</Typography>
              <Typography variant="body2">Review Buffer: {pacingPlan.reviewBufferPercent}% ({Math.floor(pacingPlan.reviewBufferSeconds / 60)}m)</Typography>
              <Typography variant="body2">Usable Time: {Math.floor(pacingPlan.usableTimeSeconds / 60)}m</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>Question Budgets</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {pacingPlan.questionBudgets.map(qb => (
                  <Box key={qb.questionId} sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1, minWidth: 80, textAlign: 'center' }}>
                    <Typography variant="caption" display="block" fontWeight="bold">Q{qb.order}</Typography>
                    <Typography variant="body2">{Math.floor(qb.budgetSeconds / 60)}m {qb.budgetSeconds % 60}s</Typography>
                    <Typography variant="caption" color="textSecondary">{qb.difficulty}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {demoState === 'live' && livePacing && pacingPlan && (
        <Box mb={4}>
          <Typography variant="h6" mb={2}>Live Pacing View</Typography>
          <LivePacingStrip 
            currentQuestionOrder={2}
            budgetSeconds={pacingPlan.questionBudgets[1].budgetSeconds}
            elapsedSeconds={livePacing.bleedState?.isBleeding ? livePacing.bleedState.threshold + 10 : 110}
            paceState={livePacing.paceState}
            remainingTime={livePacing.remainingTime}
            projectedUnanswered={livePacing.projectedCompletion.projectedUnanswered}
          />
          <Box mt={2} textAlign="right">
            <Button variant="contained" color="secondary" onClick={handleFinishAttempt} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Finish Attempt & View Autopsy'}
            </Button>
          </Box>
        </Box>
      )}

      {demoState === 'autopsy' && autopsy && (
        <Box mb={4}>
          <AutopsyReport autopsy={autopsy} />
          <Box mt={4} textAlign="center">
            <Button variant="outlined" onClick={() => setDemoState('setup')}>
              Reset Simulation
            </Button>
          </Box>
        </Box>
      )}
      
      {subjectProfile && (
        <Paper sx={{ p: 2, mt: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold">Subject Pacing Profile</Typography>
          <Typography variant="body2">{subjectProfile.message}</Typography>
          <Typography variant="body2" color="textSecondary">Multiplier applied to future attempts: {subjectProfile.factor.toFixed(2)}x</Typography>
        </Paper>
      )}
    </Container>
  );
};

export default PacingCoachDashboard;
