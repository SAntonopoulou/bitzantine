import React, { useState, useEffect, useMemo } from 'react';
import { api, API_URL } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { MoreVertical, Trash2, Shield, Users, UserX, UserCheck, Tv, Check, X as XIcon } from 'lucide-react';

const RoleChangeModal = ({ isOpen, onClose, onConfirm, user, currentUser }) => {
    const [selectedRole, setSelectedRole] = useState(user?.role);

    useEffect(() => {
        if (user) {
            setSelectedRole(user.role);
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const availableRoles = {
        super_admin: "Super Admin",
        admin: "Admin",
        moderator: "Moderator",
        officer: "Officer",
        citizen: "Citizen",
        user: "User"
    };

    const canAssignRole = (role) => {
        if (currentUser.role === 'super_admin') {
            return true;
        }
        if (currentUser.role === 'admin') {
            return role !== 'super_admin';
        }
        return false;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-stone-800 rounded-lg p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-white mb-4">Change Role for {user.username}</h2>
                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-stone-700 border border-stone-600 rounded-md px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-500 mb-6"
                >
                    {Object.entries(availableRoles).map(([key, name]) => (
                        canAssignRole(key) && <option key={key} value={key}>{name}</option>
                    ))}
                </select>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md text-stone-300 bg-stone-700 hover:bg-stone-600">Cancel</button>
                    <button onClick={() => onConfirm(selectedRole)} className="px-4 py-2 rounded-md text-white bg-amber-600 hover:bg-amber-700">Confirm</button>
                </div>
            </div>
        </div>
    );
};

const GroupEditModal = ({ isOpen, onClose, onConfirm, user, allGroups, initialSelectedGroups }) => {
    const [selectedGroups, setSelectedGroups] = useState(new Set());

    useEffect(() => {
        if (isOpen) {
            setSelectedGroups(initialSelectedGroups);
        }
    }, [isOpen, initialSelectedGroups]);

    if (!isOpen || !user) return null;

    const handleGroupToggle = (groupId) => {
        const newSelection = new Set(selectedGroups);
        if (newSelection.has(groupId)) {
            newSelection.delete(groupId);
        } else {
            newSelection.add(groupId);
        }
        setSelectedGroups(newSelection);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-stone-800 rounded-lg p-8 max-w-lg w-full">
                <h2 className="text-2xl font-bold text-white mb-6">Edit Groups for {user.username}</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {allGroups.map(group => (
                        <label key={group.id} className="flex items-center justify-between bg-stone-700 p-3 rounded-md cursor-pointer">
                            <span className="text-stone-200">{group.name}</span>
                            <input
                                type="checkbox"
                                checked={selectedGroups.has(group.id)}
                                onChange={() => handleGroupToggle(group.id)}
                                className="form-checkbox h-5 w-5 text-amber-600 bg-stone-900 border-stone-600 rounded focus:ring-amber-500"
                            />
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md text-stone-300 bg-stone-700 hover:bg-stone-600">Cancel</button>
                    <button onClick={() => onConfirm(selectedGroups)} className="px-4 py-2 rounded-md text-white bg-amber-600 hover:bg-amber-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};


const AdminUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [streamerApplications, setStreamerApplications] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [groups, setGroups] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState(new Set());
    const { user: currentUser } = useAuth();
    const { showNotification } = useNotification();

    const [view, setView] = useState('allUsers'); // 'allUsers' or 'streamerApplications'
    const [sortConfig, setSortConfig] = useState({ key: 'username', direction: 'ascending' });
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isRemoveStreamerModalOpen, setIsRemoveStreamerModalOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(null);

    const fetchAllData = () => {
        fetchUsers();
        fetchStreamerApplications();
        fetchGroups();
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) { console.error("Error fetching users:", error); }
    };

    const fetchStreamerApplications = async () => {
        try {
            const response = await api.get('/admin/streamer-applications');
            setStreamerApplications(response.data);
        } catch (error) { console.error("Error fetching streamer applications:", error); }
    };

    const fetchGroups = async () => {
        try {
            const response = await api.get('/admin/events/form-data/groups');
            setGroups(response.data);
        } catch (error) { console.error("Error fetching groups:", error); }
    };

    const sortedAndFilteredUsers = useMemo(() => {
        let sourceData = view === 'allUsers' ? users : streamerApplications;
        let filteredUsers = [...sourceData];

        if (view === 'allUsers') {
            if (roleFilter) filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
            if (statusFilter) filteredUsers = filteredUsers.filter(user => user.is_active === (statusFilter === 'active'));
        }
        
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
    }, [users, streamerApplications, view, sortConfig, roleFilter, statusFilter, searchTerm]);

    const handleApproveStreamer = async (userId) => {
        try {
            await api.post(`/admin/users/${userId}/streamer-approve`);
            showNotification("Streamer approved!", "success");
            fetchStreamerApplications();
        } catch (err) {
            showNotification("Failed to approve streamer.", "error");
        }
    };

    const handleRejectStreamer = async (userId) => {
        try {
            await api.post(`/admin/users/${userId}/streamer-reject`);
            showNotification("Streamer rejected.", "success");
            fetchStreamerApplications();
        } catch (err) {
            showNotification("Failed to reject streamer.", "error");
        }
    };

    const handleStatusChange = async (user, newStatus) => {
        try {
            await api.put(`/admin/users/${user.id}/status`, { is_active: newStatus });
            fetchAllData();
        } catch (error) { console.error("Error updating user status:", error); }
    };

    const handleRoleChange = async (newRole) => {
        try {
            await api.put(`/admin/users/${selectedUser.id}/role`, { role: newRole });
            fetchAllData();
            setIsRoleModalOpen(false);
        } catch (error) { console.error("Error updating user role:", error); }
    };

    const handleGroupChange = async (newSelectedGroups) => {
        try {
            const currentGroupIds = new Set(selectedUser.groups.map(g => groups.find(group => group.name === g)?.id));
            const toAdd = [...newSelectedGroups].filter(groupId => !currentGroupIds.has(groupId));
            const toRemove = [...currentGroupIds].filter(groupId => !newSelectedGroups.has(groupId));
            for (const groupId of toAdd) await api.post(`/admin/users/${selectedUser.id}/assign-group`, { group_id: groupId });
            for (const groupId of toRemove) await api.delete(`/admin/users/${selectedUser.id}/remove-group/${groupId}`);
            fetchAllData();
            setIsGroupModalOpen(false);
        } catch (error) { console.error("Error updating user groups:", error); }
    };

    const handleDeleteUser = async () => {
        try {
            await api.delete(`/admin/users/${selectedUser.id}`);
            fetchAllData();
            setIsDeleteModalOpen(false);
        } catch (error) { console.error("Error deleting user:", error); }
    };

    const handleRemoveStreamer = async () => {
        try {
            await api.post(`/admin/users/${selectedUser.id}/streamer-remove`);
            showNotification("User removed from streamer program.", "success");
            fetchAllData();
            setIsRemoveStreamerModalOpen(false);
        } catch (error) {
            console.error("Error removing streamer:", error);
            showNotification("Failed to remove streamer.", "error");
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
    const openRemoveStreamerModal = (user) => {
        setSelectedUser(user);
        setIsRemoveStreamerModalOpen(true);
        setMobileMenuOpen(null);
    };
    const canChangeRole = (targetUserRole) => {
        if (!currentUser) return false;
        if (currentUser.role === 'super_admin') return true;
        if (currentUser.role === 'admin' && targetUserRole !== 'admin' && targetUserRole !== 'super_admin') return true;
        return false;
    };

    const inputStyles = "w-full bg-stone-700 border border-stone-600 rounded-md px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-500";
    const tabStyles = "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors";
    const activeTabStyles = "bg-stone-800 text-amber-500";
    const inactiveTabStyles = "bg-stone-900/50 text-stone-400 hover:bg-stone-800/70";

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-amber-500 mb-8">User Management</h1>
            
            <div className="border-b border-stone-700 mb-8">
                <nav className="flex space-x-2">
                    <button onClick={() => setView('allUsers')} className={`${tabStyles} ${view === 'allUsers' ? activeTabStyles : inactiveTabStyles}`}>All Users</button>
                    <button onClick={() => setView('streamerApplications')} className={`${tabStyles} ${view === 'streamerApplications' ? activeTabStyles : inactiveTabStyles} flex items-center gap-2`}>
                        <Tv size={16} /> Streamer Applications
                        {streamerApplications.length > 0 && <span className="bg-amber-500 text-stone-900 text-xs font-bold rounded-full px-2 py-0.5">{streamerApplications.length}</span>}
                    </button>
                </nav>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputStyles} md:col-span-2 lg:col-span-2`} />
                {view === 'allUsers' && (
                    <>
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={inputStyles}><option value="">All Roles</option><option value="super_admin">Super Admin</option><option value="admin">Admin</option><option value="moderator">Moderator</option><option value="officer">Officer</option><option value="citizen">Citizen</option><option value="user">User</option></select>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputStyles}><option value="">All Statuses</option><option value="active">Active</option><option value="pending">Pending</option></select>
                    </>
                )}
            </div>

            <div className="bg-stone-800 shadow-lg rounded-lg divide-y divide-stone-700">
                {sortedAndFilteredUsers.map((user) => (
                    <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3 flex-grow">
                            <img src={user.avatar_url ? `${API_URL}${user.avatar_url}` : `https://ui-avatars.com/api/?name=${user.display_name || user.username}&background=292524&color=f59e0b`} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                            <div>
                                <p className="font-bold text-stone-100">{user.display_name || user.username}</p>
                                <p className="text-sm text-stone-400">@{user.username}</p>
                                {view === 'allUsers' && (
                                    <p className="text-xs text-stone-500 capitalize mt-1">{user.role.replace('_', ' ')}</p>
                                )}
                                {view === 'streamerApplications' && user.profile?.social_links && (
                                    <div className="flex gap-2 mt-1">
                                        {user.profile.social_links.twitch && <a href={`https://twitch.tv/${user.profile.social_links.twitch}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline text-xs">Twitch</a>}
                                        {user.profile.social_links.youtube && <a href={`https://youtube.com/${user.profile.social_links.youtube}`} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline text-xs">YouTube</a>}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 flex-shrink-0">
                            {view === 'streamerApplications' ? (
                                <>
                                    <button onClick={() => handleApproveStreamer(user.id)} className="flex items-center gap-1 text-sm px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700"><Check size={16}/>Approve</button>
                                    <button onClick={() => handleRejectStreamer(user.id)} className="flex items-center gap-1 text-sm px-3 py-1 rounded-md bg-red-800 text-white hover:bg-red-900"><XIcon size={16}/>Reject</button>
                                </>
                            ) : (
                                <>
                                    <span className={`px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{user.is_active ? 'Active' : 'Pending'}</span>
                                    <div className="relative">
                                        <button onClick={() => setMobileMenuOpen(mobileMenuOpen === user.id ? null : user.id)} className="p-2 text-stone-400 hover:text-white"><MoreVertical /></button>
                                        {mobileMenuOpen === user.id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-stone-900 border border-stone-700 rounded-md shadow-lg z-10">
                                                {user.is_active ? <button onClick={() => handleStatusChange(user, false)} className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-stone-800 flex items-center gap-2"><UserX size={16}/>Suspend</button> : <button onClick={() => handleStatusChange(user, true)} className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-stone-800 flex items-center gap-2"><UserCheck size={16}/>Approve</button>}
                                                {canChangeRole(user.role) && <button onClick={() => openRoleModal(user)} className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 flex items-center gap-2"><Shield size={16}/>Change Role</button>}
                                                <button onClick={() => openGroupModal(user)} className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 flex items-center gap-2"><Users size={16}/>Edit Groups</button>
                                                {user.streamer_status === 'approved' && (
                                                    <button onClick={() => openRemoveStreamerModal(user)} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-stone-800 flex items-center gap-2">
                                                        <Tv size={16} /> Remove Streamer
                                                    </button>
                                                )}
                                                {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && <button onClick={() => openDeleteModal(user)} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-stone-800 flex items-center gap-2"><Trash2 size={16}/>Delete</button>}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
                {sortedAndFilteredUsers.length === 0 && <p className="p-8 text-center text-stone-500">No users found.</p>}
            </div>
            
            <RoleChangeModal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                onConfirm={handleRoleChange}
                user={selectedUser}
                currentUser={currentUser}
            />

            <GroupEditModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                onConfirm={handleGroupChange}
                user={selectedUser}
                allGroups={groups}
                initialSelectedGroups={selectedGroups}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteUser}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the user "${selectedUser?.username}"? This action cannot be undone.`}
            />

            <ConfirmationModal
                isOpen={isRemoveStreamerModalOpen}
                onClose={() => setIsRemoveStreamerModalOpen(false)}
                onConfirm={handleRemoveStreamer}
                title="Confirm Streamer Removal"
                message={`Are you sure you want to remove ${selectedUser?.username} from the streamer program?`}
                confirmText="Confirm"
                isDestructive={true}
            />
        </div>
    );
};

export default AdminUserManagement;
