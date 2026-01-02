'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from "../components/Navigation";
import EventCalendar from "@/app/components/EventCalendar";
import EventList from "@/app/components/EventList";
import EventForm from "@/app/components/EventForm";
import { Button } from "@/app/ui";

export default function CalendarPage() {
    const [user, setUser] = useState<{ id: number; role: string } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleEventCreated = () => {
        setShowCreateModal(false);
        // Trigger refresh of event lists by updating key
        setRefreshKey(prev => prev + 1);
    };

    const isMentor = user?.role === 'MENTOR';

    return (
        <main className="min-h-screen bg-gray-900">
            <Navigation />
            <section className="max-w-6xl mx-auto mt-8 p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-200 mb-2">Event Calendar</h2>
                        <p className="text-gray-400">
                            Visualize all your scheduled events and meetings.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/mentor/group">
                            <Button variant="primary" size="lg">
                                👥 My Group
                            </Button>
                        </Link>
                        {isMentor && (
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                variant="success"
                                size="lg"
                            >
                                + Create Event
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        {user && <EventCalendar key={`calendar-${refreshKey}`} userId={user.id} showAllAvailable={true} />}
                    </div>

                    <div>
                        {user && <EventList key={`list-${refreshKey}`} userId={user.id} upcoming={true} showAvailable={true} />}
                    </div>
                </div>
            </section>

            {showCreateModal && isMentor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-100">Create New Event</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-200 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        <EventForm mentorId={user!.id} onSuccess={handleEventCreated} />
                    </div>
                </div>
            )}
        </main>
    );
}