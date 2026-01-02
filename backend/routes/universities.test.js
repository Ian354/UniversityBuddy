const request = require('supertest');
const express = require('express');
const universityRouter = require('./universities');

// Mock the prisma client
jest.mock('../prismaClient.js', () => ({
    university: {
    findMany: jest.fn(),
    findFiltered: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

const prisma = require('../prismaClient.js');

// Create a test app
const app = express();
app.use(express.json());
app.use('/universities', universityRouter);

describe('University Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    });

  describe('GET /universities', () => {
    it('should fetch all universities', async () => {
      const mockUniversities = [
        { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true },
        { id: 2, name: 'University B', country: 'Country B', city: 'City B', isPublic: false }
      ];

      prisma.university.findMany.mockResolvedValue(mockUniversities);

      const response = await request(app).get('/universities');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUniversities);
    });

    it('should return 500 when a server error occurs', async () => {
      prisma.university.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/universities');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server Error' });
    });
  });

  describe('GET /university/search', () => {
    it('should search universities by name', async () => {
      const mockUniversities = [
        { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true }
      ];
      prisma.university.findMany.mockResolvedValue(mockUniversities);

      const response = await request(app).get('/universities/search?name=University A');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUniversities);
    });

    it('should search universities by country', async () => {
      const mockUniversities = [
        { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true }
      ];
      prisma.university.findMany.mockResolvedValue(mockUniversities);

      const response = await request(app).get('/universities/search?country=Country A');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUniversities);
    });

    it('should search universities by city', async () => {
      const mockUniversities = [
        { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true }
      ];
      prisma.university.findMany.mockResolvedValue(mockUniversities);

      const response = await request(app).get('/universities/search?city=City A');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUniversities);
    });

     it('should search universities by minimum overall rating', async () => {
      const mockUniversities = [
        { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true }
      ];
      prisma.university.findMany.mockResolvedValue(mockUniversities);

      const response = await request(app).get('/universities/search?minOverall=4.0');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUniversities);
    });

    it('should search universities by maximum overall rating', async () => {
      const mockUniversities = [
        { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true }
      ];
      prisma.university.findMany.mockResolvedValue(mockUniversities);

      const response = await request(app).get('/universities/search?maxOverall=5.0');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUniversities);
    });

    it('should search universities by overall rating range', async () => {
      const mockUniversities = [
        { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true }
      ];
      prisma.university.findMany.mockResolvedValue(mockUniversities);

      const response = await request(app).get('/universities/search?minOverall=3.0&maxOverall=5.0');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUniversities);
    });

    it('should search universities by minimum installations rating', async () => {
      const mockUniversities = [
        { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true }
      ];
      prisma.university.findMany.mockResolvedValue(mockUniversities);

      const response = await request(app).get('/universities/search?minInstallations=4.0');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUniversities);
    });

    it('should search universities by university life rating range', async () => {
      const mockUniversities = [
        { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true }
      ];
      prisma.university.findMany.mockResolvedValue(mockUniversities);

      const response = await request(app).get('/universities/search?minUniLife=3.5&maxUniLife=5.0');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUniversities);
    });

    it('should search universities by accommodation rating', async () => {
      const mockUniversities = [
        { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true }
      ];
      prisma.university.findMany.mockResolvedValue(mockUniversities);

      const response = await request(app).get('/universities/search?minAccommodation=3.0');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUniversities);
    });

    it('should search universities by academic level rating', async () => {
      const mockUniversities = [
        { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true }
      ];
      prisma.university.findMany.mockResolvedValue(mockUniversities);

      const response = await request(app).get('/universities/search?minAcademicLevel=4.0&maxAcademicLevel=5.0');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUniversities);
    });

    it('should search universities by activities rating', async () => {
      const mockUniversities = [
        { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true }
      ];
      prisma.university.findMany.mockResolvedValue(mockUniversities);

      const response = await request(app).get('/universities/search?minActivities=3.5');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUniversities);
    });

    it('should search universities by multiple criteria including ratings', async () => {
      const mockUniversities = [
        { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true }
      ];
      prisma.university.findMany.mockResolvedValue(mockUniversities);

      const response = await request(app).get('/universities/search?name=University&minOverall=4.0&maxActivities=5.0');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUniversities);
    });

    it('should return 500 when a server error occurs', async () => {
      prisma.university.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/universities/search?city=City A');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server Error' });
    });
  });

  describe('POST /ununiversity', () => {
    it('should create a new university', async () => {
      const newUniversity = { name: 'University C', country: 'Country C', city: 'City C', isPublic: true };
      const createdUniversity = { id: 3, ...newUniversity };
      prisma.university.create.mockResolvedValue(createdUniversity);

      const response = await request(app).post('/universities').send(newUniversity);
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdUniversity);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app).post('/universities').send({ name: 'University D' });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Name, country, city, and isPublic are required.' });
    });

    it('should return 500 when a server error occurs', async () => {
      prisma.university.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/universities').send({ name: 'University D', country: 'Country D', city: 'City D', isPublic: true });
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server Error' });
    });

    it('should return 409 when trying to create a duplicate university', async () => {
      prisma.university.create.mockRejectedValue({ code: 'P2002' });

      const response = await request(app).post('/universities').send({ name: 'University D', country: 'Country D', city: 'City D', isPublic: true });
      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'University already exists.' });
    });
  });

    describe('GET /university/:id', () => {
        it('should return a university by ID', async () => {
        const mockUniversity = { id: 1, name: 'University A', country: 'Country A', city: 'City A', isPublic: true };
        prisma.university.findUnique.mockResolvedValue(mockUniversity);

        const response = await request(app).get('/universities/1');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUniversity);
        });

        it('should return 404 if university not found', async () => {
        prisma.university.findUnique.mockResolvedValue(null);

        const response = await request(app).get('/universities/999');
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'University not found' });
        });

        it('should return 400 for invalid ID format', async () => {
        const response = await request(app).get('/universities/invalid-id');
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid ID format' });
        });

        it('should return 500 when a server error occurs', async () => {
        prisma.university.findUnique.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get('/universities/1');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server Error' });
        });
    });
    
    describe('PUT /university/:id', () => {
        it('should update a university by ID', async () => {
        const updatedUniversity = { id: 1, name: 'Updated University', country: 'Updated Country', city: 'Updated City', isPublic: false };
        prisma.university.update.mockResolvedValue(updatedUniversity);

        const response = await request(app).put('/universities/1').send({ name: 'Updated University', country: 'Updated Country', city: 'Updated City', isPublic: false }); 

        expect(response.status).toBe(200);
        expect(response.body).toEqual(updatedUniversity);
        });

        it('should return 400 for invalid ID format', async () => {
        const response = await request(app).put('/universities/invalid-id').send({ name: 'Updated University', country: 'Updated Country', city: 'Updated City', isPublic: false });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid ID format' });
        });

        it('should return 500 when a server error occurs', async () => {
        prisma.university.update.mockRejectedValue(new Error('Database error'));    

        const response = await request(app).put('/universities/1').send({ name: 'Updated University', country: 'Updated Country', city: 'Updated City', isPublic: false });
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server Error' });
        });

        it('should return 404 if university to update is not found', async () => {
        prisma.university.update.mockRejectedValue({ code: 'P2025' });
        const response = await request(app).put('/universities/1').send({ name: 'Updated University', country: 'Updated Country', city: 'Updated City', isPublic: false });
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'University not found' });
        });
    });
    
    describe('DELETE /university/:id', () => {
        it('should delete a university by ID', async () => {
        prisma.university.delete.mockResolvedValue({});
        const response = await request(app).delete('/universities/1');
        expect(response.status).toBe(204);
        });

        it('should return 400 for invalid ID format', async () => {
        const response = await request(app).delete('/universities/invalid-id');
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid ID format' });
        });

        it('should return 500 when a server error occurs', async () => {
        prisma.university.delete.mockRejectedValue(new Error('Database error'));
        const response = await request(app).delete('/universities/1');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server Error' });
        });
        
        it('should return 404 if university to delete is not found', async () => {
        prisma.university.delete.mockRejectedValue({ code: 'P2025' });
        const response = await request(app).delete('/universities/1');
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'University not found' });
        });
    });
});