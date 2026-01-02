const request = require('supertest');
const express = require('express');
const universityRouter = require('./erasmus');

// Mock the prisma client
jest.mock('../prismaClient.js', () => ({
    erasmus: {
    findMany: jest.fn(),
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
app.use('/erasmus', universityRouter);

describe('Erasmus Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    });

    it('should fetch erasmus assignments by user ID', async () => {
        const mockUserId = 1;
        const mockErasmusAssignments = [
            { id: 1, userId: mockUserId, universityId: 101, status: 'approved', year: '2023' },
            { id: 2, userId: mockUserId, universityId: 102, status: 'pending', year: '2024' }
        ];

        prisma.erasmus.findMany.mockResolvedValue(mockErasmusAssignments);

        const response = await request(app).get(`/erasmus/user/${mockUserId}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockErasmusAssignments);
        expect(prisma.erasmus.findMany).toHaveBeenCalledWith({
            where: { userId: mockUserId }
        });
    });

    it('should return 400 for invalid user ID', async () => {
        const invalidUserId = 'abc';

        const response = await request(app).get(`/erasmus/user/${invalidUserId}`);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid user ID' });
        expect(prisma.erasmus.findMany).not.toHaveBeenCalled();
    });

    it('should return 500 if there is a server error', async () => {
        const mockUserId = 1;

        prisma.erasmus.findMany.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get(`/erasmus/user/${mockUserId}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server error' });
        expect(prisma.erasmus.findMany).toHaveBeenCalledWith({
            where: { userId: mockUserId }
        });
    });

    it('should fetch erasmus assignments by university ID', async () => {
        const mockUniversityId = 101;
        const mockErasmusAssignments = [
            { id: 1, userId: 1, universityId: mockUniversityId, status: 'approved', year: '2023' },
            { id: 2, userId: 2, universityId: mockUniversityId, status: 'pending', year: '2024' }
        ];

        prisma.erasmus.findMany.mockResolvedValue(mockErasmusAssignments);

        const response = await request(app).get(`/erasmus/university/${mockUniversityId}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockErasmusAssignments);
        expect(prisma.erasmus.findMany).toHaveBeenCalledWith({
            where: { universityId: mockUniversityId }
        });
    });

    it('should return 400 for invalid university ID', async () => {
        const invalidUniversityId = 'xyz';

        const response = await request(app).get(`/erasmus/university/${invalidUniversityId}`);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid university ID' });
        expect(prisma.erasmus.findMany).not.toHaveBeenCalled();
    });

    it('should return 500 if there is a server error', async () => {
        const mockUniversityId = 101;

        prisma.erasmus.findMany.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get(`/erasmus/university/${mockUniversityId}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server error' });
        expect(prisma.erasmus.findMany).toHaveBeenCalledWith({
            where: { universityId: mockUniversityId }
        });
    });

    it('should create a new erasmus assignment', async () => {
        const newErasmusData = {
            userId: 1,
            universityId: 101,
            status: 'approved',
            year: '2023'
        };

        const mockCreatedErasmus = {
            id: 1,
            ...newErasmusData
        };

        prisma.erasmus.create.mockResolvedValue(mockCreatedErasmus);

        const response = await request(app).post('/erasmus').send(newErasmusData);

        expect(response.status).toBe(201);
        expect(response.body).toEqual(mockCreatedErasmus);
        expect(prisma.erasmus.create).toHaveBeenCalledWith({
            data: newErasmusData
        });
    });

    it('should return 400 for missing required fields', async () => {
        const incompleteData = {
            userId: 1,
            universityId: 101
        };

        const response = await request(app).post('/erasmus').send(incompleteData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Missing required fields' });
        expect(prisma.erasmus.create).not.toHaveBeenCalled();
    });

    it('should return 409 for unique constraint error', async () => {
        const newErasmusData = {
            userId: 1,
            universityId: 101,
            status: 'approved',
            year: '2023'
        };

        prisma.erasmus.create.mockRejectedValue({ code: 'P2002' });

        const response = await request(app).post('/erasmus').send(newErasmusData);

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: 'Unique constraint error' });
        expect(prisma.erasmus.create).toHaveBeenCalledWith({
            data: newErasmusData
        });
    });

    it('should return 500 for server error', async () => {
        const newErasmusData = {
            userId: 1,
            universityId: 101,
            status: 'approved',
            year: '2023'
        };

        prisma.erasmus.create.mockRejectedValue(new Error('Database error'));

        const response = await request(app).post('/erasmus').send(newErasmusData);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server error' });
        expect(prisma.erasmus.create).toHaveBeenCalledWith({
            data: newErasmusData
        });
    });

    it('should update an existing erasmus assignment', async () => {
        const mockId = 1;
        const updatedErasmusData = {
            userId: 2,
            universityId: 102,
            status: 'pending',
            year: '2024'
        };

        const mockUpdatedErasmus = {
            id: mockId,
            ...updatedErasmusData
        };

        prisma.erasmus.update.mockResolvedValue(mockUpdatedErasmus);

        const response = await request(app).put(`/erasmus/${mockId}`).send(updatedErasmusData);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUpdatedErasmus);
        expect(prisma.erasmus.update).toHaveBeenCalledWith({
            where: { id: mockId },
            data: updatedErasmusData
        });
    });

    it('should return 400 for invalid ID', async () => {
        const invalidId = 'abc';
        const updatedErasmusData = {
            userId: 2,
            universityId: 102,
            status: 'pending',
            year: '2024'
        };

        const response = await request(app).put(`/erasmus/${invalidId}`).send(updatedErasmusData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid ID' });
        expect(prisma.erasmus.update).not.toHaveBeenCalled();
    });

    it('should return 404 if erasmus assignment is not found', async () => {
        const mockId = 1;
        const updatedErasmusData = {
            userId: 2,
            universityId: 102,
            status: 'pending',
            year: '2024'
        };

        prisma.erasmus.update.mockRejectedValue({ code: 'P2025' });

        const response = await request(app).put(`/erasmus/${mockId}`).send(updatedErasmusData);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Erasmus assignment not found' });
        expect(prisma.erasmus.update).toHaveBeenCalledWith({
            where: { id: mockId },
            data: updatedErasmusData
        });
    });

    it('should return 500 for server error', async () => {
        const mockId = 1;
        const updatedErasmusData = {
            userId: 2,
            universityId: 102,
            status: 'pending',
            year: '2024'
        };

        prisma.erasmus.update.mockRejectedValue(new Error('Database error'));

        const response = await request(app).put(`/erasmus/${mockId}`).send(updatedErasmusData);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server error' });
        expect(prisma.erasmus.update).toHaveBeenCalledWith({
            where: { id: mockId },
            data: updatedErasmusData
        });
    });

    it('should delete an existing erasmus assignment', async () => {
        const mockId = 1;

        prisma.erasmus.delete.mockResolvedValue({});

        const response = await request(app).delete(`/erasmus/${mockId}`);

        expect(response.status).toBe(204);
        expect(prisma.erasmus.delete).toHaveBeenCalledWith({
            where: { id: mockId }
        });
    });

    it('should return 400 for invalid ID', async () => {
        const invalidId = 'abc';

        const response = await request(app).delete(`/erasmus/${invalidId}`);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid ID' });
        expect(prisma.erasmus.delete).not.toHaveBeenCalled();
    });

    it('should return 404 if erasmus assignment is not found', async () => {
        const mockId = 1;

        prisma.erasmus.delete.mockRejectedValue({ code: 'P2025' });

        const response = await request(app).delete(`/erasmus/${mockId}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Erasmus assignment not found' });
        expect(prisma.erasmus.delete).toHaveBeenCalledWith({
            where: { id: mockId }
        });
    });

    it('should return 500 for server error', async () => {
        const mockId = 1;

        prisma.erasmus.delete.mockRejectedValue(new Error('Database error'));

        const response = await request(app).delete(`/erasmus/${mockId}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server error' });
        expect(prisma.erasmus.delete).toHaveBeenCalledWith({
            where: { id: mockId }
        });
    });
});