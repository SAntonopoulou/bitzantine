import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AnnouncementForm from '../components/AnnouncementForm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function EditAnnouncement() {
  const { id } = useParams();
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/announcements/${id}`)
      .then(res => res.json())
      .then(data => setAnnouncement(data.announcement))
      .catch(err => console.error("Failed to fetch announcement", err));
  }, [id]);

  if (!announcement) return <div className="p-8 text-center text-stone-400">Loading...</div>;

  return <AnnouncementForm announcement={announcement} isEditing={true} />;
}
