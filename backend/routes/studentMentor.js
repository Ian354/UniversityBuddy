const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient.js');

// Get all student-mentor relationships
router.get('/', async (req, res) => {
    const { studentId, mentorId } = req.query;

    try {
        const where = {};

        if (studentId) {
            if (isNaN(Number(studentId))) {
                return res.status(400).json({ error: 'Invalid studentId format' });
            }
            where.studentId = Number(studentId);
        }

        if (mentorId) {
            if (isNaN(Number(mentorId))) {
                return res.status(400).json({ error: 'Invalid mentorId format' });
            }
            where.mentorId = Number(mentorId);
        }

        const relationships = await prisma.studentMentor.findMany({
            where,
            include: {
                student: {
                    select: { id: true, name: true, email: true, role: true }
                },
                mentor: {
                    select: { id: true, name: true, email: true, role: true }
                }
            }
        });

        res.json(relationships);
    } catch (error) {
        console.error('Error fetching student-mentor relationships:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new student-mentor relationship
router.post('/', async (req, res) => {
    const { studentId, mentorId } = req.body;

    if (!studentId || !mentorId) {
        return res.status(400).json({ error: 'Missing required fields: studentId and mentorId' });
    }

    if (isNaN(Number(studentId)) || isNaN(Number(mentorId))) {
        return res.status(400).json({ error: 'Invalid studentId or mentorId format' });
    }

    try {
        // Verify student exists
        const student = await prisma.user.findUnique({
            where: { id: Number(studentId) }
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Verify mentor exists and has MENTOR role
        const mentor = await prisma.user.findUnique({
            where: { id: Number(mentorId) }
        });

        if (!mentor) {
            return res.status(404).json({ error: 'Mentor not found' });
        }

        if (mentor.role !== 'MENTOR') {
            return res.status(400).json({ error: 'User is not a mentor' });
        }

        // Create the relationship
        const relationship = await prisma.studentMentor.create({
            data: {
                studentId: Number(studentId),
                mentorId: Number(mentorId)
            },
            include: {
                student: {
                    select: { id: true, name: true, email: true }
                },
                mentor: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.status(201).json(relationship);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Relationship already exists' });
        }
        if (error.code === 'P2003') {
            return res.status(400).json({ error: 'Invalid student or mentor ID' });
        }
        console.error('Error creating student-mentor relationship:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a student-mentor relationship
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const relationship = await prisma.studentMentor.findUnique({
            where: { id: Number(id) }
        });

        if (!relationship) {
            return res.status(404).json({ error: 'Relationship not found' });
        }

        await prisma.studentMentor.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Relationship deleted successfully' });
    } catch (error) {
        console.error('Error deleting student-mentor relationship:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;