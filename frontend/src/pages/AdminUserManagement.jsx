import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../apiClient';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';

const AdminUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [groups, setGroups] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState(new Set());
    const { user: currentUser } = useAuth();

    const [sortConfig, setSortConfig] = useState({ key: 'username', direction: 'ascending' });
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // Reattribution state
    const [reattributeContent, setReattributeContent] = useState(false);
    const [reattributeSearch, setReattributeSearch] = useState('');
    const [reattributeTarget, setReattributeTarget] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchGroups();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await apiClient.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await apiClient.get('/groups');
            setGroups(response.data);
        } catch (error) {
            console.error("Error fetching groups:", error);
        }
    };

    const sortedAndFilteredUsers = useMemo(() => {
        let filteredUsers = [...users];

        if (roleFilter) {
            filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
        }
        if (statusFilter) {
            const isActive = statusFilter === 'active';
            filteredUsers = filteredUsers.filter(user => user.is_active === isActive);
        }
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user =>
                user.username.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortConfig.key) {
            filteredUsers.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return filteredUsers;
    }, [users, sortConfig, roleFilter, statusFilter, searchTerm]);

    const reattributeSuggestions = useMemo(() => {
        if (!reattributeSearch || reattributeSearch.length < 2) return [];
        return users.filter(u => 
            u.id !== selectedUser?.id && 
            u.username.toLowerCase().includes(reattributeSearch.toLowerCase())
        ).slice(0, 5);
    }, [reattributeSearch, users, selectedUser]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    };

    const handleStatusChange = async (user, newStatus) => {
        try {
            await apiClient.put(`/admin/users/${user.id}/status`, { is_active: newStatus });
            fetchUsers();
        } catch (error) {
            console.error("Error updating user status:", error);
        }
    };

    const handleRoleChange = async (newRole) => {
        try {
            await apiClient.put(`/admin/users/${selectedUser.id}/role`, { role: newRole });
            fetchUsers();
            setIsRoleModalOpen(false);
        } catch (error) {
            console.error("Error updating user role:", error);
        }
    };

    const handleGroupChange = async () => {
        try {
            const currentGroupIds = new Set(selectedUser.groups.map(g => groups.find(group => group.name === g)?.id));
            
            const toAdd = [...selectedGroups].filter(groupId => !currentGroupIds.has(groupId));
            const toRemove = [...currentGroupIds].filter(groupId => !selectedGroups.has(groupId));

            for (const groupId of toAdd) {
                await apiClient.post(`/admin/users/${selectedUser.id}/assign-group`, { group_id: groupId });
            }
            for (const groupId of toRemove) {
                await apiClient.delete(`/admin/users/${selectedUser.id}/remove-group/${groupId}`);
            }
            
            fetchUsers();
            setIsGroupModalOpen(false);
        } catch (error) {
            console.error("Error updating user groups:", error);
        }
    };

    const handleDeleteUser = async () => {
        try {
            const params = {};
            if (reattributeContent && reattributeTarget) {
                params.reattribute_to = reattributeTarget.id;
            }
            await apiClient.delete(`/admin/users/${selectedUser.id}`, { params });
            fetchUsers();
            setIsDeleteModalOpen(false);
            resetDeleteState();
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const resetDeleteState = () => {
        setReattributeContent(false);
        setReattributeSearch('');
        setReattributeTarget(null);
    };

    const openRoleModal = (user) => {
        setSelectedUser(user);
        setIsRoleModalOpen(true);
    };

    const openGroupModal = (user) => {
        setSelectedUser(user);
        const userGroupIds = new Set(user.groups.map(gName => groups.find(g => g.name === gName)?.id).filter(Boolean));
        setSelectedGroups(userGroupIds);
        setIsGroupModalOpen(true);
    };

    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const canChangeRole = (targetUserRole) => {
        if (!currentUser) return false;
        if (currentUser.role === 'super_admin') return true;
        if (currentUser.role === 'admin' && targetUserRole !== 'admin' && targetUserRole !== 'super_admin') return true;
        return false;
    };

    if (!currentUser) {
        return <div className="p-8 text-stone-400">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-amber-500 mb-8">User Management</h1>
            
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-grow">
                    <input 
                        type="text"
                        placeholder="Search by username" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-stone-700 border border-stone-600 rounded-md px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                </div>
                <select 
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-stone-700 border border-stone-600 rounded-md px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                >
                    <option value="">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="officer">Officer</option>
                    <option value="citizen">Citizen</option>
                    <option value="user">User</option>
                </select>
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-stone-700 border border-stone-600 rounded-md px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                </select>
                <button 
                    onClick={() => { setRoleFilter(''); setStatusFilter(''); setSearchTerm(''); }}
                    className="px-4 py-2 text-stone-400 hover:text-stone-200 transition-colors"
                >
                    Clear Filters
                </button>
            </div>

            <div className="bg-stone-800 shadow-lg rounded-lg p-6 overflow-x-auto">
                <table className="w-full text-left text-stone-200">
                    <thead>
                        <tr className="border-b border-stone-700">
                            <th className="pb-4 text-amber-500 cursor-pointer hover:text-amber-400" onClick={() => requestSort('username')}>
                                Username{getSortIcon('username')}
                            </th>
                            <th className="pb-4 text-amber-500 cursor-pointer hover:text-amber-400" onClick={() => requestSort('role')}>
                                Role{getSortIcon('role')}
                            </th>
                            <th className="pb-4 text-amber-500 cursor-pointer hover:text-amber-400" onClick={() => requestSort('is_active')}>
                                Status{getSortIcon('is_active')}
                            </th>
                            <th className="pb-4 text-amber-500">Groups</th>
                            <th className="pb-4 text-amber-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-700">
                        {sortedAndFilteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-stone-700 transition-colors">
                                <td className="py-4">{user.username}</td>
                                <td className="py-4 capitalize">{user.role.replace('_', ' ')}</td>
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'}`}>
                                        {user.is_active ? 'Active' : 'Pending'}
                                    </span>
                                </td>
                                <td className="py-4 text-sm text-stone-400">{user.groups ? user.groups.join(', ') : ''}</td>
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        {user.is_active ? (
                                            <button 
                                                onClick={() => handleStatusChange(user, false)}
                                                className="text-yellow-500 hover:underline text-sm"
                                            >
                                                Suspend
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleStatusChange(user, true)}
                                                className="bitz-btn-sm"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {canChangeRole(user.role) && (
                                            <button 
                                                onClick={() => openRoleModal(user)}
                                                className="text-stone-400 hover:text-stone-200 text-sm"
                                            >
                                                Role
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => openGroupModal(user)}
                                            className="text-stone-400 hover:text-stone-200 text-sm"
                                        >
                                            Groups
                                        </button>
                                        {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && (
                                            <button 
                                                onClick={() => openDeleteModal(user)}
                                                className="text-red-500 hover:underline text-sm"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Role Change Modal */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-stone-800 rounded-lg shadow-xl p-8 max-w-md w-full">
                        <h2 className="text-xl font-bold text-amber-500 mb-6">Change Role for {selectedUser?.username}</h2>
                        <select
                            defaultValue={selectedUser?.role}
                            onChange={(e) => handleRoleChange(e.target.value)}
                            className="w-full bg-stone-700 border border-stone-600 rounded-md px-4 py-2 text-stone-200 mb-6 focus:outline-none focus:border-amber-500"
                        >
                            {currentUser.role === 'super_admin' && <option value="admin">Admin</option>}
                            {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && <option value="moderator">Moderator</option>}
                            <option value="officer">Officer</option>
                            <option value="citizen">Citizen</option>
                            <option value="user">User</option>
                        </select>
                        <div className="flex justify-end">
                            <button 
                                onClick={() => setIsRoleModalOpen(false)}
                                className="px-4 py-2 text-stone-400 hover:text-stone-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Group Management Modal */}
            {isGroupModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-stone-800 rounded-lg shadow-xl p-8 max-w-md w-full">
                        <h2 className="text-xl font-bold text-amber-500 mb-6">Manage Groups for {selectedUser?.username}</h2>
                        <div className="max-h-60 overflow-y-auto mb-6 space-y-3">
                            {groups.map((group) => (
                                <label key={group.id} className="flex items-center gap-3 cursor-pointer text-stone-200 hover:text-amber-400">
                                    <input
                                        type="checkbox"
                                        checked={selectedGroups.has(group.id)}
                                        onChange={(e) => {
                                            const newSelection = new Set(selectedGroups);
                                            if (e.target.checked) {
                                                newSelection.add(group.id);
                                            } else {
                                                newSelection.delete(group.id);
                                            }
                                            setSelectedGroups(newSelection);
                                        }}
                                        className="w-4 h-4 rounded border-stone-600 bg-stone-700 text-amber-500 focus:ring-amber-500"
                                    />
                                    {group.name}
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end gap-4">
                            <button 
                                onClick={() => setIsGroupModalOpen(false)}
                                className="px-4 py-2 text-stone-400 hover:text-stone-200"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleGroupChange}
                                className="bitz-btn-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal with Reattribution */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-stone-800 rounded-lg shadow-xl p-8 max-w-lg w-full">
                        <h2 className="text-xl font-bold text-red-500 mb-4">Delete User: {selectedUser?.username}</h2>
                        <p className="text-stone-300 mb-6">
                            Are you sure you want to delete this user? This action is permanent.
                        </p>
                        
                        <div className="bg-stone-900/50 p-4 rounded-lg border border-stone-700 mb-6">
                            <label className="flex items-center gap-3 cursor-pointer text-stone-200 mb-4">
                                <input 
                                    type="checkbox"
                                    checked={reattributeContent}
                                    onChange={(e) => setReattributeContent(e.target.checked)}
                                    className="w-4 h-4 rounded border-stone-600 bg-stone-700 text-amber-500 focus:ring-amber-500"
                                />
                                <span className="font-semibold">Reattribute content to another user?</span>
                            </label>
                            
                            {reattributeContent && (
                                <div className="space-y-4">
                                    <p className="text-sm text-stone-400">
                                        Announcements, Lore Entries, and Events created by this user will be transferred to the selected user.
                                    </p>
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            placeholder="Search for a user..."
                                            value={reattributeTarget ? reattributeTarget.username : reattributeSearch}
                                            onChange={(e) => {
                                                setReattributeSearch(e.target.value);
                                                setReattributeTarget(null);
                                            }}
                                            disabled={!!reattributeTarget}
                                            className="w-full bg-stone-700 border border-stone-600 rounded-md px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                                        />
                                        {reattributeTarget && (
                                            <button 
                                                onClick={() => setReattributeTarget(null)}
                                                className="absolute right-2 top-2 text-stone-400 hover:text-stone-200"
                                            >
                                                ✕
                                            </button>
                                        )}
                                        
                                        {!reattributeTarget && reattributeSuggestions.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-stone-700 border border-stone-600 rounded-md shadow-xl">
                                                {reattributeSuggestions.map(u => (
                                                    <div 
                                                        key={u.id}
                                                        onClick={() => {
                                                            setReattributeTarget(u);
                                                            setReattributeSearch('');
                                                        }}
                                                        className="px-4 py-2 hover:bg-stone-600 cursor-pointer text-stone-200"
                                                    >
                                                        {u.username} ({u.role})
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-4">
                            <button 
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    resetDeleteState();
                                }}
                                className="px-4 py-2 text-stone-400 hover:text-stone-200"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeleteUser}
                                disabled={reattributeContent && !reattributeTarget}
                                className={`px-4 py-2 rounded font-bold transition-colors ${
                                    reattributeContent && !reattributeTarget 
                                    ? 'bg-stone-700 text-stone-500 cursor-not-allowed' 
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserManagement;
