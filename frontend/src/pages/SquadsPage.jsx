import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StudySquadDashboard from '../components/squads/StudySquadDashboard';
import CreateSquadModal from '../components/squads/CreateSquadModal';
import { Users } from 'lucide-react';

export default function SquadsPage() {
  const [squads, setSquads] = useState([]);
  const [currentSquadData, setCurrentSquadData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSquads = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/squads');
      setSquads(res.data);
      
      if (res.data.length > 0) {
        // Fetch dashboard for the first squad
        await fetchSquadDashboard(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching squads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSquadDashboard = async (squadId) => {
    try {
      const res = await api.get(`/api/squads/${squadId}/dashboard`);
      setCurrentSquadData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    }
  };

  useEffect(() => {
    fetchSquads();
  }, []);

  const handleCreateSquad = async (name) => {
    try {
      await api.post('/api/squads/create', { name });
      setIsModalOpen(false);
      fetchSquads();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating squad');
    }
  };

  const handleJoinSquad = async (inviteCode) => {
    try {
      await api.post('/api/squads/join', { inviteCode });
      setIsModalOpen(false);
      fetchSquads();
    } catch (err) {
      alert(err.response?.data?.error || 'Error joining squad');
    }
  };

  const handleLeaveSquad = async () => {
    if (!currentSquadData) return;
    if (window.confirm('Are you sure you want to leave this squad?')) {
      try {
        await api.post(`/api/squads/${currentSquadData.squad.id}/leave`);
        setCurrentSquadData(null);
        fetchSquads();
      } catch (err) {
        alert('Error leaving squad');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pt-20 px-4 md:px-8 pb-12">
      {squads.length === 0 ? (
        <div className="max-w-2xl mx-auto mt-20 text-center">
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-4">Study Squads</h1>
          <p className="text-slate-400 mb-8 text-lg">
            Team up with friends, set weekly XP goals, and earn collaborative badges together.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
          >
            Create or Join a Squad
          </button>
        </div>
      ) : currentSquadData ? (
        <StudySquadDashboard 
          squadData={currentSquadData} 
          onLeaveSquad={handleLeaveSquad}
          onRefresh={() => fetchSquadDashboard(currentSquadData.squad.id)}
        />
      ) : null}

      <CreateSquadModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateSquad}
        onJoin={handleJoinSquad}
      />
    </div>
  );
}
