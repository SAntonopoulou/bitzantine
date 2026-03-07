import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EventForm from '../components/EventForm';
import { api } from '../api';

export default function EditEventTemplate() {
  const { id } = useParams();
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    api.get(`/admin/events/templates/${id}`)
      .then(res => setTemplate(res.data))
      .catch(err => console.error("Failed to fetch template", err));
  }, [id]);

  if (!template) return <div className="p-8 text-center text-stone-400">Loading...</div>;

  return <EventForm event={template} isEditing={true} isTemplate={true} />;
}
