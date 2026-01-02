const request = require('supertest');
const express = require('express');
const universityRouter = require('./review');

// Mock the prisma client
jest.mock('../prismaClient.js', () => ({
    review: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn()
  },
  ratingAggregate: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn()
  },
    user: {
    create: jest.fn()
  },
    university: {
    create: jest.fn()
  }
}));

const prisma = require('../prismaClient.js');

// Create a test app
const app = express();
app.use(express.json());
app.use('/review', universityRouter);

describe('Review Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    });

    // Create samples to use in tests
    const mockUniversities = [
      { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true },
      { id: 2, name: 'University B', country: 'Country B', city: 'City B', isPublic: false }
    ];
    const mockUsers = [
      { id: 1, name: 'User A' },
      { id: 2, name: 'User B' }
    ];
    const mockReviews = [
      { id: 1, userId: 1, universityId: 1, rating: 5, overall: 4, installations: 4, uniLife: 5, accommodation: 3, academicLevel: 4, activities: 5, comment: 'Great university!' },
      { id: 2, userId: 2, universityId: 1, rating: 3, overall: 3, installations: 3, uniLife: 3, accommodation: 3, academicLevel: 3, activities: 3, comment: 'Not bad' }
    ];

    describe('GET /review/university/:universityId', () => {
      it('should fetch reviews for a specific university', async () => {
        prisma.review.findMany.mockResolvedValue(mockReviews);

        const response = await request(app).get('/review/university/1');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockReviews);
      });

      it('should return 404 if university not found', async () => {
        prisma.review.findMany.mockResolvedValue([]);

        const response = await request(app).get('/review/university/999');
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No reviews found for the specified university' });
      });

      it('should return 500 when a server error occurs', async () => {
        prisma.review.findMany.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get('/review/university/1');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server Error' });
      });
    });

    describe('GET /review/user/:userId', () => {
      it('should fetch reviews for a specific user', async () => {
        prisma.review.findMany.mockResolvedValue(mockReviews);

        const response = await request(app).get('/review/user/1');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockReviews);
      });

      it('should return 400 for invalid user ID', async () => {
        const response = await request(app).get('/review/user/abc');
        expect(response.status).toBe(400);
      });

      it('should return 404 if user not found', async () => {
        prisma.review.findMany.mockResolvedValue([]);

        const response = await request(app).get('/review/user/999');
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No reviews found for the specified user' });
      });

      it('should return 500 when a server error occurs', async () => {
        prisma.review.findMany.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get('/review/user/1');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server Error' });
      });
    });

    describe('GET /review/university/:universityId/averages', () => {
      it('should fetch rating averages for a specific university', async () => {
        prisma.ratingAggregate.findUnique.mockResolvedValue({
          id: 1,
          universityId: 1,
          overallAvg: 4,
          installationsAvg: 4,
          uniLifeAvg: 4,
          accommodationAvg: 4,
          academicLevelAvg: 4,
          activitiesAvg: 4
        });

        const response = await request(app).get('/review/university/1/averages');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            id: 1,
            universityId: 1,
            overallAvg: 4,
            installationsAvg: 4,
            uniLifeAvg: 4,
            accommodationAvg: 4,
            academicLevelAvg: 4,
            activitiesAvg: 4
        });
      });
      
      it('should return 500 when a server error occurs', async () => {
        prisma.ratingAggregate.findUnique.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get('/review/university/1/averages');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server Error' });
      });
    });

    describe('POST /review', () => {
      it('should create a new review', async () => {
      const newReview = {
        userId: 1,
        universityId: 1,
        rating: 4,
        overall: 4,
        installations: 4,
        uniLife: 4,
        accommodation: 4,
        academicLevel: 4,
        activities: 4,
        comment: 'Good university'
      };

      prisma.review.create.mockResolvedValue({ id: 1, ...newReview });

      const response = await request(app).post('/review').send(newReview);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: 1, ...newReview });
      });

      it('should return 400 for invalid input', async () => {
      const invalidReview = {
        userId: 1,
        universityId: 1,
        rating: 6, // Invalid rating (out of range)
        comment: 'Invalid rating!'
      };

      const response = await request(app).post('/review').send(invalidReview);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required fields' });
      });

      it('should return 409 for duplicate review by the same user for the same university', async () => {
      const newReview = {
        userId: 1,
        universityId: 1,
        rating: 4,
        overall: 4,
        installations: 4,
        uniLife: 4,
        accommodation: 4,
        academicLevel: 4,
        activities: 4,
        comment: 'Good university!'
      };

      prisma.review.create.mockRejectedValue({
        code: 'P2002',
        message: 'Unique constraint failed on the fields: (`userId`, `universityId`)'
      });

      const response = await request(app).post('/review').send(newReview);
      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'User has already reviewed this university' });
      });

      it('should return 500 when a server error occurs', async () => {
      const newReview = {
        userId: 1,
        universityId: 1,
        rating: 4,
        overall: 4,
        installations: 4,
        uniLife: 4,
        accommodation: 4,
        academicLevel: 4,
        activities: 4,
        comment: 'Good university!'
      };

      prisma.review.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/review').send(newReview);
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server Error' });
      });
    });

      it('should return 400 for invalid input', async () => {
        const invalidReview = {
          userId: 1,
          universityId: 1,
          rating: 6, // Invalid rating (out of range)
          comment: 'Invalid rating!'
        };

        const response = await request(app).post('/review').send(invalidReview);
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Missing required fields' });
      });

      it('should return 409 for duplicate review by the same user for the same university', async () => {
        const newReview = {
          userId: 1,
          universityId: 1,
          rating: 4,
          overall: 4,
          installations: 4,
          uniLife: 4,
          accommodation: 4,
          academicLevel: 4,
          activities: 4,
          comment: 'Good university!'
        };

        prisma.review.create.mockRejectedValue({
          code: 'P2002',
          message: 'Unique constraint failed on the fields: (`userId`, `universityId`)'
        });

        const response = await request(app).post('/review').send(newReview);
        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: 'User has already reviewed this university' });
      });

      it('should return 500 when a server error occurs', async () => {
        const newReview = {
          userId: 1,
          universityId: 1,
          rating: 4,
          overall: 4,
          installations: 4,
          uniLife: 4,
          accommodation: 4,
          academicLevel: 4,
          activities: 4,
          comment: 'Good university!'
        };

        prisma.review.create.mockRejectedValue(new Error('Database error'));

        const response = await request(app).post('/review').send(newReview);
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server Error' });
  });
});