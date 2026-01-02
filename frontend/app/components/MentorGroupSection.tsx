"use client";
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/app/ui';
import { MentorshipGroup, MentorshipGroupMember } from '@/app/type/types';
import axios from 'axios';

interface MentorGroupSectionProps {
    mentorId: number;
}

const MentorGroupSection: React.FC<MentorGroupSectionProps> = ({ mentorId }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const [groups, setGroups] = useState<MentorshipGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [showStudents, setShowStudents] = useState(true);

    useEffect(() => {
        fetchGroups();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mentorId]);

    const fetchGroups = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get(
                `${apiUrl}/mentorshipGroup/mentor/${mentorId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setGroups(response.data);
        } catch (error) {
            console.error('Error fetching mentorship groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRoleColor = (role: string) => {
        const colors: { [key: string]: string } = {
            'FUTURE_STUDENT': 'bg-yellow-600 text-yellow-200',
            'STUDENT': 'bg-green-600 text-green-200',
            'FORMER_STUDENT': 'bg-blue-600 text-blue-200',
            'MENTOR': 'bg-purple-600 text-purple-200',
            'ADMIN': 'bg-red-600 text-red-200'
        };
        return colors[role] || 'bg-gray-600 text-gray-200';
    };

    const formatRole = (role: string) => {
        const roleNames: { [key: string]: string } = {
            'FUTURE_STUDENT': 'Future Student',
            'STUDENT': 'Student',
            'FORMER_STUDENT': 'Former Student',
            'MENTOR': 'Mentor',
            'ADMIN': 'Admin'
        };
        return roleNames[role] || role;
    };

    // Collect all unique members from all groups
    const allMembers: MentorshipGroupMember[] = groups.flatMap(group => group.members || []);
    const uniqueMembers = allMembers.filter((member, index, self) => 
        index === self.findIndex(m => m.user.id === member.user.id)
    );

    return (
        <Card className="academic-card bg-gray-700 rounded-lg p-6">
            <div className="card-header mb-4">
                <div className="flex justify-between items-center">
                    <h2 className="card-title text-xl font-bold text-gray-100">
                        👥 Members in Mentorship Group
                    </h2>
                    <Button
                        className="btn btn-sm rounded-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2"
                        onClick={() => setShowStudents(!showStudents)}
                    >
                        {showStudents ? '🙈 Hide Members' : '👁️ Show Members'}
                    </Button>
                </div>
            </div>

            {showStudents && (
                <div className="card-content space-y-3">
                    {loading ? (
                        <div className="text-gray-400 text-center py-8">Loading members...</div>
                    ) : uniqueMembers.length === 0 ? (
                        <div className="text-gray-400 text-center py-8">
                            No members in this mentorship group yet.
                        </div>
                    ) : (
                        <>
                            <div className="text-gray-400 text-sm mb-4">
                                Total members: {uniqueMembers.length}
                            </div>
                            {uniqueMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="p-4 bg-gray-600 rounded-lg flex items-center gap-4"
                                >
                                    <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {member.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-gray-100 font-semibold">
                                            {member.user.name}
                                        </h3>
                                        <p className="text-gray-400 text-sm">
                                            {member.user.email}
                                        </p>
                                    </div>
                                    <Badge className={getRoleColor(member.user.role)}>
                                        {formatRole(member.user.role)}
                                    </Badge>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

            {!showStudents && (
                <div className="text-gray-400 text-center py-8">
                    Member list is hidden. Click &quot;Show Members&quot; to view.
                </div>
            )}
        </Card>
    );
};

export default MentorGroupSection;