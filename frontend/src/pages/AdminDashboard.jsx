import { useSelector } from 'react-redux';
import { ShieldAlert, Users, Database, Activity } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-stone-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-amber-700" />
          <div>
            <h1 className="text-3xl font-bold font-playfair text-stone-900">Admin Dashboard</h1>
            <p className="text-stone-500 text-sm">Welcome back, {user?.name}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-sm shadow-sm border border-stone-200 flex flex-col items-center justify-center text-center">
            <Users className="w-10 h-10 text-blue-600 mb-3" />
            <h3 className="font-bold text-stone-800">Manage Users</h3>
            <p className="text-sm text-stone-500 mt-1">View and edit user roles & quotas</p>
          </div>
          <div className="bg-white p-6 rounded-sm shadow-sm border border-stone-200 flex flex-col items-center justify-center text-center">
            <Database className="w-10 h-10 text-green-600 mb-3" />
            <h3 className="font-bold text-stone-800">System Metrics</h3>
            <p className="text-sm text-stone-500 mt-1">Review DB connections and storage</p>
          </div>
          <div className="bg-white p-6 rounded-sm shadow-sm border border-stone-200 flex flex-col items-center justify-center text-center">
            <Activity className="w-10 h-10 text-purple-600 mb-3" />
            <h3 className="font-bold text-stone-800">API Usage</h3>
            <p className="text-sm text-stone-500 mt-1">Track Gemini and rate limit status</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
