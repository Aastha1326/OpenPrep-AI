import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Key, ArrowRight, Shield } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/common/Navbar';
import MobileBottomNav from '../components/common/MobileBottomNav';

const SquadsPage = () => {
  const [squads, setSquads] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [newSquadName, setNewSquadName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSquads();
  }, []);

  const fetchSquads = async () => {
    try {
      setLoading(true);
      const res = await API.get('/squads');
      setSquads(res.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch your squads.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSquad = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/squads', { name: newSquadName, description: 'A new study squad!' });
      setSquads([...squads, res.data.data]);
      setNewSquadName('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create squad');
    }
  };

  const handleJoinSquad = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/squads/join', { joinCode });
      setSquads([...squads, res.data.data]);
      setJoinCode('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to join squad');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 md:pb-0">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary-500" />
              Study Squads
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2">
              Team up with friends, track group progress, and complete study challenges together.
            </p>
          </div>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content: Squads List */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">Your Squads</h2>
            {loading ? (
              <p className="text-neutral-500">Loading your squads...</p>
            ) : squads.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl text-center border border-neutral-200 dark:border-slate-700 shadow-sm">
                <Shield className="w-16 h-16 text-neutral-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-300 mb-2">No Squads Yet</h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-sm mx-auto">
                  You aren't in any study squads. Create one with your friends or join an existing squad using a code!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {squads.map(squad => (
                  <div
                    key={squad.id}
                    onClick={() => navigate(`/squads/${squad.id}`)}
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-neutral-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col justify-between h-40"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-primary-500 transition-colors">
                        {squad.name}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                        {squad.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
                      <span>Total Score: {squad.totalScore}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Create / Join Actions */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-neutral-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-500" />
                Create Squad
              </h3>
              <form onSubmit={handleCreateSquad} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Squad Name"
                  required
                  value={newSquadName}
                  onChange={e => setNewSquadName(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary-500 dark:text-white text-sm"
                />
                <button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
                >
                  Create
                </button>
              </form>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-neutral-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-500" />
                Join Squad
              </h3>
              <form onSubmit={handleJoinSquad} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Enter Join Code"
                  required
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary-500 dark:text-white text-sm uppercase"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default SquadsPage;
