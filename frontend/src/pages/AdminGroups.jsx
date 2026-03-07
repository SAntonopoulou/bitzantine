import React, { useState, useEffect } from 'react';
import { apiClient, API_URL } from '../apiClient';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ConfirmationModal from '../components/ConfirmationModal';

const GroupItem = ({ group, onMove, onEdit, onDelete, allGroups }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="ml-6 mt-4">
      <div className="bg-stone-800 border border-stone-700 p-4 rounded-lg flex items-center justify-between hover:border-amber-500 transition-colors">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-stone-500 hover:text-amber-500"
          >
            {group.children?.length > 0 ? (isExpanded ? '▼' : '▶') : '•'}
          </button>
          <div>
            <h3 className="text-stone-200 font-bold">{group.name}</h3>
            <div className="flex gap-2 text-xs uppercase tracking-widest text-stone-500">
              <span>{group.type}</span>
              <span>•</span>
              <span>Leader: {group.leader?.username || 'None'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <select 
            className="bg-stone-700 text-xs text-stone-300 border-none rounded px-2 py-1 focus:ring-1 focus:ring-amber-500"
            value={group.parent_id || ''}
            onChange={(e) => onMove(group.id, e.target.value || null)}
          >
            <option value="">No Parent (Root)</option>
            {allGroups.filter(g => g.id !== group.id).map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <button onClick={() => onEdit(group)} className="text-amber-500 hover:underline text-sm">Edit</button>
          <button onClick={() => onDelete(group)} className="text-red-500 hover:underline text-sm">Delete</button>
        </div>
      </div>
      
      {isExpanded && group.children?.map(child => (
        <GroupItem 
          key={child.id} 
          group={child} 
          onMove={onMove} 
          onEdit={onEdit} 
          onDelete={onDelete}
          allGroups={allGroups}
        />
      ))}
    </div>
  );
};

export default function AdminGroups() {
  const [hierarchy, setHierarchy] = useState([]);
  const [flatGroups, setFlatGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', type: '', image: null, leader_id: '' });
  const [users, setUsers] = useState([]);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, []);

  const fetchData = async () => {
    try {
      const hRes = await apiClient.get('/groups/hierarchy');
      const fRes = await apiClient.get('/groups');
      setHierarchy(hRes.data);
      setFlatGroups(fRes.data);
    } catch (err) {
      console.error("Failed to fetch groups data:", err);
    }
  };

  const fetchUsers = async () => {
    const res = await apiClient.get('/admin/users');
    setUsers(res.data);
  };

  const handleMove = async (groupId, parentId) => {
    try {
      await apiClient.patch(`/groups/${groupId}/move`, null, { params: { parent_id: parentId } });
      showNotification('Group moved successfully', 'success');
      await fetchData();
    } catch (err) {
      showNotification('Failed to move group', 'error');
    }
  };

  const handleDelete = async () => {
    if (!groupToDelete) return;
    try {
      await apiClient.delete(`/groups/${groupToDelete.id}`);
      showNotification('Group deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setGroupToDelete(null);
      await fetchData();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Failed to delete group', 'error');
    }
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      type: group.type || '', // Ensure type is set, fallback to empty string
      image: null,
      leader_id: group.leader?.id || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      if (formData.name) data.append('name', formData.name);
      if (formData.description) data.append('description', formData.description);
      if (formData.type) data.append('type', formData.type);
      if (formData.image) {
        data.append('image', formData.image);
      }
      if (formData.leader_id) {
        data.append('leader_id', formData.leader_id);
      }

      if (editingGroup) {
        await apiClient.patch(`/groups/${editingGroup.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showNotification('Group updated successfully', 'success');
      } else {
        await apiClient.post('/groups', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showNotification('Group created successfully', 'success');
      }
      
      setIsModalOpen(false);
      setEditingGroup(null);
      setFormData({ name: '', description: '', type: '', image: null, leader_id: '' });
      await fetchData();
    } catch (err) {
      showNotification('Operation failed', 'error');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-amber-500">Group Management</h1>
        <button 
          onClick={() => {
            setEditingGroup(null);
            setFormData({ name: '', description: '', type: '', image: null, leader_id: '' });
            setIsModalOpen(true);
          }} 
          className="bitz-btn"
        >
          Create New Group
        </button>
      </div>

      <div className="bg-stone-900/50 rounded-2xl p-8 border border-stone-800">
        {hierarchy.map(root => (
          <GroupItem 
            key={root.id} 
            group={root} 
            onMove={handleMove} 
            onEdit={openEditModal}
            onDelete={(g) => { setGroupToDelete(g); setIsDeleteModalOpen(true); }}
            allGroups={flatGroups}
          />
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-800 border border-stone-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-amber-500 mb-6">
              {editingGroup ? 'Edit Group' : 'Create New Group'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-stone-400 text-sm mb-1">Group Name</label>
                <input 
                  className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-stone-400 text-sm mb-1">Description</label>
                <textarea 
                  className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 h-24"
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-stone-400 text-sm mb-1">Type (e.g. Military, Political)</label>
                <input 
                  className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-stone-400 text-sm mb-1">Group Image</label>
                {editingGroup && editingGroup.image_url && (
                  <div className="mb-2">
                    <img src={`${API_URL}${editingGroup.image_url}`} alt="Current" className="h-20 w-20 object-cover rounded-lg" />
                    <p className="text-xs text-stone-500 mt-1">Current Image</p>
                  </div>
                )}
                <input 
                  type="file"
                  accept="image/*"
                  className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                  onChange={e => setFormData({...formData, image: e.target.files[0]})}
                />
              </div>
              
              <div>
                <label className="block text-stone-400 text-sm mb-1">Assign Leader</label>
                <select 
                  className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={formData.leader_id || ''}
                  onChange={(e) => setFormData({...formData, leader_id: e.target.value})}
                >
                  <option value="">Select a Leader</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); setEditingGroup(null); }}
                  className="text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button type="submit" className="bitz-btn">
                  {editingGroup ? 'Save Changes' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        message={
          groupToDelete?.children?.length > 0 
            ? `Warning: ${groupToDelete.name} has ${groupToDelete.children.length} sub-groups. Deleting this group will also delete all its sub-groups. Are you sure?`
            : `Are you sure you want to delete ${groupToDelete?.name}? This cannot be undone.`
        }
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
