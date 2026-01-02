"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {User, WeeklyAvailability} from "@/app/type/types";
import { Card, Button, Badge } from "@/app/ui";
import axios from "axios";
import Navigation from "@/app/components/Navigation";


export default function MentorProfilePage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const { id } = useParams() as { id: string | undefined };

    const [mentor, setMentor] = useState<User | null>(null);
    const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            try {
                const response = await axios.get(`${apiUrl}/users/${id}`);
                setMentor(response.data);

                const weeklyResponse = await axios.get(`${apiUrl}/mentorAvailability/mentor/${id}/week`);
                setWeeklyAvailability(weeklyResponse.data);
            } catch (error) {
                console.error("Error fetching mentor availability:", error);
            }
        };

        fetchData();
        
    }, [id, apiUrl]);

    return (
        <main className="min-h-screen bg-gray-900 text-gray-100">
            <Navigation />
            <section className="max-w-3xl mx-auto mt-8">
                <Card className="p-8 bg-gray-800 rounded shadow">
                    <h1 className="text-2xl font-bold text-gray-100 mb-4">Mentor Profile</h1>
                    {mentor ? (
                        <>
                            <p className="text-gray-400 mb-2">
                                <strong className="text-gray-100">Name:</strong> {mentor.name}
                            </p>
                            <p className="text-gray-400 mb-6">
                                <strong className="text-gray-100">Email:</strong> {mentor.email}
                            </p>
                        </>
                    ) : (
                        <p className="text-gray-400">Loading mentor details...</p>
                    )}
                </Card>
            </section>
            <section className="max-w-3xl mx-auto mt-8">
                <Card className="p-8 bg-gray-800 rounded shadow">
                    <h2 className="text-xl font-bold text-gray-100 mb-4">Availability</h2>
                    {weeklyAvailability ? (
                        <ul className="text-gray-400">
                            {Object.values(weeklyAvailability).map((day, index) => (
                                <li key={index} className="mb-4">
                                    <strong className="text-gray-100">{day.dayName}:</strong>
                                    {day.slots.length > 0 ? (
                                        <ul className="ml-4 mt-2">
                                            {day.slots.map((slot: { id: number; startTime: string; endTime: string }) => (
                                                <li key={String(slot.id)} className="mb-1">
                                                    {slot.startTime} - {slot.endTime}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="ml-2">No slots available</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400">Loading availability...</p>
                    )}
                </Card>
            </section>
        </main>
    );
};