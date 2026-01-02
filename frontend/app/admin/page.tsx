'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from "../components/Navigation";
import { Card, Button, Input, Badge } from '@/app/ui';
import { MentorshipGroup, AdminStats, StudentWithMemberships, Mentor } from '@/app/type/types';

export default function AdminDashboard() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const [user, setUser] = useState<{ id: number; role: string; name: string; universityId?: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [groups, setGroups] = useState<MentorshipGroup[]>([]);
    const [students, setStudents] = useState<StudentWithMemberships[]>([]);
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<MentorshipGroup | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupMentorId, setNewGroupMentorId] = useState<number | ''>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const [statsRes, groupsRes, studentsRes, mentorsRes] = await Promise.all([
                fetch(`${apiUrl}/mentorshipGroup/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${apiUrl}/mentorshipGroup`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${apiUrl}/mentorshipGroup/university/students`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${apiUrl}/mentorshipGroup/university/mentors`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            if (groupsRes.ok) {
                const groupsData = await groupsRes.json();
                setGroups(groupsData);
            }

            if (studentsRes.ok) {
                const studentsData = await studentsRes.json();
                setStudents(studentsData);
            }

            if (mentorsRes.ok) {
                const mentorsData = await mentorsRes.json();
                setMentors(mentorsData);
            }
        } catch (err) {
            console.error('Error fetching admin data:', err);
        }
    }, [apiUrl]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);

            if (userData.role !== 'ADMIN') {
                router.push('/');
                return;
            }
        } else {
            router.push('/login');
            return;
        }
        setLoading(false);
    }, [router]);

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            fetchData();
        }
    }, [user, fetchData]);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!newGroupMentorId) {
            setError('Please select a mentor for the group');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}/mentorshipGroup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newGroupName,
                    description: newGroupDescription,
                    mentorId: newGroupMentorId
                })
            });

            if (response.ok) {
                setShowCreateModal(false);
                setNewGroupName('');
                setNewGroupDescription('');
                setNewGroupMentorId('');
                fetchData();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create group');
            }
        } catch (error) {
            console.error('Error creating group:', error);
            setError('Network error. Please try again.');
        }
    };

    const handleDeleteGroup = async (groupId: number) => {
        if (!confirm('Are you sure you want to delete this group? All members will be removed.')) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}/mentorshipGroup/${groupId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                fetchData();
                if (selectedGroup?.id === groupId) {
                    setSelectedGroup(null);
                }
            }
        } catch (err) {
            console.error('Error deleting group:', err);
        }
    };

    const handleAddMember = async (userId: number) => {
        if (!selectedGroup) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}/mentorshipGroup/${selectedGroup.id}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userId })
            });

            if (response.ok) {
                fetchData();
                // Refresh selected group
                const groupRes = await fetch(`${apiUrl}/mentorshipGroup/${selectedGroup.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (groupRes.ok) {
                    setSelectedGroup(await groupRes.json());
                }
            }
        } catch (err) {
            console.error('Error adding member:', err);
        }
    };

    const handleRemoveMember = async (userId: number) => {
        if (!selectedGroup) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}/mentorshipGroup/${selectedGroup.id}/members/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                fetchData();
                // Refresh selected group
                const groupRes = await fetch(`${apiUrl}/mentorshipGroup/${selectedGroup.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (groupRes.ok) {
                    setSelectedGroup(await groupRes.json());
                }
            }
        } catch (err) {
            console.error('Error removing member:', err);
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

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStudentsNotInGroup = () => {
        if (!selectedGroup) return [];
        const memberIds = selectedGroup.members?.map(m => m.user.id) || [];
        return filteredStudents.filter(s => !memberIds.includes(s.id));
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-900">
                <Navigation />
                <section className="max-w-7xl mx-auto mt-8 p-8">
                    <div className="text-gray-400 text-center py-8">Loading...</div>
                </section>
            </main>
        );
    }

    if (!user || user.role !== 'ADMIN') {
        return (
            <main className="min-h-screen bg-gray-900">
                <Navigation />
                <section className="max-w-7xl mx-auto mt-8 p-8">
                    <Card className="bg-gray-700 rounded-lg p-6">
                        <div className="text-gray-400 text-center py-8">
                            Only administrators can access this page.
                        </div>
                    </Card>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-900">
            <Navigation />
            <section className="max-w-7xl mx-auto mt-8 p-4 md:p-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-100 mb-2">Admin Dashboard</h1>
                    <p className="text-gray-400">
                        Manage mentorship groups for {stats?.university?.name || 'your university'}
                    </p>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Card className="bg-gray-700">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-400">{stats.totalStudents}</div>
                                <div className="text-gray-400 text-sm">Total Students</div>
                            </div>
                        </Card>
                        <Card className="bg-gray-700">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-400">{stats.totalGroups}</div>
                                <div className="text-gray-400 text-sm">Mentorship Groups</div>
                            </div>
                        </Card>
                        <Card className="bg-gray-700">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-400">{stats.studentsInGroups}</div>
                                <div className="text-gray-400 text-sm">Students in Groups</div>
                            </div>
                        </Card>
                        <Card className="bg-gray-700">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-400">{stats.studentsNotInGroups}</div>
                                <div className="text-gray-400 text-sm">Unassigned Students</div>
                            </div>
                        </Card>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Mentorship Groups List */}
                    <div className="lg:col-span-1">
                        <Card title="Mentorship Groups" headerActions={
                            <Button onClick={() => setShowCreateModal(true)} variant="success" size="sm">
                                + New Group
                            </Button>
                        }>
                            <div className="space-y-3">
                                {groups.length === 0 ? (
                                    <div className="text-gray-400 text-center py-4">
                                        No mentorship groups yet. Create one to get started.
                                    </div>
                                ) : (
                                    groups.map(group => (
                                        <div
                                            key={group.id}
                                            className={`p-4 rounded-lg cursor-pointer transition-colors ${
                                                selectedGroup?.id === group.id
                                                    ? 'bg-blue-600 bg-opacity-30 border border-blue-500'
                                                    : 'bg-gray-600 hover:bg-gray-500'
                                            }`}
                                            onClick={() => setSelectedGroup(group)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-gray-100 font-semibold">{group.name}</h3>
                                                    {group.description && (
                                                        <p className="text-gray-400 text-sm mt-1">{group.description}</p>
                                                    )}
                                                    {group.mentor && (
                                                        <p className="text-purple-400 text-sm mt-1">
                                                            Mentor: {group.mentor.name}
                                                        </p>
                                                    )}
                                                    <Badge variant="default" className="mt-2">
                                                        {group._count?.members || 0} members
                                                    </Badge>
                                                </div>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteGroup(group.id);
                                                    }}
                                                >
                                                    🗑️
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Selected Group Details */}
                    <div className="lg:col-span-2">
                        {selectedGroup ? (
                            <Card title={`${selectedGroup.name} - Members`} headerActions={
                                <Button onClick={() => setShowAssignModal(true)} variant="primary" size="sm">
                                    + Add Student
                                </Button>
                            }>
                                <div className="space-y-3">
                                    {(!selectedGroup.members || selectedGroup.members.length === 0) ? (
                                        <div className="text-gray-400 text-center py-8">
                                            No members in this group yet. Add students to get started.
                                        </div>
                                    ) : (
                                        selectedGroup.members.map(member => (
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
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveMember(member.user.id)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        ) : (
                            <Card>
                                <div className="text-gray-400 text-center py-16">
                                    Select a mentorship group to view and manage its members
                                </div>
                            </Card>
                        )}

                        {/* All Students Section */}
                        <Card title="All University Students" className="mt-6">
                            <div className="mb-4">
                                <Input
                                    type="text"
                                    placeholder="Search students by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {filteredStudents.length === 0 ? (
                                    <div className="text-gray-400 text-center py-4">
                                        No students found
                                    </div>
                                ) : (
                                    filteredStudents.map(student => (
                                        <div
                                            key={student.id}
                                            className="p-3 bg-gray-600 rounded-lg flex items-center gap-3"
                                        >
                                            <div className="flex-shrink-0 w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold">
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-gray-100 font-medium truncate">{student.name}</h4>
                                                <p className="text-gray-400 text-sm truncate">{student.email}</p>
                                                {student.mentorshipGroupMemberships.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {student.mentorshipGroupMemberships.map(m => (
                                                            <Badge key={m.groupId} variant="default" className="text-xs">
                                                                {m.group.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <Badge className={getRoleColor(student.role)}>
                                                {formatRole(student.role)}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-100">Create Mentorship Group</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setError('');
                                    setNewGroupMentorId('');
                                }}
                                className="text-gray-400 hover:text-gray-200 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        {error && (
                            <Badge variant="danger" className="mb-4 w-full">
                                {error}
                            </Badge>
                        )}
                        <form onSubmit={handleCreateGroup}>
                            <div className="mb-4">
                                <label className="block text-gray-300 text-sm font-bold mb-2">
                                    Group Name *
                                </label>
                                <Input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="e.g., Erasmus 2024 Group A"
                                    required
                                    className="w-full"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-300 text-sm font-bold mb-2">
                                    Mentor *
                                </label>
                                <select
                                    value={newGroupMentorId}
                                    onChange={(e) => setNewGroupMentorId(e.target.value ? Number(e.target.value) : '')}
                                    required
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a mentor...</option>
                                    {mentors.map(mentor => (
                                        <option key={mentor.id} value={mentor.id}>
                                            {mentor.name} ({mentor.email})
                                        </option>
                                    ))}
                                </select>
                                {mentors.length === 0 && (
                                    <p className="text-yellow-400 text-sm mt-2">
                                        No mentors available. Please ensure there are users with MENTOR role in your university.
                                    </p>
                                )}
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-300 text-sm font-bold mb-2">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={newGroupDescription}
                                    onChange={(e) => setNewGroupDescription(e.target.value)}
                                    placeholder="Brief description of the group..."
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button type="submit" variant="success" className="flex-1" disabled={mentors.length === 0}>
                                    Create Group
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setError('');
                                        setNewGroupMentorId('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Student Modal */}
            {showAssignModal && selectedGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-100">
                                Add Student to {selectedGroup.name}
                            </h2>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="text-gray-400 hover:text-gray-200 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        <div className="mb-4">
                            <Input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="overflow-y-auto flex-1 space-y-2">
                            {getStudentsNotInGroup().length === 0 ? (
                                <div className="text-gray-400 text-center py-8">
                                    All students are already in this group or no matching students found.
                                </div>
                            ) : (
                                getStudentsNotInGroup().map(student => (
                                    <div
                                        key={student.id}
                                        className="p-3 bg-gray-600 rounded-lg flex items-center gap-3"
                                    >
                                        <div className="flex-shrink-0 w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {student.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-gray-100 font-medium truncate">{student.name}</h4>
                                            <p className="text-gray-400 text-sm truncate">{student.email}</p>
                                        </div>
                                        <Badge className={getRoleColor(student.role)}>
                                            {formatRole(student.role)}
                                        </Badge>
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={() => {
                                                handleAddMember(student.id);
                                                setShowAssignModal(false);
                                            }}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-600">
                            <Button
                                variant="secondary"
                                onClick={() => setShowAssignModal(false)}
                                className="w-full"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}