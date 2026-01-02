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

// Get all universities
router.get('/', async (req, res) => {
    try {
        const universities = await prisma.university.findMany();
        res.json(universities);
    } catch (error) {
        res.status(500).json({ error: 'Internal server Error' });
    }
});

// Search for universities by name, country, or city, and rating filters
router.get('/search', async (req, res) => {
    const { name, 
        countryId, 
        cityId, 
        minOverall, 
        maxOverall,
        minInstallations,
        maxInstallations,
        minUniLife,
        maxUniLife,
        minAccommodation,
        maxAccommodation,
        minAcademicLevel,
        maxAcademicLevel,
        minActivities,
        maxActivities } = req.query;

    try {
// Build rating filters
        const ratingFilters = [];

        if (minOverall || maxOverall) {
            const filter = {};
            if (minOverall) filter.gte = parseFloat(minOverall);
            if (maxOverall) filter.lte = parseFloat(maxOverall);
            ratingFilters.push({ overallAvg: filter });
        }

        if (minInstallations || maxInstallations) {
            const filter = {};
            if (minInstallations) filter.gte = parseFloat(minInstallations);
            if (maxInstallations) filter.lte = parseFloat(maxInstallations);
            ratingFilters.push({ installationsAvg: filter });
        }

        if (minUniLife || maxUniLife) {
            const filter = {};
            if (minUniLife) filter.gte = parseFloat(minUniLife);
            if (maxUniLife) filter.lte = parseFloat(maxUniLife);
            ratingFilters.push({ uniLifeAvg: filter });
        }

        if (minAccommodation || maxAccommodation) {
            const filter = {};
            if (minAccommodation) filter.gte = parseFloat(minAccommodation);
            if (maxAccommodation) filter.lte = parseFloat(maxAccommodation);
            ratingFilters.push({ accommodationAvg: filter });
        }

        if (minAcademicLevel || maxAcademicLevel) {
            const filter = {};
            if (minAcademicLevel) filter.gte = parseFloat(minAcademicLevel);
            if (maxAcademicLevel) filter.lte = parseFloat(maxAcademicLevel);
            ratingFilters.push({ academicLevelAvg: filter });
        }

        if (minActivities || maxActivities) {
            const filter = {};
            if (minActivities) filter.gte = parseFloat(minActivities);
            if (maxActivities) filter.lte = parseFloat(maxActivities);
            ratingFilters.push({ activitiesAvg: filter });
        }

        const universities = await prisma.university.findMany({
            where: {
            AND: [
                name ? { name: { contains: name, mode: 'insensitive' } } : {},
                countryId ? { countryId: Number(countryId) } : {},
                cityId ? { cityId: Number(cityId) } : {},
                // Add rating filters if any exist
                ratingFilters.length > 0 ? {
                ratings: {
                    some: {
                    AND: ratingFilters
                    }
                }
                } : {}
            ],
            },
        });
        res.json(universities);
    } catch (error) {
        res.status(500).json({ error: 'Internal server Error' });
    }
});

// Create a new university
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const { name, countryId, cityId, isPublic } = req.body;

    // Validate required fields
    if (!name || !countryId || !cityId || isPublic === undefined) {
        return res.status(400).json({ error: 'Name, countryId, cityId, and isPublic are required.' });
    }

    try {
        const newUniversity = await prisma.university.create({
            data: { name, countryId, cityId, isPublic },
        });
        res.status(201).json(newUniversity);
    } catch (error) {
        if (error.code === 'P2002') { // Prisma unique constraint error code
            return res.status(409).json({ error: 'University already exists.' });
        }
        res.status(500).json({ error: 'Internal server Error' });
    }
});

// Get a university by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const university = await prisma.university.findUnique({
            where: { id: Number(id) },
        });
        if (!university) {
            return res.status(404).json({ error: 'University not found' });
        }
        res.json(university);
    } catch (error) {
        res.status(500).json({ error: 'Internal server Error' });
    }
});

// Update a university by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, countryId, cityId, isPublic } = req.body;

    // Validate ID is a number
    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const updatedUniversity = await prisma.university.update({
            where: { id: Number(id) },
            data: { name, countryId, cityId, isPublic },
        });
        res.json(updatedUniversity);
    } catch (error) {
        if (error.code === 'P2025') { // Prisma record not found error code
            return res.status(404).json({ error: 'University not found' });
        }
        res.status(500).json({ error: 'Internal server Error' });
    }
});

// Delete a university by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        await prisma.university.delete({
            where: { id: Number(id) },
        });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') { // Prisma record not found error code
            return res.status(404).json({ error: 'University not found' });
        }
        res.status(500).json({ error: 'Internal server Error' });
    }
});

module.exports = router;
