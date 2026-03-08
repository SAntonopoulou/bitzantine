import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { Edit, Trash2, Move } from 'lucide-react';

const GroupItem = ({ group, onMove, onEdit, onDelete, allGroups, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div style={{ marginLeft: `${level * 1}rem` }} className="mt-2">
      <div className="bg-stone-800 border border-stone-700 p-3 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-amber-500 transition-colors">
        <div className="flex items-center gap-3 flex-grow">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-stone-500 hover:text-amber-500 p-1"
            disabled={!group.children?.length}
          >
            {group.children?.length > 0 ? (isExpanded ? '▼' : '▶') : <span className="w-4 inline-block"></span>}
          </button>
          <div>
            <h3 className="text-stone-200 font-bold">{group.name}</h3>
            <div className="flex flex-wrap gap-x-2 text-xs uppercase tracking-widest text-stone-500">
              <span>Type: {group.type}</span>
              <span>•</span>
              <span>Leader: {group.leader?.username || 'None'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center border-t border-stone-700 md:border-none pt-3 md:pt-0">
          <div className="flex items-center gap-2">
            <Move size={14} className="text-stone-500" />
            <select 
              className="bg-stone-700 text-xs text-stone-300 border-none rounded px-2 py-2 focus:ring-1 focus:ring-amber-500 w-full sm:w-auto"
              value={group.parent_id || ''}
              onChange={(e) => onMove(group.id, e.target.value || null)}
            >
              <option value="">Move to Root</option>
              {allGroups.filter(g => g.id !== group.id && !group.children?.some(child => child.id === g.id)).map(g => (
                <option key={g.id} value={g.id}>Move under {g.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => onEdit(group)} className="flex items-center gap-1 text-amber-500 hover:underline text-sm"><Edit size={14}/> Edit</button>
            <button onClick={() => onDelete(group)} className="flex items-center gap-1 text-red-500 hover:underline text-sm"><Trash2 size={14}/> Delete</button>
          </div>
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
          level={level + 1}
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
      const [hRes, fRes] = await Promise.all([api.get('/groups/hierarchy'), api.get('/groups')]);
      setHierarchy(hRes.data);
      setFlatGroups(fRes.data);
    } catch (err) {
      console.error("Failed to fetch groups data:", err);
    }
  };

  const fetchUsers = async () => {
    const res = await api.get('/admin/users');
    setUsers(res.data);
  };

  const handleMove = async (groupId, parentId) => {
    try {
      await api.patch(`/groups/${groupId}/move`, null, { params: { parent_id: parentId } });
      showNotification('Group moved successfully', 'success');
      await fetchData();
    } catch (err) {
      showNotification('Failed to move group', 'error');
    }
  };

  const handleDelete = async () => {
    if (!groupToDelete) return;
    try {
      await api.delete(`/groups/${groupToDelete.id}`);
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
      type: group.type || '',
      image: null,
      leader_id: group.leader?.id || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    if (formData.name) data.append('name', formData.name);
    if (formData.description) data.append('description', formData.description);
    if (formData.type) data.append('type', formData.type);
    if (formData.image) data.append('image', formData.image);
    if (formData.leader_id) data.append('leader_id', formData.leader_id);

    try {
      if (editingGroup) {
        await api.patch(`/groups/${editingGroup.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        showNotification('Group updated successfully', 'success');
      } else {
        await api.post('/groups', data, { headers: { 'Content-Type': 'multipart/form-data' } });
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

  const inputStyles = "shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500";
  const selectStyles = "shadow-inner border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-auto";

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-amber-500">Group Management</h1>
        <button 
          onClick={() => {
            setEditingGroup(null);
            setFormData({ name: '', description: '', type: '', image: null, leader_id: '' });
            setIsModalOpen(true);
          }} 
          className="w-full sm:w-auto bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 font-medium"
        >
          Create New Group
        </button>
      </div>

      <div className="bg-stone-900/50 rounded-2xl p-4 sm:p-8 border border-stone-800">
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
        {hierarchy.length === 0 && <p className="text-stone-500 text-center">No groups created yet.</p>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-800 border border-stone-700 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-amber-500 mb-6">
              {editingGroup ? 'Edit Group' : 'Create New Group'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-stone-400 text-sm mb-1">Group Name</label>
                <input className={inputStyles} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-stone-400 text-sm mb-1">Description</label>
                <textarea className={`${inputStyles} h-24`} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              </div>
              <div>
                <label className="block text-stone-400 text-sm mb-1">Type (e.g. Military, Political)</label>
                <input className={inputStyles} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} required />
              </div>
              <div>
                <label className="block text-stone-400 text-sm mb-1">Group Image</label>
                {editingGroup?.image_url && (
                  <div className="mb-2"><img src={`http://localhost:8000${editingGroup.image_url}`} alt="Current" className="h-20 w-auto object-cover rounded-lg" /></div>
                )}
                <input type="file" accept="image/*" className={`${inputStyles} file:bg-stone-600 file:border-none file:text-stone-300 file:px-4 file:py-2 file:mr-4 file:rounded-md`} onChange={e => setFormData({...formData, image: e.target.files[0]})} />
              </div>
              <div>
                <label className="block text-stone-400 text-sm mb-1">Assign Leader</label>
                <select className={selectStyles} value={formData.leader_id || ''} onChange={(e) => setFormData({...formData, leader_id: e.target.value})}>
                  <option value="">Select a Leader</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingGroup(null); }} className="text-stone-400 hover:text-stone-200">Cancel</button>
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 font-medium">{editingGroup ? 'Save Changes' : 'Create Group'}</button>
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
