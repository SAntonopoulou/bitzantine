import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EventForm from '../components/EventForm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function EditEventTemplate() {
  const { id } = useParams();
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/admin/events/templates/${id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => setTemplate(data))
      .catch(err => console.error("Failed to fetch template", err));
  }, [id]);

  if (!template) return <div className="p-8 text-center text-stone-400">Loading...</div>;

  return <EventForm event={template} isEditing={true} isTemplate={true} />;
}
