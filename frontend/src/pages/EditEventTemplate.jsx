import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EventForm from '../components/EventForm';
import { api } from '../api';

export default function EditEventTemplate() {
  const { id } = useParams();
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    // Since there isn't a direct endpoint to get a single template by ID in the provided backend code,
    // we fetch all templates and find the one we need.
    // Ideally, the backend should have a GET /admin/events/templates/{id} endpoint.
    api.get(`/admin/events/templates`)
      .then(res => {
        const foundTemplate = res.data.find(t => t.id === parseInt(id));
        if (foundTemplate) {
          setTemplate(foundTemplate);
        } else {
          console.error("Template not found");
        }
      })
      .catch(err => console.error("Failed to fetch templates", err));
  }, [id]);

  if (!template) return <div className="p-8 text-center text-stone-400">Loading...</div>;

  return <EventForm event={template} isEditing={true} isTemplate={true} />;
}
