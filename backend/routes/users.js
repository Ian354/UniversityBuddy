const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient.js');

// Get all users
router.get('/', async (req, res) => {
    try {   
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create a new user
router.post('/', async (req, res) => {
    const { email, name, password, role, universityId, erasmusUniversityId, erasmusYear, degree, openToContact } = req.body;

    if (!email || !name || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields: email, name, password, and role are mandatory' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!isValidPassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    if (!isValidRole(role)) {
        return res.status(400).json({ error: 'Invalid role. Valid roles are: student, mentor, admin' });
    }

    try {

        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password,
                role,
                universityId,
                erasmusUniversityId,
                erasmusYear,
                degree,
                openToContact
            }
        });

        // If erasmusUniversityId and erasmusYear are provided, create the erasmus record
        try {
            if (erasmusUniversityId && erasmusYear) {
            await prisma.erasmus.create({
                data: {
                userId: newUser.id,
                universityId: erasmusUniversityId,
                year: erasmusYear,
                status: 'ACTIVE'
                }
            });
            }
        } catch (error) {
            if (error.code === 'P2003' && error.meta && error.meta.target.includes('universityId')) {
                await prisma.user.delete({ where: { id: newUser.id } });
                return res.status(404).json({ error: 'Invalid erasmusUniversityId: referenced university does not exist' });
            }
            console.error('Error creating erasmus record:', error);
            await prisma.user.delete({ where: { id: newUser.id } });
            return res.status(500).json({ error: 'Failed to create erasmus record' });
        }

        res.status(201).json(newUser);
    } catch (error) {
        if (error.code === 'P2002' && error.meta && error.meta.target.includes('email')) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Get a user by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Get all users by university ID and role as query params (optional)
router.get('/university/:universityId', async (req, res) => {
    const { universityId } = req.params;
    const { role } = req.query;
    const parsedUniversityId = parseInt(universityId);

    if (isNaN(parsedUniversityId)) {
        return res.status(400).json({ error: 'Invalid university ID' });
    }

    try {
        const users = await prisma.user.findMany({
            where: { universityId: parsedUniversityId, role }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Update a user by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { email, password, role, universityId, erasmus, year, degree, openToContact } = req.body;
    const userId = parseInt(id);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                email,
                password,
                role,
                universityId,
                erasmus,
                year,
                degree,
                openToContact
            }
        });
        res.json(updatedUser);
    } catch (error) {
        if (error.code === 'P2002' && error.meta && error.meta.target.includes('email')) {
            return res.status(409).json({ error: 'Email already in use' });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete a user by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        await prisma.user.delete({
            where: { id: userId }
        });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Helper functions for validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    return typeof password === 'string' && password.length >= 6;
}

function isValidRole(role) {
    const validRoles = ['STUDENT', 'MENTOR', 'FUTURE_STUDENT', 'FORMER_STUDENT', 'ADMIN'];
    return validRoles.includes(role);
}

module.exports = router;
