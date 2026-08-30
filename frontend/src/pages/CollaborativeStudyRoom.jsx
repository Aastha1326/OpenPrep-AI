/**
 * @fileoverview Main page for the Collaborative Study Room.
 * Integrates the interactive whiteboard and real-time chat sidebar.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InteractiveWhiteboard from '../components/StudyRoom/InteractiveWhiteboard';
import axios from 'axios';
import { io } from 'socket.io-client';

const CollaborativeStudyRoom = () => {
    const { roomCode } = useParams();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [users, setUsers] = useState([]);

    const chatEndRef = useRef(null);
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        try {
            // Validate room code via REST API first
            const response = await axios.get(`${API_URL}/study-rooms/${roomCode}`);
            if (response.data.success) {
                initializeSocket(username.trim());
                setIsJoined(true);
            }
        } catch (error) {
            console.error('Failed to join room:', error);
            alert('Invalid room code or server error.');
        }
    };

    const initializeSocket = (user) => {
        const newSocket = io(SOCKET_URL, {
            query: { username: user }
        });

        newSocket.on('connect', () => {
            console.log('Connected to study room socket');
            newSocket.emit('join_room', { roomId: roomCode, username: user });
        });

        newSocket.on('receive_chat_message', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        newSocket.on('user_joined', ({ username: joinedUser, message }) => {
            setMessages((prev) => [...prev, { id: Date.now(), system: true, message }]);
            updateUsersList(newSocket);
        });

        newSocket.on('user_left', ({ message }) => {
            setMessages((prev) => [...prev, { id: Date.now(), system: true, message }]);
            updateUsersList(newSocket);
        });

        newSocket.on('room_state_sync', ({ users: roomUsers }) => {
            setUsers(roomUsers);
        });

        setSocket(newSocket);
    };

    const updateUsersList = (currentSocket) => {
        // Request updated user list (simplified for this implementation)
        currentSocket.emit('join_room', { roomId: roomCode, username }); // Re-joining triggers sync
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messagePayload = {
            roomId: roomCode,
            username,
            message: newMessage.trim(),
            timestamp: new Date().toISOString(),
        };

        socket.emit('send_chat_message', messagePayload);
        setNewMessage('');
    };

    const leaveRoom = () => {
        if (socket) {
            socket.disconnect();
        }
        navigate('/');
    };

    if (!isJoined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">Join Study Room</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-6">Room Code: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{roomCode}</span></p>

                    <form onSubmit={handleJoinRoom} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Enter your name"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Join Room
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
            {/* Header */}
            <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Study Room: {roomCode}</h1>
                    <div className="flex -space-x-2">
                        {users.slice(0, 5).map((user, idx) => (
                            <div key={user.id || idx} className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-800" title={user.username}>
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {users.length > 5 && (
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-800">
                                +{users.length - 5}
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={leaveRoom}
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                    Leave Room
                </button>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Whiteboard Area */}
                <div className="flex-1 p-4 overflow-hidden">
                    <InteractiveWhiteboard socket={socket} roomId={roomCode} isHost={true} />
                </div>

                {/* Chat Sidebar */}
                <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Room Chat</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg) => (
                            msg.system ? (
                                <div key={msg.id} className="text-center text-xs text-gray-500 dark:text-gray-400 my-2">
                                    {msg.message}
                                </div>
                            ) : (
                                <div key={msg.id} className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">{msg.username}</span>
                                    <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${msg.username === username
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                                        }`}>
                                        {msg.message}
                                    </div>
                                </div>
                            )
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CollaborativeStudyRoom;
