import React from 'react';
import EventForm from '../components/EventForm';

export default function AddEventTemplate() {
  return <EventForm isEditing={false} isTemplate={true} />;
}
