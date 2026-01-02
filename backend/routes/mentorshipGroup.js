const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient.js');
const { authenticateToken } = require('../middleware/auth.js');

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Get all mentorship groups for a university (admin's university)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get the admin's university
        const admin = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { universityId: true }
        });

        if (!admin || !admin.universityId) {
            return res.status(400).json({ error: 'Admin must be associated with a university' });
        }

        const groups = await prisma.mentorshipGroup.findMany({
            where: { universityId: admin.universityId },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, role: true }
                        }
                    }
                },
                mentor: {
                    select: { id: true, name: true, email: true }
                },
                _count: {
                    select: { members: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(groups);
    } catch (error) {
        console.error('Error fetching mentorship groups:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a specific mentorship group by ID
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid group ID format' });
    }

    try {
        const admin = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { universityId: true }
        });

        if (!admin || !admin.universityId) {
            return res.status(400).json({ error: 'Admin must be associated with a university' });
        }

        const group = await prisma.mentorshipGroup.findUnique({
            where: { id: Number(id) },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, role: true }
                        }
                    }
                },
                mentor: {
                    select: { id: true, name: true, email: true }
                },
                university: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!group) {
            return res.status(404).json({ error: 'Mentorship group not found' });
        }

        // Verify the group belongs to admin's university
        if (group.universityId !== admin.universityId) {
            return res.status(403).json({ error: 'Access denied: Group belongs to another university' });
        }

        res.json(group);
    } catch (error) {
        console.error('Error fetching mentorship group:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new mentorship group
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const { name, description, mentorId } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Group name is required' });
    }

    if (!mentorId || !Number.isInteger(Number(mentorId)) || Number(mentorId) <= 0) {
        return res.status(400).json({ error: 'A valid mentor ID is required' });
    }

    try {
        // Get the admin's university
        const admin = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { universityId: true }
        });

        if (!admin || !admin.universityId) {
            return res.status(400).json({ error: 'Admin must be associated with a university' });
        }

        // Verify the mentor exists, has MENTOR role, and belongs to the same university
        const mentor = await prisma.user.findUnique({
            where: { id: Number(mentorId) },
            select: { id: true, role: true, universityId: true }
        });

        if (!mentor) {
            return res.status(404).json({ error: 'Mentor not found' });
        }

        if (mentor.role !== 'MENTOR') {
            return res.status(400).json({ error: 'Selected user is not a mentor' });
        }

        if (mentor.universityId !== admin.universityId) {
            return res.status(400).json({ error: 'Mentor does not belong to your university' });
        }

        const group = await prisma.mentorshipGroup.create({
            data: {
                name: name.trim(),
                description: description ? description.trim() : null,
                universityId: admin.universityId,
                mentorId: Number(mentorId)
            },
            include: {
                university: {
                    select: { id: true, name: true }
                },
                mentor: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.status(201).json(group);
    } catch (error) {
        console.error('Error creating mentorship group:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a mentorship group
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid group ID format' });
    }

    try {
        const admin = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { universityId: true }
        });

        if (!admin || !admin.universityId) {
            return res.status(400).json({ error: 'Admin must be associated with a university' });
        }

        // Check if group exists and belongs to admin's university
        const existingGroup = await prisma.mentorshipGroup.findUnique({
            where: { id: Number(id) }
        });

        if (!existingGroup) {
            return res.status(404).json({ error: 'Mentorship group not found' });
        }

        if (existingGroup.universityId !== admin.universityId) {
            return res.status(403).json({ error: 'Access denied: Group belongs to another university' });
        }

        const updateData = {};
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length === 0) {
                return res.status(400).json({ error: 'Group name cannot be empty' });
            }
            updateData.name = name.trim();
        }
        if (description !== undefined) {
            updateData.description = description ? description.trim() : null;
        }

        const group = await prisma.mentorshipGroup.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, role: true }
                        }
                    }
                }
            }
        });

        res.json(group);
    } catch (error) {
        console.error('Error updating mentorship group:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a mentorship group
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid group ID format' });
    }

    try {
        const admin = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { universityId: true }
        });

        if (!admin || !admin.universityId) {
            return res.status(400).json({ error: 'Admin must be associated with a university' });
        }

        // Check if group exists and belongs to admin's university
        const existingGroup = await prisma.mentorshipGroup.findUnique({
            where: { id: Number(id) }
        });

        if (!existingGroup) {
            return res.status(404).json({ error: 'Mentorship group not found' });
        }

        if (existingGroup.universityId !== admin.universityId) {
            return res.status(403).json({ error: 'Access denied: Group belongs to another university' });
        }

        await prisma.mentorshipGroup.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Mentorship group deleted successfully' });
    } catch (error) {
        console.error('Error deleting mentorship group:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a member to a mentorship group
router.post('/:id/members', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid group ID format' });
    }

    if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ error: 'Valid user ID is required' });
    }

    try {
        const admin = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { universityId: true }
        });

        if (!admin || !admin.universityId) {
            return res.status(400).json({ error: 'Admin must be associated with a university' });
        }

        // Check if group exists and belongs to admin's university
        const group = await prisma.mentorshipGroup.findUnique({
            where: { id: Number(id) }
        });

        if (!group) {
            return res.status(404).json({ error: 'Mentorship group not found' });
        }

        if (group.universityId !== admin.universityId) {
            return res.status(403).json({ error: 'Access denied: Group belongs to another university' });
        }

        // Check if user exists and belongs to the same university
        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            select: { id: true, universityId: true, name: true, email: true, role: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.universityId !== admin.universityId) {
            return res.status(400).json({ error: 'User does not belong to your university' });
        }

        // Add member to group
        const member = await prisma.mentorshipGroupMember.create({
            data: {
                groupId: Number(id),
                userId: Number(userId)
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true }
                }
            }
        });

        res.status(201).json(member);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'User is already a member of this group' });
        }
        console.error('Error adding member to group:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove a member from a mentorship group
router.delete('/:id/members/:userId', authenticateToken, requireAdmin, async (req, res) => {
    const { id, userId } = req.params;

    if (isNaN(Number(id)) || isNaN(Number(userId))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const admin = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { universityId: true }
        });

        if (!admin || !admin.universityId) {
            return res.status(400).json({ error: 'Admin must be associated with a university' });
        }

        // Check if group exists and belongs to admin's university
        const group = await prisma.mentorshipGroup.findUnique({
            where: { id: Number(id) }
        });

        if (!group) {
            return res.status(404).json({ error: 'Mentorship group not found' });
        }

        if (group.universityId !== admin.universityId) {
            return res.status(403).json({ error: 'Access denied: Group belongs to another university' });
        }

        // Find and delete the membership
        const membership = await prisma.mentorshipGroupMember.findFirst({
            where: {
                groupId: Number(id),
                userId: Number(userId)
            }
        });

        if (!membership) {
            return res.status(404).json({ error: 'User is not a member of this group' });
        }

        await prisma.mentorshipGroupMember.delete({
            where: { id: membership.id }
        });

        res.json({ message: 'Member removed from group successfully' });
    } catch (error) {
        console.error('Error removing member from group:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all students in admin's university (for assigning to groups)
router.get('/university/students', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const admin = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { universityId: true }
        });

        if (!admin || !admin.universityId) {
            return res.status(400).json({ error: 'Admin must be associated with a university' });
        }

        const students = await prisma.user.findMany({
            where: {
                universityId: admin.universityId,
                role: {
                    in: ['STUDENT', 'FUTURE_STUDENT', 'FORMER_STUDENT', 'MENTOR']
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                degree: true,
                mentorshipGroupMemberships: {
                    select: {
                        groupId: true,
                        group: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json(students);
    } catch (error) {
        console.error('Error fetching university students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get admin dashboard stats
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const admin = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { universityId: true }
        });

        if (!admin || !admin.universityId) {
            return res.status(400).json({ error: 'Admin must be associated with a university' });
        }

        const [totalStudents, totalGroups, studentsInGroups, university] = await Promise.all([
            prisma.user.count({
                where: {
                    universityId: admin.universityId,
                    role: { in: ['STUDENT', 'FUTURE_STUDENT', 'FORMER_STUDENT', 'MENTOR'] }
                }
            }),
            prisma.mentorshipGroup.count({
                where: { universityId: admin.universityId }
            }),
            prisma.mentorshipGroupMember.count({
                where: {
                    group: { universityId: admin.universityId }
                }
            }),
            prisma.university.findUnique({
                where: { id: admin.universityId },
                select: { id: true, name: true }
            })
        ]);

        res.json({
            university,
            totalStudents,
            totalGroups,
            studentsInGroups,
            studentsNotInGroups: totalStudents - studentsInGroups
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all mentors in admin's university (for assigning to groups)
router.get('/university/mentors', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const admin = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { universityId: true }
        });

        if (!admin || !admin.universityId) {
            return res.status(400).json({ error: 'Admin must be associated with a university' });
        }

        const mentors = await prisma.user.findMany({
            where: {
                universityId: admin.universityId,
                role: 'MENTOR'
            },
            select: {
                id: true,
                name: true,
                email: true,
                mentoringGroups: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json(mentors);
    } catch (error) {
        console.error('Error fetching university mentors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;