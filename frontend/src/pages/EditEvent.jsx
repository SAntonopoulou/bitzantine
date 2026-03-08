import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EventForm from '../components/EventForm';
import { api } from '../api';

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
          api.get(`/events/${id}`),
          api.get(`/admin/events/templates`),
          api.get(`/admin/events/form-data/users`),
          api.get(`/admin/events/form-data/groups`)
        ]);
        
        setEvent(eventRes.data.event);
        setTemplates(templatesRes.data);
        setUsers(usersRes.data);
        setGroups(groupsRes.data);
      } catch (error) {
        console.error("Failed to fetch event data", error);
      }
    };
    fetchEventData();
  }, [id]);

  if (!event) return <div className="p-8 text-center text-stone-400">Loading...</div>;

  return <EventForm event={event} templates={templates} users={users} groups={groups} isEditing={true} isTemplate={false} />;
}
