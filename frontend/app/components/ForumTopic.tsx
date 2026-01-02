"use client";
import React, { useState, useEffect } from 'react';
import { ForumTopic as ForumTopicType } from '@/app/type/types';
import { Card, Button, Badge } from '@/app/ui';
import axios from 'axios';

interface ForumTopicProps {
    topicId: number;
    onBack: () => void;
}

const ForumTopicView: React.FC<ForumTopicProps> = ({ topicId, onBack }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const [topic, setTopic] = useState<ForumTopicType | null>(null);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTopic();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topicId]);

    const fetchTopic = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${apiUrl}/forum/topic/${topicId}`);
            setTopic(response.data);
        } catch (error) {
            console.error('Error fetching topic:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitPost = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        if (!token) {
            alert('You must be logged in to reply.');
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(
                `${apiUrl}/forum/topic/${topicId}/posts`,
                { content: newPost },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setNewPost('');
            fetchTopic();
        } catch (error) {
            console.error('Error posting reply:', error);
            alert('Error posting reply. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            'General': 'bg-gray-600 text-gray-200',
            'Accommodation': 'bg-blue-600 text-blue-200',
            'Student Life': 'bg-green-600 text-green-200',
            'Academics': 'bg-purple-600 text-purple-200',
            'Activities': 'bg-orange-600 text-orange-200'
        };
        return colors[category] || colors['General'];
    };

    const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Card className="academic-card bg-gray-700 rounded-lg p-6">
                <div className="text-gray-400 text-center py-8">Loading topic...</div>
            </Card>
        );
    }

    if (!topic) {
        return (
            <Card className="academic-card bg-gray-700 rounded-lg p-6">
                <div className="text-gray-400 text-center py-8">Topic not found</div>
                <div className="text-center mt-4">
                    <Button
                        onClick={onBack}
                        className="btn btn-sm rounded-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2"
                    >
                        Back to Forum
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="academic-card bg-gray-700 rounded-lg p-6">
            <div className="mb-4">
                <Button
                    onClick={onBack}
                    className="btn btn-sm rounded bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 mb-4"
                >
                    ← Back to Forum
                </Button>
                <div className="flex items-start gap-3">
                    {topic.isPinned && (
                        <span className="text-yellow-400 text-2xl">📌</span>
                    )}
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-100 mb-2">{topic.title}</h2>
                        <Badge className={getCategoryColor(topic.category)}>
                            {topic.category}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="space-y-4 mb-6">
                {topic.posts && topic.posts.length > 0 ? (
                    topic.posts.map((post, index) => (
                        <Card key={post.id} className={`p-4 ${index === 0 ? 'bg-gray-600 border-l-4 border-blue-500' : 'bg-gray-650'}`}>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                    {post.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-gray-100">{post.user.name}</span>
                                        <Badge className="bg-gray-700 text-gray-300 text-xs">
                                            {post.user.role}
                                        </Badge>
                                        <span className="text-gray-400 text-sm">
                                            {formatDate(post.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-gray-400 text-center py-4">No posts yet.</div>
                )}
            </div>

            <Card className="p-4 bg-gray-600">
                <h3 className="text-lg font-semibold text-gray-100 mb-3">Reply</h3>
                <form onSubmit={handleSubmitPost}>
                    <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="Write your reply..."
                        className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none h-24 mb-3"
                        required
                    />
                    <Button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-sm rounded-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2"
                    >
                        {submitting ? 'Sending...' : 'Send Reply'}
                    </Button>
                </form>
            </Card>
        </Card>
    );
};

export default ForumTopicView;