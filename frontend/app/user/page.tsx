'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from "../components/Navigation";
import EventList from "../components/EventList";
import EventCalendar from "../components/EventCalendar";
import ErasmusSection from '../components/ErasmusSection';
import { Card, Button } from '@/app/ui';
import { User, Event } from '@/app/type/types';

export default function UsersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [universityName, setUniversityName] = useState<string | null>(null);
  const [stats, setStats] = useState({ enrolledEvents: 0, pastEvents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

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

          // Fetch university name if universityId exists
          if (data.user.universityId) {
            const universityResponse = await fetch(`http://localhost:4000/university/${data.user.universityId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (universityResponse.ok) {
              const universityData = await universityResponse.json();
              setUniversityName(universityData.name);
            } else {
              setUniversityName('Unknown University');
            }
          }

          // Fetch user's event statistics
          try {
            const eventsResponse = await fetch(`http://localhost:4000/event?userId=${data.user.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (eventsResponse.ok) {
              const events: Event[] = await eventsResponse.json();
              const now = new Date();
              const upcoming = events.filter((e: Event) => new Date(e.start) >= now);
              const past = events.filter((e: Event) => new Date(e.end) < now);
              setStats({
                enrolledEvents: upcoming.length,
                pastEvents: past.length
              });
            }
          } catch (statsErr) {
            // Stats are optional, continue without them
            console.error('Could not fetch event stats:', statsErr);
          }
        } else if (response.status === 401 || response.status === 403) {
          // Token is invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/auth/login');
        } else {
          setError('Failed to load profile');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900">
        <Navigation />
        <section className="max-w-3xl mx-auto mt-8 p-8 bg-gray-800 rounded shadow">
          <div className="text-center text-gray-300">Loading profile...</div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-900">
        <Navigation />
        <section className="max-w-3xl mx-auto mt-8 p-8 bg-gray-800 rounded shadow">
          <div className="bg-red-600 text-white p-3 rounded mb-4">
            {error}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <Navigation />
      <section className="max-w-7xl mx-auto mt-8 p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-100 mb-2">My Profile</h2>
            <p className="text-gray-400">User information and activity center</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="danger"
            size="md"
          >
            Log Out
          </Button>
        </div>

        {user && (
          <div className="space-y-6">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - User Info */}
              <div className="lg:col-span-1 space-y-6">
                <Card title="Información Personal">
                  <div className="space-y-3 text-gray-300">
                    <div>
                      <span className="font-medium text-gray-400">Email:</span>
                      <p className="text-gray-200">{user.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-400">Name:</span>
                      <p className="text-gray-200">{user.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-400">Role:</span>
                      <p className="text-gray-200 capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
                    </div>
                    {user.degree && (
                      <div>
                        <span className="font-medium text-gray-400">Degree:</span>
                        <p className="text-gray-200">{user.degree}</p>
                      </div>
                    )}
                    {universityName && (
                      <div>
                        <span className="font-medium text-gray-400">University:</span>
                        <Link 
                          href={`/university/${user.universityId}`}
                          className="text-blue-400 hover:text-blue-300 hover:underline block"
                        >
                          {universityName}
                        </Link>
                      </div>
                    )}
                    {user.erasmusYear && (
                      <div>
                        <span className="font-medium text-gray-400">Erasmus Student:</span>
                        <span className="ml-2 px-2 py-1 rounded text-xs bg-green-600 text-white">
                          Yes
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-400">Member Since:</span>
                      <p className="text-gray-200">{new Date(user.createdAt).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                </Card>

                <Card title="Quick Links">
                  <div className="space-y-2">
                    <Link href="/mentor">
                      <Button variant="primary" size="sm" className="w-full justify-start">
                        📅 View All Events
                      </Button>
                    </Link>
                    <Link href="/university">
                      <Button variant="secondary" size="sm" className="w-full justify-start">
                        🎓 University Search
                      </Button>
                    </Link>
                    {universityName && user.universityId && (
                      <Link href={`/university/${user.universityId}`}>
                        <Button variant="secondary" size="sm" className="w-full justify-start">
                          💬 My University Forum
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
                <ErasmusSection userId={user.id} />
              </div>

              {/* Right Column - Events */}
              <div className="lg:col-span-2 space-y-6">
                <EventList userId={user.id} upcoming={true} showAvailable={true} />
                
                <Card title="Calendario de Eventos">
                  <EventCalendar userId={user.id} showAllAvailable={true} />
                </Card>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}