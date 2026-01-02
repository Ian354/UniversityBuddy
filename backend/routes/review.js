const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient.js');

// Get all reviews for a specific university
router.get('/university/:universityId', async (req, res) => {
    const { universityId } = req.params;

    const parsedUniversityId = parseInt(universityId, 10);
    if (isNaN(parsedUniversityId)) {
        return res.status(400).json({ error: "Invalid university ID" });
    }

    try {
        const reviews = await prisma.review.findMany({
            where: {
                universityId: parsedUniversityId
            }
        });

        if (reviews.length === 0) {
            return res.status(404).json({ error: "No reviews found for the specified university" });
        }

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: "Internal server Error" });
    }
});

// Get all reviews by a specific user
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
        const reviews = await prisma.review.findMany({
            where: {
                userId: parsedUserId
            }
        });

        if (reviews.length === 0) {
            return res.status(404).json({ error: "No reviews found for the specified user" });
        }

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: "Internal server Error" });
    }
});

// Get the averages of ratings for a specific university
router.get('/university/:universityId/averages', async (req, res) => {
    const { universityId } = req.params;

    try {
        const averages = await prisma.ratingAggregate.findUnique({
            where: {
                universityId: parseInt(universityId, 10)
            }
        });
        if (!averages) {
            return res.json([]);
        }
        res.json(averages);
    } catch (error) {

        res.status(500).json({ error: "Internal server Error" });
    }
});

// Create a new review
router.post('/', async (req, res) => {
    const { userId, universityId, rating, comment, overall, installations, uniLife, accommodation, academicLevel, activities } = req.body;

    if (!userId || !universityId || !rating || !overall || !installations || !uniLife || !accommodation || !academicLevel || !activities) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const newReview = await prisma.review.create({
            data: {
                userId: userId,
                universityId: universityId,
                rating: rating,
                overall: overall,
                installations: installations,
                uniLife: uniLife,
                accommodation: accommodation,
                academicLevel: academicLevel,
                activities: activities,
                comment: comment
            }
        });

        const ratingAggregate = await prisma.ratingAggregate.findUnique({
            where: {
                universityId: universityId
            }
        });

        if (ratingAggregate && ratingAggregate.reviewsCount > 0) {
            const updatedReviewsCount = ratingAggregate.reviewsCount + 1;

            await prisma.ratingAggregate.update({
                where: {
                    universityId: universityId
                },
                data: {
                    reviewsCount: updatedReviewsCount,
                    overallAvg: (ratingAggregate.overallAvg * ratingAggregate.reviewsCount + overall) / updatedReviewsCount,
                    installationsAvg: (ratingAggregate.installationsAvg * ratingAggregate.reviewsCount + installations) / updatedReviewsCount,
                    uniLifeAvg: (ratingAggregate.uniLifeAvg * ratingAggregate.reviewsCount + uniLife) / updatedReviewsCount,
                    accommodationAvg: (ratingAggregate.accommodationAvg * ratingAggregate.reviewsCount + accommodation) / updatedReviewsCount,
                    academicLevelAvg: (ratingAggregate.academicLevelAvg * ratingAggregate.reviewsCount + academicLevel) / updatedReviewsCount,
                    activitiesAvg: (ratingAggregate.activitiesAvg * ratingAggregate.reviewsCount + activities) / updatedReviewsCount
                }
            });
        } else {
            await prisma.ratingAggregate.create({
                data: {
                    universityId: universityId,
                    reviewsCount: 1,
                    overallAvg: overall,
                    installationsAvg: installations,
                    uniLifeAvg: uniLife,
                    accommodationAvg: accommodation,
                    academicLevelAvg: academicLevel,
                    activitiesAvg: activities
                }
            });
        }

        res.status(201).json(newReview);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: "User has already reviewed this university" });
        }
        res.status(500).json({ error: "Internal server Error" });
    }
});

// Delete a review by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
        return res.status(400).json({ error: "Invalid ID" });
    }

    try {
        const review = await prisma.review.delete({
            where: {
                id: parsedId
            }
        });

        const ratingAggregate = await prisma.ratingAggregate.findUnique({
            where: {
                universityId: review.universityId
            }
        });

        if (ratingAggregate && ratingAggregate.reviewsCount > 1) {
            const updatedReviewsCount = ratingAggregate.reviewsCount - 1;

            await prisma.ratingAggregate.update({
                where: {
                    universityId: review.universityId
                },
                data: {
                    reviewsCount: updatedReviewsCount,
                    overallAvg: (ratingAggregate.overallAvg * ratingAggregate.reviewsCount - review.overall) / updatedReviewsCount,
                    installationsAvg: (ratingAggregate.installationsAvg * ratingAggregate.reviewsCount - review.installations) / updatedReviewsCount,
                    uniLifeAvg: (ratingAggregate.uniLifeAvg * ratingAggregate.reviewsCount - review.uniLife) / updatedReviewsCount,
                    accommodationAvg: (ratingAggregate.accommodationAvg * ratingAggregate.reviewsCount - review.accommodation) / updatedReviewsCount,
                    academicLevelAvg: (ratingAggregate.academicLevelAvg * ratingAggregate.reviewsCount - review.academicLevel) / updatedReviewsCount,
                    activitiesAvg: (ratingAggregate.activitiesAvg * ratingAggregate.reviewsCount - review.activities) / updatedReviewsCount
                }
            });
        } else if (ratingAggregate) {
            await prisma.ratingAggregate.delete({
                where: {
                    universityId: review.universityId
                }
            });
        }

        res.json(review);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "Review not found" });
        }
        res.status(500).json({ error: "Internal server Error" });
    }
});

module.exports = router;
