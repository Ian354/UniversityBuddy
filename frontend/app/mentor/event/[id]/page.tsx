'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Navigation from '@/app/components/Navigation';
import { Card, Button } from '@/app/ui';
import { Event, User } from '@/app/type/types';
import axios from 'axios';
import Link from 'next/link';

export default function EventDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('http://localhost:4000/auth/profile', {
        headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 401 || response.status === 403) {
        // Token is invalid or expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
      }
      } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/auth/login');
      }
    };

    fetchUserProfile();

    const fetchEvent = async () => {
      try {
        const response = await axios.get(`${apiUrl}/event/${id}`);
        setEvent(response.data);
      } catch (err) {
        const error = err as { response?: { data?: { error?: string } } };
        setError(error.response?.data?.error || 'Error while fetching event details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id, apiUrl]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUserAttending = () => {
    if (!user || !event?.attendees) return false;
    return event.attendees.some(attendee => attendee.id === user.id);
  };

  const isEventFull = () => {
    if (!event?.capacity) return false;
    return (event.attendees?.length || 0) >= event.capacity;
  };

  const isEventPast = () => {
    if (!event) return false;
    return new Date(event.end) < new Date();
  };

  const handleSignIn = async () => {
    if (!user || !event) return;

    setActionLoading(true);
    setActionMessage(null);

    try {
      const response = await axios.post(`${apiUrl}/event/${event.id}/attend`, {
        userId: user.id
      });
      
      setEvent(response.data);
      setActionMessage({ type: 'success', text: 'You have successfully signed up for the event!' });
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Error signing up for the event' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!user || !event) return;

    setActionLoading(true);
    setActionMessage(null);

    try {
      const response = await axios.post(`${apiUrl}/event/${event.id}/unattend`, {
        userId: user.id
      });
      
      setEvent(response.data);
      setActionMessage({ type: 'success', text: 'You have successfully signed out of the event.' });
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Error signing out of the event' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900">
        <Navigation />
        <section className="max-w-4xl mx-auto mt-8 p-8">
          <Card>
            <div className="text-center py-8 text-gray-400">Loading event...</div>
          </Card>
        </section>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-gray-900">
        <Navigation />
        <section className="max-w-4xl mx-auto mt-8 p-8">
          <Card>
            <div className="text-center py-8">
              <div className="text-red-400 mb-4">{error || 'Event not found'}</div>
              <Link href="/mentor">
                <Button variant="secondary">Back to events</Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <Navigation />
      <section className="max-w-4xl mx-auto mt-8 p-8">
        <div className="mb-4">
          <Link href="/mentor">
            <Button variant="secondary" size="sm">← Back</Button>
          </Link>
        </div>

        <Card>
          <div className="space-y-6">
            {/* Action Message */}
            {actionMessage && (
              <div className={`p-4 rounded-lg ${
                actionMessage.type === 'success' 
                  ? 'bg-green-900/50 border border-green-600 text-green-200' 
                  : 'bg-red-900/50 border border-red-600 text-red-200'
              }`}>
                {actionMessage.text}
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">{event.title}</h1>
              {event.description && (
                <p className="text-gray-300 text-lg">{event.description}</p>
              )}
            </div>

            {/* Sign In/Out Button Section */}
            {user && !isEventPast() && (
              <div className="border-t border-gray-600 pt-6">
                {isUserAttending() ? (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-400 font-semibold">✓ You are enrolled in this event</span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        If you can no longer attend, you can sign out of the event.
                      </p>
                    </div>
                    <Button 
                      variant="danger" 
                      onClick={handleSignOut}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Procesando...' : 'Darme de baja'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-100 mb-2">
                        Would you like to attend this event?
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {isEventFull() 
                          ? 'This event has reached its maximum capacity.'
                          : 'Click the button to sign up.'
                        }
                      </p>
                    </div>
                    <Button 
                      variant="success" 
                      onClick={handleSignIn}
                      disabled={actionLoading || isEventFull()}
                    >
                      {actionLoading ? 'Procesando...' : 'Inscribirse'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {isEventPast() && (
              <div className="border-t border-gray-600 pt-6">
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                  <p className="text-gray-400 text-center">
                    This event has already ended.
                  </p>
                </div>
              </div>
            )}

            <div className="border-t border-gray-600 pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">Start Date and Time</h3>
                  <p className="text-gray-100">{formatDate(event.start)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">End Date and Time</h3>
                  <p className="text-gray-100">{formatDate(event.end)}</p>
                </div>
              </div>

              {event.location && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">Location</h3>
                  <p className="text-gray-100">{event.location}</p>
                </div>
              )}

              {event.mentor && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">Mentor</h3>
                  <p className="text-gray-100">{event.mentor.name}</p>
                  <p className="text-gray-400 text-sm">{event.mentor.email}</p>
                </div>
              )}

              {event.capacity && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">Capacity</h3>
                  <p className="text-gray-100">
                    {event.attendees?.length || 0} / {event.capacity} attendees
                  </p>
                </div>
              )}
            </div>

            {event.attendees && event.attendees.length > 0 && (
              <div className="border-t border-gray-600 pt-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">
                  Asistentes ({event.attendees.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.attendees.map((attendee) => (
                    <div
                      key={attendee.id}
                      className="bg-gray-700 rounded-lg p-3 border border-gray-600"
                    >
                      <p className="text-gray-100 font-medium">{attendee.name}</p>
                      <p className="text-gray-400 text-sm">{attendee.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}