const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient.js');

// Get all events with optional filters
router.get('/', async (req, res) => {
    const { mentorId, userId, upcoming } = req.query;

    try {
        const where = {};

        if (mentorId) {
            if (isNaN(Number(mentorId))) {
                return res.status(400).json({ error: 'Invalid mentorId format' });
            }
            where.mentorId = Number(mentorId);
        }

        if (userId) {
            if (isNaN(Number(userId))) {
                return res.status(400).json({ error: 'Invalid userId format' });
            }
            where.attendees = {
                some: { id: Number(userId) }
            };
        }

        if (upcoming === 'true') {
            where.start = {
                gte: new Date()
            };
        }

        const events = await prisma.event.findMany({
            where,
            include: {
                mentor: {
                    select: { id: true, name: true, email: true }
                },
                attendees: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: {
                start: 'asc'
            }
        });

        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get available events for a user (events they can see but not necessarily attending)
router.get('/available/:userId', async (req, res) => {
    const { userId } = req.params;
    const { upcoming } = req.query;

    if (isNaN(Number(userId))) {
        return res.status(400).json({ error: 'Invalid userId format' });
    }

    try {
        // Get user with university and mentor relationships
        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            include: {
                mentoredBy: {
                    include: {
                        mentor: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get mentor IDs for this user
        const mentorIds = user.mentoredBy.map(m => m.mentorId);

        // Build where clause for events
        const where = {
            OR: [
                // Public events from user's university
                {
                    visibility: 'PUBLIC',
                    mentor: {
                        universityId: user.universityId
                    }
                },
                // Private events from user's mentors
                {
                    visibility: 'PRIVATE',
                    mentorId: {
                        in: mentorIds
                    }
                }
            ]
        };

        if (upcoming === 'true') {
            where.start = {
                gte: new Date()
            };
        }

        const events = await prisma.event.findMany({
            where,
            include: {
                mentor: {
                    select: { id: true, name: true, email: true }
                },
                attendees: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: {
                start: 'asc'
            }
        });

        res.json(events);
    } catch (error) {
        console.error('Error fetching available events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get event by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const event = await prisma.event.findUnique({
            where: { id: Number(id) },
            include: {
                mentor: {
                    select: { id: true, name: true, email: true }
                },
                attendees: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all attendees for an event
router.get('/:id/attendees', async (req, res) => {
    const { id } = req.params;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const event = await prisma.event.findUnique({
            where: { id: Number(id) },
            include: { attendees: true }
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event.attendees);
    } catch (error) {
        console.error('Error fetching event attendees:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new event
router.post('/', async (req, res) => {
    const { title, description, start, end, location, capacity, mentorId, groupId, visibility } = req.body;

    if (!title || !start || !end || !location || !capacity) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newEvent = await prisma.event.create({
            data: { title, description, start, end, location, capacity, mentorId, groupId, visibility: visibility || 'PUBLIC' },
        });
        res.status(201).json(newEvent);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Unique constraint error: Duplicate entry' });
        }
        if (error.code === 'P2003' && error.meta && error.meta.field_name === 'mentorId') {
            return res.status(400).json({ error: 'Invalid mentorId: Mentor does not exist' });
        }
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add attendee to event
router.post('/:eventId/attend', async (req, res) => {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (isNaN(Number(eventId)) || isNaN(Number(userId))) {
        return res.status(400).json({ error: 'Invalid event or user ID format' });
    }

    try {
        const event = await prisma.event.findUnique({ where: { id: Number(eventId) } });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updatedEvent = await prisma.event.update({
            where: { id: Number(eventId) },
            data: {
                attendees: {
                    connect: { id: Number(userId) }
                }
            }
        });
        res.json(updatedEvent);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Record not found' });
        }
        console.error('Error adding attendee to event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove attendee from event
router.post('/:eventId/unattend', async (req, res) => {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (!eventId || isNaN(Number(eventId))) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }

    if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ error: 'Invalid user ID format' });
    }

    try {
        const event = await prisma.event.findUnique({ where: { id: Number(eventId) } });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updatedEvent = await prisma.event.update({
            where: { id: Number(eventId) },
            data: {
                attendees: {
                    disconnect: { id: Number(userId) }
                }
            }
        });
        res.json(updatedEvent);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Record not found' });
        }
        console.error('Error removing attendee from event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;