/**
 * @fileoverview Main page combining synchronized Pomodoro timer and ambient audio lounge.
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SquadPomodoroTimer from '../components/squads/SquadPomodoroTimer';
import AmbientAudioLounge from '../components/squads/AmbientAudioLounge';
import { io } from 'socket.io-client';

const SquadFocusRoom = () => {
    const { squadId } = useParams();
    const [socket, setSocket] = useState(null);
    const [members, setMembers] = useState([
        { id: '1', name: 'Alice', status: 'Focusing on Thermodynamics' },
        { id: '2', name: 'Bob', status: 'Taking a 5 min break' },
    ]);

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, [squadId]);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Squad Focus Room</h1>
                    <div className="flex -space-x-2">
                        {members.map((m) => (
                            <div key={m.id} className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold border-2 border-white dark:border-gray-950" title={m.status}>
                                {m.name[0]}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <SquadPomodoroTimer socket={socket} squadId={squadId} />
                    </div>
                    <div className="lg:col-span-1">
                        <AmbientAudioLounge />

                        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Live Presence</h3>
                            <div className="space-y-3">
                                {members.map((m) => (
                                    <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">{m.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{m.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SquadFocusRoom;
