const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient.js');
const { authenticateToken } = require('../middleware/auth.js');

// Helper function to check if user is part of the mentor's group
const isUserInMentorGroup = async (userId, mentorId) => {
    // Check if user is the mentor
    if (userId === mentorId) {
        return true;
    }

// Check if user is a member of any mentorship group where this mentor is the mentor
    const membership = await prisma.mentorshipGroupMember.findFirst({
        where: {
            userId: userId,
            group: {
                mentorId: mentorId
            }
        }
    });
    if (membership) {
        return true;
    }

    // Also check the legacy StudentMentor relationship for backward compatibility
    const relationship = await prisma.studentMentor.findFirst({
        where: {
            studentId: userId,
            mentorId: mentorId
        }
    });
    return !!relationship;
};

// Get all topics for a mentor's group
router.get('/mentor/:mentorId/topics', authenticateToken, async (req, res) => {
    const { mentorId } = req.params;

    // Validate mentorId
    if (isNaN(Number(mentorId))) {
        return res.status(400).json({ error: 'Invalid mentorId format' });
    }

    try {
        // Check if user has access to this mentor's group
        const hasAccess = await isUserInMentorGroup(req.user.userId, parseInt(mentorId));
        if (!hasAccess) {
            return res.status(403).json({ error: 'You do not have access to this mentor group forum' });
        }

        const topics = await prisma.mentorGroupForumTopic.findMany({
            where: { mentorId: parseInt(mentorId) },
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
        console.error('Error fetching mentor group topics:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get a single topic with its posts
router.get('/topic/:topicId', authenticateToken, async (req, res) => {
    const { topicId } = req.params;

    // Validate topicId
    if (isNaN(Number(topicId))) {
        return res.status(400).json({ error: 'Invalid topicId format' });
    }

    try {
        const topic = await prisma.mentorGroupForumTopic.findUnique({
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

        // Check if user has access to this mentor's group
        const hasAccess = await isUserInMentorGroup(req.user.userId, topic.mentorId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'You do not have access to this topic' });
        }

        res.json(topic);
    } catch (error) {
        console.error('Error fetching mentor group topic:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create a new topic (authenticated - must be in mentor group)
router.post('/mentor/:mentorId/topics', authenticateToken, async (req, res) => {
    const { mentorId } = req.params;
    const { title, category, initialPost } = req.body;

    // Validate mentorId
    if (isNaN(Number(mentorId))) {
        return res.status(400).json({ error: 'Invalid mentorId format' });
    }

    if (!title || !category || !initialPost) {
        return res.status(400).json({ error: 'Title, category, and initial post are required' });
    }

    try {
        // Check if user has access to this mentor's group
        const hasAccess = await isUserInMentorGroup(req.user.userId, parseInt(mentorId));
        if (!hasAccess) {
            return res.status(403).json({ error: 'You do not have access to this mentor group forum' });
        }

        const topic = await prisma.mentorGroupForumTopic.create({
            data: {
                mentorId: parseInt(mentorId),
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
        console.error('Error creating mentor group topic:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create a new post in a topic (authenticated)
router.post('/topic/:topicId/posts', authenticateToken, async (req, res) => {
    const { topicId } = req.params;
    const { content } = req.body;

    // Validate topicId
    if (isNaN(Number(topicId))) {
        return res.status(400).json({ error: 'Invalid topicId format' });
    }

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        // Get topic to check access
        const topic = await prisma.mentorGroupForumTopic.findUnique({
            where: { id: parseInt(topicId) }
        });

        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }

        // Check if user has access to this mentor's group
        const hasAccess = await isUserInMentorGroup(req.user.userId, topic.mentorId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'You do not have access to this topic' });
        }

        const post = await prisma.mentorGroupForumPost.create({
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
        await prisma.mentorGroupForumTopic.update({
            where: { id: parseInt(topicId) },
            data: { updatedAt: new Date() }
        });

        res.status(201).json(post);
    } catch (error) {
        console.error('Error creating mentor group post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;