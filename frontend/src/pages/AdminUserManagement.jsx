import React, { useState, useEffect, useMemo } from 'react';
import { api, API_URL } from '../api';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { MoreVertical, Trash2, Shield, Users, UserX, UserCheck } from 'lucide-react';

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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(null); // For user-specific action menu on mobile

    useEffect(() => {
        fetchUsers();
        fetchGroups();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await api.get('/admin/events/form-data/groups');
            setGroups(response.data);
        } catch (error) {
            console.error("Error fetching groups:", error);
        }
    };

    const sortedAndFilteredUsers = useMemo(() => {
        let filteredUsers = [...users];
        if (roleFilter) filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
        if (statusFilter) filteredUsers = filteredUsers.filter(user => user.is_active === (statusFilter === 'active'));
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filteredUsers = filteredUsers.filter(user =>
                user.username.toLowerCase().includes(lowercasedTerm) ||
                (user.display_name && user.display_name.toLowerCase().includes(lowercasedTerm))
            );
        }
        if (sortConfig.key) {
            filteredUsers.sort((a, b) => {
                const valA = a[sortConfig.key] || '';
                const valB = b[sortConfig.key] || '';
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filteredUsers;
    }, [users, sortConfig, roleFilter, statusFilter, searchTerm]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
    };

    const handleStatusChange = async (user, newStatus) => {
        try {
            await api.put(`/admin/users/${user.id}/status`, { is_active: newStatus });
            fetchUsers();
        } catch (error) {
            console.error("Error updating user status:", error);
        }
    };

    const handleRoleChange = async (newRole) => {
        try {
            await api.put(`/admin/users/${selectedUser.id}/role`, { role: newRole });
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
            for (const groupId of toAdd) await api.post(`/admin/users/${selectedUser.id}/assign-group`, { group_id: groupId });
            for (const groupId of toRemove) await api.delete(`/admin/users/${selectedUser.id}/remove-group/${groupId}`);
            fetchUsers();
            setIsGroupModalOpen(false);
        } catch (error) {
            console.error("Error updating user groups:", error);
        }
    };

    const handleDeleteUser = async () => {
        try {
            await api.delete(`/admin/users/${selectedUser.id}`);
            fetchUsers();
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const openRoleModal = (user) => { setSelectedUser(user); setIsRoleModalOpen(true); setMobileMenuOpen(null); };
    const openGroupModal = (user) => {
        setSelectedUser(user);
        const userGroupIds = new Set(user.groups.map(gName => groups.find(g => g.name === gName)?.id).filter(Boolean));
        setSelectedGroups(userGroupIds);
        setIsGroupModalOpen(true);
        setMobileMenuOpen(null);
    };
    const openDeleteModal = (user) => { setSelectedUser(user); setIsDeleteModalOpen(true); setMobileMenuOpen(null); };

    const canChangeRole = (targetUserRole) => {
        if (!currentUser) return false;
        if (currentUser.role === 'super_admin') return true;
        if (currentUser.role === 'admin' && targetUserRole !== 'admin' && targetUserRole !== 'super_admin') return true;
        return false;
    };

    if (!currentUser) return <div className="p-4 sm:p-8 text-stone-400 text-center">Loading...</div>;

    const inputStyles = "w-full bg-stone-700 border border-stone-600 rounded-md px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-500";

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-amber-500 mb-8">User Management</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputStyles} md:col-span-2 lg:col-span-2`} />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={inputStyles}>
                    <option value="">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="officer">Officer</option>
                    <option value="citizen">Citizen</option>
                    <option value="user">User</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputStyles}>
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            {/* User List */}
            <div className="bg-stone-800 shadow-lg rounded-lg">
                {/* Desktop Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-stone-700 text-xs text-amber-500 uppercase font-bold tracking-wider">
                    <div className="col-span-3 cursor-pointer hover:text-amber-400" onClick={() => requestSort('display_name')}>Name {getSortIcon('display_name')}</div>
                    <div className="col-span-2 cursor-pointer hover:text-amber-400" onClick={() => requestSort('role')}>Role {getSortIcon('role')}</div>
                    <div className="col-span-2 cursor-pointer hover:text-amber-400" onClick={() => requestSort('is_active')}>Status {getSortIcon('is_active')}</div>
                    <div className="col-span-3">Groups</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* User Rows / Cards */}
                <div className="divide-y divide-stone-700">
                    {sortedAndFilteredUsers.map((user) => (
                        <div key={user.id} className="md:grid md:grid-cols-12 md:gap-4 p-4 hover:bg-stone-700/50 transition-colors items-center">
                            {/* Mobile Card Layout */}
                            <div className="md:hidden flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatar_url ? `${API_URL}${user.avatar_url}` : `https://ui-avatars.com/api/?name=${user.display_name || user.username}&background=292524&color=f59e0b`} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                                        <div>
                                            <p className="font-bold text-stone-100">{user.display_name || user.username}</p>
                                            <p className="text-sm text-stone-400">@{user.username}</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button onClick={() => setMobileMenuOpen(mobileMenuOpen === user.id ? null : user.id)} className="p-2 text-stone-400 hover:text-white"><MoreVertical /></button>
                                        {mobileMenuOpen === user.id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-stone-900 border border-stone-700 rounded-md shadow-lg z-10">
                                                {user.is_active ? <button onClick={() => handleStatusChange(user, false)} className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-stone-800 flex items-center gap-2"><UserX size={16}/>Suspend</button> : <button onClick={() => handleStatusChange(user, true)} className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-stone-800 flex items-center gap-2"><UserCheck size={16}/>Approve</button>}
                                                {canChangeRole(user.role) && <button onClick={() => openRoleModal(user)} className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 flex items-center gap-2"><Shield size={16}/>Change Role</button>}
                                                <button onClick={() => openGroupModal(user)} className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 flex items-center gap-2"><Users size={16}/>Edit Groups</button>
                                                {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && <button onClick={() => openDeleteModal(user)} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-stone-800 flex items-center gap-2"><Trash2 size={16}/>Delete</button>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="font-bold text-stone-500 block text-xs">Role</span> <span className="capitalize">{user.role.replace('_', ' ')}</span></div>
                                    <div><span className="font-bold text-stone-500 block text-xs">Status</span> <span className={`px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{user.is_active ? 'Active' : 'Pending'}</span></div>
                                </div>
                                <div>
                                    <span className="font-bold text-stone-500 block text-xs">Groups</span>
                                    <p className="text-sm text-stone-400 truncate">{user.groups?.join(', ') || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Desktop Table Columns */}
                            <div className="hidden md:flex col-span-3 items-center gap-3">
                                <img src={user.avatar_url ? `${API_URL}${user.avatar_url}` : `https://ui-avatars.com/api/?name=${user.display_name || user.username}&background=292524&color=f59e0b`} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                                <div>
                                    <p className="font-medium text-stone-100">{user.display_name || user.username}</p>
                                    <p className="text-sm text-stone-400">@{user.username}</p>
                                </div>
                            </div>
                            <div className="hidden md:block col-span-2 capitalize">{user.role.replace('_', ' ')}</div>
                            <div className="hidden md:block col-span-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{user.is_active ? 'Active' : 'Pending'}</span>
                            </div>
                            <div className="hidden md:block col-span-3 text-sm text-stone-400 truncate">{user.groups?.join(', ') || 'N/A'}</div>
                            <div className="hidden md:flex col-span-2 justify-end items-center gap-3 text-sm">
                                {user.is_active ? <button onClick={() => handleStatusChange(user, false)} className="text-yellow-400 hover:underline">Suspend</button> : <button onClick={() => handleStatusChange(user, true)} className="text-green-400 hover:underline">Approve</button>}
                                {canChangeRole(user.role) && <button onClick={() => openRoleModal(user)} className="text-stone-400 hover:text-white">Role</button>}
                                <button onClick={() => openGroupModal(user)} className="text-stone-400 hover:text-white">Groups</button>
                                {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && <button onClick={() => openDeleteModal(user)} className="text-red-500 hover:underline">Delete</button>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modals */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-stone-800 rounded-lg shadow-xl p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold text-amber-500 mb-6">Change Role for {selectedUser?.display_name || selectedUser?.username}</h2>
                        <select defaultValue={selectedUser?.role} onChange={(e) => handleRoleChange(e.target.value)} className={`${inputStyles} mb-6`}>
                            {currentUser.role === 'super_admin' && <option value="admin">Admin</option>}
                            {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && <option value="moderator">Moderator</option>}
                            <option value="officer">Officer</option>
                            <option value="citizen">Citizen</option>
                            <option value="user">User</option>
                        </select>
                        <div className="flex justify-end"><button onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 text-stone-400 hover:text-stone-200">Cancel</button></div>
                    </div>
                </div>
            )}
            {isGroupModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-stone-800 rounded-lg shadow-xl p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold text-amber-500 mb-6">Manage Groups for {selectedUser?.display_name || selectedUser?.username}</h2>
                        <div className="max-h-60 overflow-y-auto mb-6 space-y-3 p-2 border border-stone-700 rounded-md">
                            {groups.map((group) => (
                                <label key={group.id} className="flex items-center gap-3 cursor-pointer text-stone-200 hover:text-amber-400 p-1 rounded-md hover:bg-stone-700/50">
                                    <input type="checkbox" checked={selectedGroups.has(group.id)} onChange={(e) => {
                                        const newSelection = new Set(selectedGroups);
                                        if (e.target.checked) newSelection.add(group.id); else newSelection.delete(group.id);
                                        setSelectedGroups(newSelection);
                                    }} className="w-4 h-4 rounded border-stone-600 bg-stone-700 text-amber-500 focus:ring-amber-500"/>
                                    {group.name}
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setIsGroupModalOpen(false)} className="px-4 py-2 text-stone-400 hover:text-stone-200">Cancel</button>
                            <button onClick={handleGroupChange} className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 text-sm font-medium">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmationModal isOpen={isDeleteModalOpen} message={`Are you sure you want to delete ${selectedUser?.display_name || selectedUser?.username}? This action cannot be undone.`} onConfirm={handleDeleteUser} onCancel={() => setIsDeleteModalOpen(false)} />
        </div>
    );
};

export default AdminUserManagement;
