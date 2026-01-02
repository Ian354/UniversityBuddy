"use client";
import React, { useState, useEffect } from 'react';
import { MentorGroupForumTopic } from '@/app/type/types';
import { Card, Button, Badge } from '@/app/ui';
import MentorGroupForumTopicView from './MentorGroupForumTopic';
import axios from 'axios';

interface MentorGroupForumSectionProps {
    mentorId: number;
}

const MentorGroupForumSection: React.FC<MentorGroupForumSectionProps> = ({ mentorId }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const [topics, setTopics] = useState<MentorGroupForumTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewTopicForm, setShowNewTopicForm] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
    const [newTopic, setNewTopic] = useState({
        title: '',
        category: 'General',
        initialPost: ''
    });

    const categories = ['General', 'Announcements', 'Q&A', 'Resources', 'Activities'];

    useEffect(() => {
        fetchTopics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mentorId]);

    const fetchTopics = async () => {
        const token = localStorage.getItem('token');
        try {
            setLoading(true);
            const response = await axios.get(
                `${apiUrl}/mentorGroupForum/mentor/${mentorId}/topics`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setTopics(response.data);
        } catch (error) {
            console.error('Error fetching mentor group forum topics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        if (!token) {
            alert('You must be logged in to create a topic.');
            return;
        }

        try {
            await axios.post(
                `${apiUrl}/mentorGroupForum/mentor/${mentorId}/topics`,
                newTopic,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setNewTopic({ title: '', category: 'General', initialPost: '' });
            setShowNewTopicForm(false);
            fetchTopics();
        } catch (error) {
            console.error('Error creating mentor group topic:', error);
            alert('Error creating topic. Please try again.');
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            'General': 'bg-gray-600 text-gray-200',
            'Announcements': 'bg-blue-600 text-blue-200',
            'Q&A': 'bg-green-600 text-green-200',
            'Resources': 'bg-purple-600 text-purple-200',
            'Activities': 'bg-orange-600 text-orange-200'
        };
        return colors[category] || colors['General'];
    };

    if (selectedTopic !== null) {
        return (
            <MentorGroupForumTopicView
                topicId={selectedTopic}
                onBack={() => setSelectedTopic(null)}
            />
        );
    }

    return (
        <Card className="academic-card bg-gray-700 rounded-lg p-6">
            <div className="card-header mb-4">
                <div className="flex justify-between items-center">
                    <h2 className="card-title text-xl font-bold text-gray-100">
                        💬 Mentorship Group Forum
                    </h2>
                    <Button
                        className="btn btn-sm rounded-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2"
                        onClick={() => setShowNewTopicForm(!showNewTopicForm)}
                    >
                        {showNewTopicForm ? 'Cancel' : '+ New Topic'}
                    </Button>
                </div>
            </div>

            {showNewTopicForm && (
                <Card className="mb-4 p-4 bg-gray-600">
                    <form onSubmit={handleCreateTopic} className="space-y-3">
                        <div>
                            <input
                                type="text"
                                placeholder="Topic title"
                                value={newTopic.title}
                                onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <select
                                value={newTopic.category}
                                onChange={(e) => setNewTopic({ ...newTopic, category: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <textarea
                                placeholder="Write your initial message..."
                                value={newTopic.initialPost}
                                onChange={(e) => setNewTopic({ ...newTopic, initialPost: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none h-24"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="btn btn-sm rounded-full bg-green-600 hover:bg-green-500 text-white px-4 py-2"
                        >
                            Create Topic
                        </Button>
                    </form>
                </Card>
            )}

            <div className="card-content space-y-3">
                {loading ? (
                    <div className="text-gray-400 text-center py-8">Loading topics...</div>
                ) : topics.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                        No topics yet. Be the first to create one!
                    </div>
                ) : (
                    topics.map((topic) => (
                        <div
                            key={topic.id}
                            className="p-4 bg-gray-600 rounded-lg hover:bg-gray-550 cursor-pointer transition-colors"
                            onClick={() => setSelectedTopic(topic.id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {topic.isPinned && (
                                            <span className="text-yellow-400">📌</span>
                                        )}
                                        <h3 className="text-gray-100 font-semibold">{topic.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Badge className={getCategoryColor(topic.category)}>
                                            {topic.category}
                                        </Badge>
                                        <span className="text-gray-400">
                                            {topic._count?.posts || 0} replies
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
};

export default MentorGroupForumSection;