'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@/app/ui';
import { Event } from '@/app/type/types';
import { useUser } from '@/app/context/UserContext';
import axios from 'axios';
import Link from 'next/link';

interface EventListProps {
  mentorId?: number;
  userId?: number;
  upcoming?: boolean;
  showAvailable?: boolean;
}

export default function EventList({ mentorId, userId, upcoming = true, showAvailable = false }: EventListProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const { user } = useUser();
  const [enrolledEvents, setEnrolledEvents] = useState<Event[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'available'>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch enrolled/mentor events
        const params = new URLSearchParams();
        if (mentorId) params.append('mentorId', mentorId.toString());
        if (userId) params.append('userId', userId.toString());
        if (upcoming) params.append('upcoming', 'true');

        const enrolledResponse = await axios.get(`${apiUrl}/event?${params.toString()}`);
        setEnrolledEvents(enrolledResponse.data);

        // Fetch available events if showAvailable is true
        if (showAvailable && userId) {
          const availableParams = new URLSearchParams();
          if (upcoming) availableParams.append('upcoming', 'true');
          
          const availableResponse = await axios.get(`${apiUrl}/event/available/${userId}?${availableParams.toString()}`);
          // Filter out events the user is already enrolled in
          const enrolledIds = new Set(enrolledResponse.data.map((e: Event) => e.id));
          const notEnrolled = availableResponse.data.filter((e: Event) => !enrolledIds.has(e.id));
          setAvailableEvents(notEnrolled);
        }
      } catch (err) {
        const error = err as { response?: { data?: { error?: string } } };
        setError(error.response?.data?.error || 'Error while loading events.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [mentorId, userId, upcoming, showAvailable, apiUrl]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isEventPast = (event: Event) => {
    return new Date(event.end) < new Date();
  };

  const getDisplayedEvents = () => {
    if (filter === 'enrolled') return enrolledEvents;
    if (filter === 'available') return availableEvents;
    return [...enrolledEvents, ...availableEvents].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  };

  const isEnrolled = (eventId: number) => {
    return enrolledEvents.some(e => e.id === eventId);
  };

  const isEventFull = (event: Event) => {
    if (!event.capacity) return false;
    return (event.attendees?.length || 0) >= event.capacity;
  };

  const handleSignIn = async (eventId: number) => {
    if (!user) return;

    setActionLoading(eventId);
    try {
      await axios.post(`${apiUrl}/event/${eventId}/attend`, {
        userId: user.id
      });
      
      // Refresh events list
      window.location.reload();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Error while signing up for event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSignOut = async (eventId: number) => {
    if (!user) return;

    setActionLoading(eventId);
    try {
      await axios.post(`${apiUrl}/event/${eventId}/unattend`, {
        userId: user.id
      });
      
      // Refresh events list
      window.location.reload();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Error al darse de baja del evento');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-400">Loading events...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8 text-red-400">{error}</div>
      </Card>
    );
  }

  const displayedEvents = getDisplayedEvents();

  if (displayedEvents.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-400">
          No events {filter === 'enrolled' ? 'enrolled' : filter === 'available' ? 'available' : upcoming ? 'upcoming' : ''}.
        </div>
      </Card>
    );
  }

  return (
    <Card title={upcoming ? "Upcoming Events" : "Events"}>
      {showAvailable && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            All ({enrolledEvents.length + availableEvents.length})
          </button>
          <button
            onClick={() => setFilter('enrolled')}
            className={`px-3 py-1 rounded ${filter === 'enrolled' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Enrolled ({enrolledEvents.length})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-3 py-1 rounded ${filter === 'available' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Available ({availableEvents.length})
          </button>
        </div>
      )}

      <div className="space-y-4">
        {displayedEvents.map((event) => (
          <div
            key={event.id}
            className={`border rounded-lg p-4 transition-colors ${
              isEventPast(event) 
                ? 'border-gray-600 bg-gray-800/50' 
                : isEnrolled(event.id)
                  ? 'border-blue-500 hover:border-blue-400'
                  : 'border-green-500 hover:border-green-400'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-100">{event.title}</h3>
                  {isEventPast(event) && (
                    <span className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded">
                      Finished
                    </span>
                  )}
                  {!isEventPast(event) && isEnrolled(event.id) && (
                    <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded">
                      Enrolled
                    </span>
                  )}
                  {!isEventPast(event) && !isEnrolled(event.id) && showAvailable && (
                    <span className="text-xs px-2 py-1 bg-green-600 text-white rounded">
                      Available
                    </span>
                  )}
                  {event.visibility === 'PRIVATE' && (
                    <span className="text-xs px-2 py-1 bg-purple-600 text-white rounded">
                      Private
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {user && !isEventPast(event) && (
                  <>
                    {isEnrolled(event.id) ? (
                      <Button 
                        size="sm" 
                        variant="danger"
                        onClick={() => handleSignOut(event.id)}
                        disabled={actionLoading === event.id}
                      >
                        {actionLoading === event.id ? 'Processing...' : 'Unenroll'}
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="success"
                        onClick={() => handleSignIn(event.id)}
                        disabled={actionLoading === event.id || isEventFull(event)}
                      >
                        {actionLoading === event.id ? 'Processing...' : 'Enroll'}
                      </Button>
                    )}
                  </>
                )}
                <Link href={`/mentor/event/${event.id}`}>
                  <Button size="sm" variant="primary">View Details</Button>
                </Link>
              </div>
            </div>

            {event.description && (
              <p className="text-gray-400 text-sm mb-2">{event.description}</p>
            )}

            <div className="space-y-1 text-sm text-gray-300">
              <div>
                <span className="font-medium">Start:</span> {formatDate(event.start)}
              </div>
              <div>
                <span className="font-medium">End:</span> {formatDate(event.end)}
              </div>
              {event.location && (
                <div>
                  <span className="font-medium">Location:</span> {event.location}
                </div>
              )}
              {event.capacity && (
                <div>
                  <span className="font-medium">Capacity:</span> {event.attendees?.length || 0} / {event.capacity}
                </div>
              )}
              {event.mentor && (
                <div>
                  <span className="font-medium">Mentor:</span> {event.mentor.name}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export { EventList };