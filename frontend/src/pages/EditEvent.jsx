import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EventForm from '../components/EventForm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function EditEvent() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const [eventRes, templatesRes, usersRes, groupsRes] = await Promise.all([
          fetch(`${API_URL}/events/${id}`),
          fetch(`${API_URL}/admin/events/templates`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
          fetch(`${API_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
          fetch(`${API_URL}/admin/groups`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        ]);
        const eventData = await eventRes.json();
        const templatesData = await templatesRes.json();
        const usersData = await usersRes.json();
        const groupsData = await groupsRes.json();
        
        setEvent(eventData.event);
        setTemplates(templatesData);
        setUsers(usersData);
        setGroups(groupsData);
      } catch (error) {
        console.error("Failed to fetch event data", error);
      }
    };
    fetchEventData();
  }, [id]);

  if (!event) return <div className="p-8 text-center text-stone-400">Loading...</div>;

  return <EventForm event={event} templates={templates} users={users} groups={groups} isEditing={true} isTemplate={false} />;
}
