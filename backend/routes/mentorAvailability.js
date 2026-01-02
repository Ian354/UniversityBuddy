const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient.js');

// Get availability slots for a specific mentor
router.get('/mentor/:mentorId', async (req, res) => {
    const { mentorId } = req.params;

    try {
        const availability = await prisma.mentorAvailability.findMany({
            where: { mentorId: Number(mentorId) },
            include: {
                mentor: {
                    select: { id: true, email: true, name: true, role: true }
                }
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });
        res.json(availability);
    } catch (error) {
        console.error('Error fetching mentor availability:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get availability slot by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const availability = await prisma.mentorAvailability.findUnique({
            where: { id: Number(id) },
            include: {
                mentor: {
                    select: { id: true, email: true, name: true, role: true }
                }
            }
        });

        if (!availability) {
            return res.status(404).json({ error: 'Availability slot not found' });
        }

        res.json(availability);
    } catch (error) {
        console.error('Error fetching availability slot:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new availability slot
router.post('/', async (req, res) => {
    const { mentorId, dayOfWeek, startTime, endTime } = req.body;

    if (!mentorId || dayOfWeek === undefined || !startTime || !endTime) {
        return res.status(400).json({ 
            error: 'Missing required fields: mentorId, dayOfWeek, startTime, endTime' 
        });
    }

    if (dayOfWeek < 0 || dayOfWeek > 7) {
        return res.status(400).json({ 
            error: 'dayOfWeek must be between 0 (Sunday) and 7 (Sunday)' 
        });
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return res.status(400).json({ 
            error: 'Time must be in HH:MM format (e.g., "09:00")' 
        });
    }

    if (startTime >= endTime) {
        return res.status(400).json({ 
            error: 'startTime must be before endTime' 
        });
    }

    try {
        const mentor = await prisma.user.findUnique({
            where: { id: Number(mentorId) }
        });

        if (!mentor) {
            return res.status(404).json({ error: 'Mentor not found' });
        }

        if (mentor.role !== 'MENTOR') {
            return res.status(403).json({ 
                error: 'User must have MENTOR role to create availability slots' 
            });
        }

        const newAvailability = await prisma.mentorAvailability.create({
            data: {
                mentorId: Number(mentorId),
                dayOfWeek: Number(dayOfWeek),
                startTime,
                endTime
            }
        });
        res.status(201).json(newAvailability);
    } catch (error) {
        console.error('Error creating availability slot:', error);

        if (error.code === 'P2002') {
            return res.status(409).json({ 
                error: 'Conflicting availability slot already exists for this mentor on this day/time' 
            });
        }

        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update an availability slot
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime } = req.body;

    if (dayOfWeek !== undefined && (dayOfWeek < 0 || dayOfWeek > 7)) {
        return res.status(400).json({ 
            error: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' 
        });
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if ((startTime && !timeRegex.test(startTime)) || (endTime && !timeRegex.test(endTime))) {
        return res.status(400).json({ 
            error: 'Time must be in HH:MM format (e.g., "09:00")' 
        });
    }

    if (startTime && endTime && startTime >= endTime) {
        return res.status(400).json({ 
            error: 'startTime must be before endTime' 
        });
    }

    try {
        const updateData = {};
        if (dayOfWeek !== undefined) updateData.dayOfWeek = Number(dayOfWeek);
        if (startTime) updateData.startTime = startTime;
        if (endTime) updateData.endTime = endTime;

        const updatedAvailability = await prisma.mentorAvailability.update({
            where: { id: Number(id) },
            data: updateData
        });

        res.json(updatedAvailability);
    } catch (error) {
        console.error('Error updating availability slot:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Availability slot not found' });
        }

        if (error.code === 'P2002') {
            return res.status(409).json({ 
                error: 'Conflicting availability slot already exists for this mentor on this day/time' 
            });
        }

        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete an availability slot
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.mentorAvailability.delete({
            where: { id: Number(id) }
        });
        res.status(204).end();
    } catch (error) {
        console.error('Error deleting availability slot:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Availability slot not found' });
        }

        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get availability for multiple days (useful for weekly view)
router.get('/mentor/:mentorId/week', async (req, res) => {
    const { mentorId } = req.params;

    try {
        const availability = await prisma.mentorAvailability.findMany({
            where: { mentorId: Number(mentorId) },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });

        const weeklySchedule = {};
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        for (let i = 0; i <= 6; i++) {
            weeklySchedule[i] = {
                dayName: dayNames[i],
                slots: []
            };
        }

        availability.forEach(slot => {
            weeklySchedule[slot.dayOfWeek].slots.push({
                id: slot.id,
                startTime: slot.startTime,
                endTime: slot.endTime,
                createdAt: slot.createdAt,
                updatedAt: slot.updatedAt
            });
        });

        res.json(weeklySchedule);
    } catch (error) {
        console.error('Error fetching weekly availability:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
