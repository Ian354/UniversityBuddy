const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient.js');
const { authenticateToken } = require('../middleware/auth.js');

// Get all topics for a university
router.get('/university/:universityId/topics', async (req, res) => {
    const { universityId } = req.params;

    try {
        const topics = await prisma.forumTopic.findMany({
            where: { universityId: parseInt(universityId) },
            include: {
                _count: {
                    select: { posts: true }
                }
            },
            orderBy: [
                { isPinned: 'desc' },
                { updatedAt: 'desc' }
            ]
        });
        res.json(topics);
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ error: 'Internal server Error' });
    }
});

// Get a single topic with its posts
router.get('/topic/:topicId', async (req, res) => {
    const { topicId } = req.params;

    try {
        const topic = await prisma.forumTopic.findUnique({
            where: { id: parseInt(topicId) },
            include: {
                posts: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                role: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }

        res.json(topic);
    } catch (error) {
        console.error('Error fetching topic:', error);
        res.status(500).json({ error: 'Internal server Error' });
    }
});

// Create a new topic (authenticated)
router.post('/university/:universityId/topics', authenticateToken, async (req, res) => {
    const { universityId } = req.params;
    const { title, category, initialPost } = req.body;

    if (!title || !category || !initialPost) {
        return res.status(400).json({ error: 'Title, category, and initial post are required' });
    }

    try {
        const topic = await prisma.forumTopic.create({
            data: {
                universityId: parseInt(universityId),
                title,
                category,
                posts: {
                    create: {
                        userId: req.user.userId,
                        content: initialPost
                    }
                }
            },
            include: {
                posts: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });

        res.status(201).json(topic);
    } catch (error) {
        console.error('Error creating topic:', error);
        res.status(500).json({ error: 'Internal server Error' });
    }
});

// Create a new post in a topic (authenticated)
router.post('/topic/:topicId/posts', authenticateToken, async (req, res) => {
    const { topicId } = req.params;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        const post = await prisma.forumPost.create({
            data: {
                topicId: parseInt(topicId),
                userId: req.user.userId,
                content
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                }
            }
        });

        // Update topic's updatedAt timestamp
        await prisma.forumTopic.update({
            where: { id: parseInt(topicId) },
            data: { updatedAt: new Date() }
        });

        res.status(201).json(post);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Internal server Error' });
    }
});

module.exports = router;