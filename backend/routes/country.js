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

// Get all cities
router.get('/', async (req, res) => {
    try {
        const cities = await prisma.country.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(cities);
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Search for a country by name and country
router.get('/search', async (req, res) => {
    const { name, country } = req.query;

    if (!name || !country) {
        return res.status(400).json({ error: 'Name and country are required' });
    }

    try {
        const country = await prisma.country.findFirst({
            where: {
                name: { equals: name, mode: 'insensitive' },
                country: { equals: country, mode: 'insensitive' }
            }
        });

        if (!country) {
            return res.status(404).json({ error: 'country not found' });
        }

        res.json(country);
    } catch (error) {
        console.error('Error searching for country:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get a country by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const country = await prisma.country.findUnique({
            where: { id: Number(id) }
        });

        if (!country) {
            return res.status(404).json({ error: 'country not found' });
        }

        res.json(country);
    } catch (error) {
        console.error('Error fetching country:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get all a country's cities by Id
router.get('/:id/cities', async (req, res) => {
    const { id } = req.params;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const country = await prisma.country.findUnique({
            where: { id: Number(id) },
            select: { cities: true }
        });

        if (!country) {
            return res.status(404).json({ error: 'Country not found' });
        }

        res.json(country.cities);
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create a new country
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const { name, code } = req.body;

    if (!name || !code) {
        return res.status(400).json({ error: 'Name and code are required' });
    }

    try {
        const newcountry = await prisma.country.create({
            data: {
                name,
                code
            }
        });
        res.status(201).json(newcountry);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'country already exists' });
        }
        console.error('Error creating country:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update a country by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, code } = req.body;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const updatedcountry = await prisma.country.update({
            where: { id: Number(id) },
            data: {
                ...(name && { name }),
                ...(code && { code }),
            }
        });
        res.json(updatedcountry);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'country not found' });
        }
        console.error('Error updating country:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a country by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        await prisma.country.delete({
            where: { id: Number(id) }
        });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'country not found' });
        }
        console.error('Error deleting country:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;