const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient.js');

// Get erasmus assignment by user ID
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    if (isNaN(Number(userId))) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const erasmusAssignments = await prisma.erasmus.findMany({
            where: { userId: Number(userId) }
        });
        res.json(erasmusAssignments);
    } catch (error) {
        console.error('Error fetching erasmus assignments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get erasmus assignment by university ID
router.get('/university/:universityId', async (req, res) => {
    const { universityId } = req.params;

    if (isNaN(Number(universityId))) {
        return res.status(400).json({ error: 'Invalid university ID' });
    }

    try {
        const erasmusAssignments = await prisma.erasmus.findMany({
            where: { universityId: Number(universityId) }
        });
        res.json(erasmusAssignments);
    } catch (error) {
        console.error('Error fetching erasmus assignments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create erasmus assignment
router.post('/', async (req, res) => {
    const { userId, universityId, status, year, academicYear, duration, shareInfo } = req.body;

    if (!userId || !universityId || !status || !year) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newErasmus = await prisma.erasmus.create({
            data: {
                userId,
                universityId,
                status,
                year,
                academicYear,
                duration,
                shareInfo: shareInfo !== undefined ? shareInfo : true
            }
        });
        res.status(201).json(newErasmus);
    } catch (error) {
        if (error.code === 'P2002') { // Unique constraint error
            res.status(409).json({ error: 'Unique constraint error' });
        } else {
            console.error('Error creating erasmus assignment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Update erasmus assignment
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { userId, universityId, status, year, academicYear, duration, shareInfo } = req.body;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        const updatedErasmus = await prisma.erasmus.update({
            where: { id: Number(id) },
            data: {
                userId,
                universityId,
                status,
                year,
                academicYear,
                duration,
                shareInfo
            }
        });
        res.json(updatedErasmus);
    } catch (error) {
        if (error.code === 'P2025') { // Record not found error
            res.status(404).json({ error: 'Erasmus assignment not found' });
        } else {
            console.error('Error updating erasmus assignment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Delete erasmus assignment
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        await prisma.erasmus.delete({
            where: { id: Number(id) }
        });
        res.status(204).end();
    } catch (error) {
        if (error.code === 'P2025') { // Record not found error
            res.status(404).json({ error: 'Erasmus assignment not found' });
        } else {
            console.error('Error deleting erasmus assignment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Get erasmus contacts by filters
// Query params: universityId (required), cityId (optional), countryId (optional)
router.get('/contacts', async (req, res) => {
    const { universityId, cityId, countryId } = req.query;

    if (!universityId || isNaN(Number(universityId))) {
        return res.status(400).json({ error: 'Valid university ID is required' });
    }

    try {
        // Build the where clause for filtering
        const whereClause = {
            universityId: Number(universityId),
            shareInfo: true,
            user: {
                openToContact: true
            }
        };

        // Add city filter if cityId is provided (filter by user's home university's city)
        if (cityId && !isNaN(Number(cityId))) {
            if (!whereClause.user.university) {
                whereClause.user.university = {};
            }
            whereClause.user.university.cityId = Number(cityId);
        }

        // Add country filter if countryId is provided (filter by user's home university's country)
        if (countryId && !isNaN(Number(countryId))) {
            if (!whereClause.user.university) {
                whereClause.user.university = {};
            }
            whereClause.user.university.countryId = Number(countryId);
        }

        // Find erasmus assignments for the specified university with user filters
        const erasmusAssignments = await prisma.erasmus.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        degree: true,
                        universityId: true,
                        university: {
                            select: {
                                id: true,
                                name: true,
                                cityId: true,
                                countryId: true,
                                city: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                },
                                country: {
                                    select: {
                                        id: true,
                                        name: true,
                                        code: true
                                    }
                                }
                            }
                        }
                    }
                },
                university: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Transform the response to match the expected frontend format
        const transformedAssignments = erasmusAssignments.map(assignment => ({
            ...assignment,
            user: {
                ...assignment.user,
                homeCityId: assignment.user.university?.cityId || null,
                homeCountryId: assignment.user.university?.countryId || null,
                homeCity: assignment.user.university?.city || null,
                homeCountry: assignment.user.university?.country || null
            }
        }));

        res.json(transformedAssignments);
    } catch (error) {
        console.error('Error fetching erasmus contacts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;