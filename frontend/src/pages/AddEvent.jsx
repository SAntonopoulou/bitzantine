import React, { useState, useEffect } from 'react';
import EventForm from '../components/EventForm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AddEvent() {
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesRes, usersRes, groupsRes] = await Promise.all([
          fetch(`${API_URL}/admin/events/templates`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
          fetch(`${API_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
          fetch(`${API_URL}/admin/groups`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        ]);
        const templatesData = await templatesRes.json();
        const usersData = await usersRes.json();
        const groupsData = await groupsRes.json();
        setTemplates(templatesData);
        setUsers(usersData);
        setGroups(groupsData);
      } catch (error) {
        console.error("Failed to fetch initial data for event form", error);
      }
    };
    fetchData();
  }, []);

  return <EventForm templates={templates} users={users} groups={groups} isEditing={false} isTemplate={false} />;
}
