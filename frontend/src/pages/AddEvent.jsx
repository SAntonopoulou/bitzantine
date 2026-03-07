import React, { useState, useEffect } from 'react';
import EventForm from '../components/EventForm';
import { api } from '../api';

export default function AddEvent() {
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesRes, usersRes, groupsRes] = await Promise.all([
          api.get('/admin/events/templates'),
          api.get('/admin/users'),
          api.get('/admin/groups')
        ]);
        setTemplates(templatesRes.data);
        setUsers(usersRes.data);
        setGroups(groupsRes.data);
      } catch (error) {
        console.error("Failed to fetch initial data for event form", error);
      }
    };
    fetchData();
  }, []);

  return <EventForm templates={templates} users={users} groups={groups} isEditing={false} isTemplate={false} />;
}
