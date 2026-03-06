import { useState, useEffect } from 'react';

export default function Events() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => setEvents(data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Upcoming Events</h1>
      <div className="grid gap-6">
        {events.map(event => (
          <div key={event.id} className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-bold mb-2">{event.title}</h2>
            <p className="text-gray-600 mb-4">{event.description}</p>
            <span className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
