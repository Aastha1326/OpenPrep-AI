import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Shield,
  ShieldAlert,
  Eye,
  Edit,
  Trash2,
  Check,
  X as XIcon,
} from 'lucide-react';
import API from '../../services/api';
import Modal from '../common/Modal';

const DeckCollaboratorsModal = ({ isOpen, onClose, deckId, deckName, isOwner, canAdmin }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('view');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState(null);

  const fetchCollaborators = async () => {
    if (!deckId) return;

    setLoading(true);
    try {
      const res = await API.get(`/flashcard-decks/${deckId}/collaborators`);
      setCollaborators(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch collaborators:', err);
      setError('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && deckId) {
      fetchCollaborators();
    }
  }, [isOpen, deckId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setError(null);
    try {
      await API.post(`/flashcard-decks/${deckId}/collaborators`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteEmail('');
      setInviteRole('view');
      fetchCollaborators();
    } catch (err) {
      console.error('Failed to invite collaborator:', err);
      setError(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (collaboratorId, newRole) => {
    try {
      await API.put(`/flashcard-decks/${deckId}/collaborators/${collaboratorId}`, {
        role: newRole,
      });
      fetchCollaborators();
    } catch (err) {
      console.error('Failed to update role:', err);
      setError('Failed to update role');
    }
  };

  const handleRemove = async (collaboratorId) => {
    if (!window.confirm('Are you sure you want to remove this collaborator?')) return;

    try {
      await API.delete(`/flashcard-decks/${deckId}/collaborators/${collaboratorId}`);
      fetchCollaborators();
    } catch (err) {
      console.error('Failed to remove collaborator:', err);
      setError('Failed to remove collaborator');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'edit':
        return <Edit className="w-4 h-4 text-amber-500" />;
      case 'view':
        return <Eye className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'edit':
        return 'Edit';
      case 'view':
        return 'View';
      default:
        return role;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Collaborators - ${deckName}`} size="lg">
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Invite Form - Only for owners and admins */}
        {isOwner && (
          <form
            onSubmit={handleInvite}
            className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl"
          >
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
              Invite Collaborator
            </h3>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                disabled={inviting}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                disabled={inviting}
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition cursor-pointer"
              >
                {inviting ? 'Sending...' : 'Invite'}
              </button>
            </div>
          </form>
        )}

        {/* Collaborators List */}
        <div>
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 mb-3">
            Team Members ({collaborators.length})
          </h3>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-neutral-100 dark:bg-neutral-900 h-12 rounded-lg"
                />
              ))}
            </div>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 text-sm">
              No collaborators yet. Invite team members to collaborate on this deck.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                      <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">
                        {collab.userRef?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                        {collab.userRef?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {collab.userRef?.email || ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role Badge */}
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
                      {getRoleIcon(collab.role)}
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {getRoleLabel(collab.role)}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {collab.status === 'pending' && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Pending
                      </span>
                    )}

                    {/* Role Selector - Only for owners */}
                    {isOwner && collab.status === 'accepted' && canAdmin && (
                      <select
                        value={collab.role}
                        onChange={(e) => handleUpdateRole(collab.id, e.target.value)}
                        className="text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-2 py-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}

                    {/* Remove Button - Only for owners */}
                    {isOwner && canAdmin && (
                      <button
                        onClick={() => handleRemove(collab.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-500 transition cursor-pointer"
                        title="Remove collaborator"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permissions Legend */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <h4 className="font-semibold text-xs text-blue-900 dark:text-blue-100 mb-2">
            Permission Levels
          </h4>
          <div className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <Eye className="w-3 h-3" />
              <span>
                <strong>View:</strong> Can view cards and see real-time updates
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Edit className="w-3 h-3" />
              <span>
                <strong>Edit:</strong> Can add, modify, and delete cards
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" />
              <span>
                <strong>Admin:</strong> Full control including managing collaborators
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeckCollaboratorsModal;
