'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/app/ui';
import { Event } from '@/app/type/types';
import axios from 'axios';
import Link from 'next/link';

interface EventCalendarProps {
    userId?: number;
    showAllAvailable?: boolean;
}

export default function EventCalendar({ userId, showAllAvailable = false }: EventCalendarProps) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const [enrolledEvents, setEnrolledEvents] = useState<Event[]>([]);
    const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch enrolled events (past and future)
                if (userId) {
                    const enrolledParams = new URLSearchParams();
                    enrolledParams.append('userId', userId.toString());
                    const enrolledResponse = await axios.get(`${apiUrl}/event?${enrolledParams.toString()}`);
                    setEnrolledEvents(enrolledResponse.data);

                    // Fetch available events if requested
                    if (showAllAvailable) {
                        const availableResponse = await axios.get(`${apiUrl}/event/available/${userId}`);
                        // Filter out events the user is already enrolled in
                        const enrolledIds = new Set(enrolledResponse.data.map((e: Event) => e.id));
                        const notEnrolled = availableResponse.data.filter((e: Event) => !enrolledIds.has(e.id));
                        setAvailableEvents(notEnrolled);
                    }
                }
            } catch (err) {
                const error = err as { response?: { data?: { error?: string } } };
                setError(error.response?.data?.error || 'Error while loading events.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [userId, showAllAvailable, apiUrl]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        let startingDayOfWeek = firstDay.getDay();

        // Adjust starting day of the week to start on Monday
        startingDayOfWeek = (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1);

        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const getEventsForDay = (day: number, month: number, year: number) => {
        const enrolled = enrolledEvents.filter(event => {
            const eventDate = new Date(event.start);
            return (
                eventDate.getDate() === day &&
                eventDate.getMonth() === month &&
                eventDate.getFullYear() === year
            );
        });

        const available = availableEvents.filter(event => {
            const eventDate = new Date(event.start);
            return (
                eventDate.getDate() === day &&
                eventDate.getMonth() === month &&
                eventDate.getFullYear() === year
            );
        });

        return { enrolled, available };
    };

    const isEventPast = (event: Event) => {
        return new Date(event.end) < new Date();
    };

    const getEventColor = (event: Event, isEnrolled: boolean) => {
        if (isEventPast(event)) {
            return isEnrolled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-700 hover:bg-gray-600';
        }
        return isEnrolled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700';
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (loading) {
        return (
            <Card>
                <div className="text-center py-8 text-gray-400">Loading calendar...</div>
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

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(<div key={`empty-${i}`} className="h-20 bg-gray-800 rounded"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const { enrolled, available } = getEventsForDay(day, month, year);
        const allEvents = [...enrolled, ...available];
        const isToday = new Date().getDate() === day &&
                                        new Date().getMonth() === month &&
                                        new Date().getFullYear() === year;

        days.push(
            <div
                key={day}
                className={`h-20 bg-gray-700 rounded p-2 ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
                <div className="text-sm font-semibold text-gray-300 mb-1">{day}</div>
                <div className="space-y-1">
                    {enrolled.slice(0, 2).map(event => (
                        <Link
                            key={event.id}
                            href={`/mentor/event/${event.id}`}
                            className={`block text-xs ${getEventColor(event, true)} text-white rounded px-1 py-0.5 truncate transition-colors`}
                            title={`${event.title} - Inscrito`}
                        >
                            {event.title}
                        </Link>
                    ))}
                    {available.slice(0, 2 - enrolled.length).map(event => (
                        <Link
                            key={event.id}
                            href={`/mentor/event/${event.id}`}
                            className={`block text-xs ${getEventColor(event, false)} text-white rounded px-1 py-0.5 truncate transition-colors`}
                            title={`${event.title} - Disponible`}
                        >
                            {event.title}
                        </Link>
                    ))}
                    {allEvents.length > 2 && (
                        <div className="text-xs text-gray-400">+{allEvents.length - 2} más</div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <Card>
            <div className="mb-4 flex justify-between items-center">
                <button
                    onClick={prevMonth}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                >
                    ← Previous
                </button>
                <h2 className="text-xl font-bold text-gray-100">
                    {monthNames[month]} {year}
                </h2>
                <button
                    onClick={nextMonth}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                >
                    Next →
                </button>
            </div>

            {showAllAvailable && (
                <div className="mb-4 flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-600 rounded"></div>
                        <span className="text-gray-300">Enrolled</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-600 rounded"></div>
                        <span className="text-gray-300">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-600 rounded"></div>
                        <span className="text-gray-300">Past</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(name => (
                    <div key={name} className="text-center text-sm font-semibold text-gray-400">
                        {name}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days}
            </div>
        </Card>
    );
}

export { EventCalendar };