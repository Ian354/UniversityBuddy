'use client';

import { useState, useEffect, useCallback } from 'react';
import Navigation from "@/app/components/Navigation";
import MentorGroupSection from "@/app/components/MentorGroupSection";
import MentorGroupForumSection from "@/app/components/MentorGroupForumSection";
import { Card } from "@/app/ui";
import { MentorshipGroup } from "@/app/type/types";
import axios from 'axios';

export default function MentorGroupPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const [user, setUser] = useState<{ id: number; role: string; name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<MentorshipGroup[]>([]);
    const [selectedGroupMentorId, setSelectedGroupMentorId] = useState<number | null>(null);

    const fetchUserGroups = useCallback(async (userId: number, userRole: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            let response;
            if (userRole === 'MENTOR') {
                // Mentor: fetch groups where they are the mentor
                response = await axios.get(`${apiUrl}/mentorshipGroup/mentor/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // Student: fetch groups they are a member of
                response = await axios.get(`${apiUrl}/mentorshipGroup/user/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setGroups(response.data);
            // If there are groups, select the first one's mentor by default
            if (response.data.length > 0) {
                setSelectedGroupMentorId(response.data[0].mentorId);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    }, [apiUrl]);

    useEffect(() => {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            fetchUserGroups(userData.id, userData.role);
        }
        setLoading(false);
    }, [fetchUserGroups]);

    const isMentor = user?.role === 'MENTOR';

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-900">
                <Navigation />
                <section className="max-w-6xl mx-auto mt-8 p-8">
                    <div className="text-gray-400 text-center py-8">Loading...</div>
                </section>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="min-h-screen bg-gray-900">
                <Navigation />
                <section className="max-w-6xl mx-auto mt-8 p-8">
                    <Card className="bg-gray-700 rounded-lg p-6">
                        <div className="text-gray-400 text-center py-8">
                            Please log in to access the mentorship group.
                        </div>
                    </Card>
                </section>
            </main>
        );
    }

    // Check if user has access (is either a mentor or belongs to a group)
    const hasAccess = isMentor || groups.length > 0;

    if (!hasAccess) {
        return (
            <main className="min-h-screen bg-gray-900">
                <Navigation />
                <section className="max-w-6xl mx-auto mt-8 p-8">
                    <Card className="bg-gray-700 rounded-lg p-6">
                        <div className="text-gray-400 text-center py-8">
                            You are not part of any mentorship group yet. Contact your university administrator to be assigned to a group.
                        </div>
                    </Card>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-900">
            <Navigation />
            <section className="max-w-6xl mx-auto mt-8 p-8 space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-200 mb-2">Mentorship Group</h2>
                    <p className="text-gray-400">
                        {isMentor 
                            ? "Manage your mentorship group and communicate with your students."
                            : "Connect with your mentor and fellow group members."
                        }
                    </p>
                </div>

                {/* Group selection if user belongs to multiple groups */}
                {groups.length > 1 && (
                    <Card className="bg-gray-700 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Select Group
                        </label>
                        <select
                            value={selectedGroupMentorId || ''}
                            onChange={(e) => setSelectedGroupMentorId(Number(e.target.value))}
                            className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {groups.map((group) => (
                                <option key={group.id} value={group.mentorId}>
                                    {group.name} - Mentor: {group.mentor?.name}
                                </option>
                            ))}
                        </select>
                    </Card>
                )}

                {selectedGroupMentorId && (
                    <div className="grid grid-cols-1 gap-8">
                        {/* Students Section */}
                        <MentorGroupSection mentorId={selectedGroupMentorId} />

                        {/* Forum Section */}
                        <MentorGroupForumSection mentorId={selectedGroupMentorId} />
                    </div>
                )}
            </section>
        </main>
    );
}