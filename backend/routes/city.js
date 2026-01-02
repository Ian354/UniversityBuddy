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
        const cities = await prisma.city.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(cities);
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Search for a city by name and country
router.get('/search', async (req, res) => {
    const { name, countryId } = req.query;

    if (!name || !countryId) {
        return res.status(400).json({ error: 'Name and country are required' });
    }

    try {
        const city = await prisma.city.findFirst({
            where: {
                name: { equals: name, mode: 'insensitive' },
                countryId: { equals: Number(countryId) }
            }
        });

        if (!city) {
            return res.status(404).json({ error: 'City not found' });
        }

        res.json(city);
    } catch (error) {
        console.error('Error searching for city:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get a city by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const city = await prisma.city.findUnique({
            where: { id: Number(id) }
        });

        if (!city) {
            return res.status(404).json({ error: 'City not found' });
        }

        res.json(city);
    } catch (error) {
        console.error('Error fetching city:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get a city's universities by city ID
router.get('/:id/universities', async (req, res) => {
    const { id } = req.params;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const universities = await prisma.university.findMany({
            where: { cityId: Number(id) },
            orderBy: { name: 'asc' }
        });
        res.json(universities);
    } catch (error) {
        console.error('Error fetching universities:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create a new city
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const { name, countryId, latitude, longitude, northSouth, eastWest } = req.body;

    if (!name || !countryId) {
        return res.status(400).json({ error: 'Name and country are required' });
    }

    const country = await prisma.country.findUnique({
        where: { id: Number(countryId) }
    });

    if (!country) {
        return res.status(404).json({ error: 'Country not found' });
    }

    try {
        const newCity = await prisma.city.create({
            data: {
                name,
                countryId: Number(countryId),
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                northSouth: northSouth || null,
                eastWest: eastWest || null
            }
        });
        res.status(201).json(newCity);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'City already exists' });
        }
        console.error('Error creating city:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update a city by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, countryId, latitude, longitude, northSouth, eastWest } = req.body;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const updatedCity = await prisma.city.update({
            where: { id: Number(id) },
            data: {
                ...(name && { name }),
                ...(countryId && { countryId: Number(countryId) }),
                ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
                ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
                ...(northSouth !== undefined && { northSouth }),
                ...(eastWest !== undefined && { eastWest })
            }
        });
        res.json(updatedCity);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'City not found' });
        }
        console.error('Error updating city:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a city by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        await prisma.city.delete({
            where: { id: Number(id) }
        });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'City not found' });
        }
        console.error('Error deleting city:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;