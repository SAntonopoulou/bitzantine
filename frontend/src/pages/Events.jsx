import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useNavigate } from 'react-router-dom';
import EventList from '../components/EventList';
import WeeklyEventList from '../components/WeeklyEventList';
import { api } from '../api';

export default function Events() {
  const [view, setView] = useState('listAll'); // Default to the infinite scroll list view
  const [calendarEvents, setCalendarEvents] = useState([]);
  const navigate = useNavigate();

  const fetchAllEventsForCalendar = () => {
    api.get('/events?limit=200')
      .then(res => {
        const formattedEvents = res.data.map(event => ({
          id: event.id,
          title: event.title,
          start: event.date,
          end: event.end_time,
        }));
        setCalendarEvents(formattedEvents);
      })
      .catch(err => console.error("Failed to fetch events for calendar", err));
  };

  useEffect(() => {
    // Fetch events only when the calendar view is active
    if (view === 'dayGridMonth') {
      fetchAllEventsForCalendar();
    }
  }, [view]);

  const handleEventClick = (clickInfo) => {
    navigate(`/events/${clickInfo.event.id}`);
  };

  const renderView = () => {
    switch (view) {
      case 'listAll':
        return <EventList />;
      case 'weekly':
        return <WeeklyEventList />;
      case 'dayGridMonth':
        return (
          <div className="fc-theme">
            <FullCalendar
              key={view}
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: ''
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              height="auto"
              noEventsContent="No events to display"
            />
          </div>
        );
      default:
        return <EventList />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-amber-500">Events</h1>
        <div className="flex gap-2 p-1 bg-stone-800 rounded-lg">
          <button onClick={() => setView('listAll')} className={`px-4 py-2 text-sm rounded-md ${view === 'listAll' ? 'bg-amber-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>List</button>
          <button onClick={() => setView('weekly')} className={`px-4 py-2 text-sm rounded-md ${view === 'weekly' ? 'bg-amber-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>Weekly</button>
          <button onClick={() => setView('dayGridMonth')} className={`px-4 py-2 text-sm rounded-md ${view === 'dayGridMonth' ? 'bg-amber-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>Calendar</button>
        </div>
      </div>
      {renderView()}
    </div>
  );
}
