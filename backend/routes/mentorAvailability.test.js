const request = require('supertest');
const express = require('express');
const universityRouter = require('./mentorAvailability');

// Mock the prisma client
jest.mock('../prismaClient.js', () => ({
    mentorAvailability: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  user: {
    findUnique: jest.fn()
  }
}));

const prisma = require('../prismaClient.js');

// Create a test app
const app = express();
app.use(express.json());
app.use('/mentorAvailability', universityRouter);

describe('Mentor Availability Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    });

    const mockAvailability = [
            {
                id: 1,
                mentorId: 1,
                dayOfWeek: 1,
                startTime: '09:00',
                endTime: '11:00',
                mentor: { id: 1, email: 'mentor1@example.com', name: 'Mentor One', role: 'mentor' }
            },
            {
                id: 2,
                mentorId: 1,
                dayOfWeek: 2,
                startTime: '13:00',
                endTime: '15:00',
                mentor: { id: 1, email: 'mentor1@example.com', name: 'Mentor One', role: 'mentor' }
            }
        ];

describe('GET /mentor/:mentorId', () => {
    it('should fetch all availability slots for a specific mentor with mentor details', async () => {
        const mockAvailabilityWithMentor = [
            {
                id: 1,
                mentorId: 1,
                dayOfWeek: 1,
                startTime: '09:00',
                endTime: '11:00',
                mentor: { id: 1, email: 'mentor1@example.com', name: 'Mentor One', role: 'MENTOR' }
            },
            {
                id: 2,
                mentorId: 1,
                dayOfWeek: 2,
                startTime: '13:00',
                endTime: '15:00',
                mentor: { id: 1, email: 'mentor1@example.com', name: 'Mentor One', role: 'MENTOR' }
            }
        ];

        prisma.mentorAvailability.findMany.mockResolvedValue(mockAvailabilityWithMentor);

        const response = await request(app).get('/mentorAvailability/mentor/1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockAvailabilityWithMentor);
    });

    it('should return an empty array if no availability slots are found for the mentor', async () => {
        prisma.mentorAvailability.findMany.mockResolvedValue([]);

        const response = await request(app).get('/mentorAvailability/mentor/999');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it('should return 500 when a server error occurs', async () => {
        prisma.mentorAvailability.findMany.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get('/mentorAvailability/mentor/1');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server error' });
    });
});

    describe('GET /mentorAvailability/:id', () => {
        it('should fetch a specific availability slot by ID', async () => {
            const mockAvailability = {
                id: 1,
                mentorId: 1,
                dayOfWeek: 1,
                startTime: '09:00',
                endTime: '11:00',
                mentor: { id: 1, email: 'mentor1@example.com', name: 'Mentor One', role: 'MENTOR' }
            };

            prisma.mentorAvailability.findUnique.mockResolvedValue(mockAvailability);

            const response = await request(app).get('/mentorAvailability/1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockAvailability);
        });

        it('should return 404 if the availability slot is not found', async () => {
            prisma.mentorAvailability.findUnique.mockResolvedValue(null);

            const response = await request(app).get('/mentorAvailability/999');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Availability slot not found' });
        });

        it('should return 500 when a server error occurs', async () => {
            prisma.mentorAvailability.findUnique.mockRejectedValue(new Error('Database error'));

            const response = await request(app).get('/mentorAvailability/1');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Internal server error' });
        });
    });

    describe('POST /mentorAvailability', () => {
        it('should create a new availability slot', async () => {
            const newAvailability = {
                mentorId: 1,
                dayOfWeek: 3,
                startTime: '10:00',
                endTime: '12:00'
            };
            const createdAvailability = { id: 3, ...newAvailability };
            prisma.mentorAvailability.create.mockResolvedValue(createdAvailability);
            prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'MENTOR' });

            const response = await request(app).post('/mentorAvailability').send(newAvailability);
            expect(response.status).toBe(201);
            expect(response.body).toEqual(createdAvailability);
        });

        it('should return 400 if required fields are missing', async () => {
            const response = await request(app).post('/mentorAvailability').send({
                dayOfWeek: 3,
                startTime: '10:00',
                endTime: '12:00'
            });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: 'Missing required fields: mentorId, dayOfWeek, startTime, endTime'
            });
        });

        it('should return 400 if dayOfWeek is out of range', async () => {
            const response = await request(app).post('/mentorAvailability').send({
                mentorId: 1,
                dayOfWeek: 8,
                startTime: '10:00',
                endTime: '12:00'
            });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: 'dayOfWeek must be between 0 (Sunday) and 7 (Sunday)'
            });
        });

        it('should return 400 if time format is invalid', async () => {
            const response = await request(app).post('/mentorAvailability').send({
                mentorId: 1,
                dayOfWeek: 3,
                startTime: '25:00',
                endTime: '12:00'
            });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: 'Time must be in HH:MM format (e.g., "09:00")'
            });
        });

        it('should return 400 if startTime is not before endTime', async () => {
            const response = await request(app).post('/mentorAvailability').send({
                mentorId: 1,
                dayOfWeek: 3,
                startTime: '12:00',
                endTime: '10:00'
            });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: 'startTime must be before endTime'
            });
        });

        it('should return 404 if mentor is not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const response = await request(app).post('/mentorAvailability').send({
                mentorId: 999,
                dayOfWeek: 3,
                startTime: '10:00',
                endTime: '12:00'
            });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Mentor not found' });
        });

        it('should return 403 if user does not have MENTOR role', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'STUDENT' });

            const response = await request(app).post('/mentorAvailability').send({
                mentorId: 1,
                dayOfWeek: 3,
                startTime: '10:00',
                endTime: '12:00'
            });

            expect(response.status).toBe(403);
            expect(response.body).toEqual({
                error: 'User must have MENTOR role to create availability slots'
            });
        });

        it('should return 409 if a conflicting availability slot exists', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'MENTOR' });
            prisma.mentorAvailability.create.mockRejectedValue({ code: 'P2002' });

            const response = await request(app).post('/mentorAvailability').send({
                mentorId: 1,
                dayOfWeek: 1,
                startTime: '09:30',
                endTime: '10:30'
            });

            expect(response.status).toBe(409);
            expect(response.body).toEqual({
                error: 'Conflicting availability slot already exists for this mentor on this day/time'
            });
        });

        it('should return 500 when a server error occurs', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'MENTOR' });
            prisma.mentorAvailability.create.mockRejectedValue(new Error('Database error'));

            const response = await request(app).post('/mentorAvailability').send({
                mentorId: 1,
                dayOfWeek: 3,
                startTime: '10:00',
                endTime: '12:00'
            });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Internal server error' });
        });
    });
  
describe('PUT /mentorAvailability/:id', () => {
    it('should update an availability slot successfully', async () => {
        const updatedAvailability = {
            id: 1,
            dayOfWeek: 2,
            startTime: '10:00',
            endTime: '12:00'
        };

        prisma.mentorAvailability.update.mockResolvedValue(updatedAvailability);

        const response = await request(app).put('/mentorAvailability/1').send({
            dayOfWeek: 2,
            startTime: '10:00',
            endTime: '12:00'
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(updatedAvailability);
    });

    it('should return 400 if dayOfWeek is out of range', async () => {
        const response = await request(app).put('/mentorAvailability/1').send({
            dayOfWeek: 8,
            startTime: '10:00',
            endTime: '12:00'
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)'
        });
    });

    it('should return 400 if time format is invalid', async () => {
        const response = await request(app).put('/mentorAvailability/1').send({
            dayOfWeek: 2,
            startTime: '25:00',
            endTime: '12:00'
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Time must be in HH:MM format (e.g., "09:00")'
        });
    });

    it('should return 400 if startTime is not before endTime', async () => {
        const response = await request(app).put('/mentorAvailability/1').send({
            dayOfWeek: 2,
            startTime: '12:00',
            endTime: '10:00'
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'startTime must be before endTime'
        });
    });

    it('should return 404 if availability slot is not found', async () => {
        prisma.mentorAvailability.update.mockRejectedValue({ code: 'P2025' });

        const response = await request(app).put('/mentorAvailability/999').send({
            dayOfWeek: 2,
            startTime: '10:00',
            endTime: '12:00'
        });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: 'Availability slot not found'
        });
    });

    it('should return 409 if a conflicting availability slot exists', async () => {
        prisma.mentorAvailability.update.mockRejectedValue({ code: 'P2002' });

        const response = await request(app).put('/mentorAvailability/1').send({
            dayOfWeek: 2,
            startTime: '10:00',
            endTime: '12:00'
        });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            error: 'Conflicting availability slot already exists for this mentor on this day/time'
        });
    });

    it('should return 500 when a server error occurs', async () => {
        prisma.mentorAvailability.update.mockRejectedValue(new Error('Database error'));

        const response = await request(app).put('/mentorAvailability/1').send({
            dayOfWeek: 2,
            startTime: '10:00',
            endTime: '12:00'
        });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server error' });
    });
});

describe('DELETE /mentorAvailability/:id', () => {
    it('should delete an availability slot successfully', async () => {
        prisma.mentorAvailability.delete.mockResolvedValue();

        const response = await request(app).delete('/mentorAvailability/1');

        expect(response.status).toBe(204);
        expect(response.body).toEqual({});
    });

    it('should return 404 if availability slot is not found', async () => {
        prisma.mentorAvailability.delete.mockRejectedValue({ code: 'P2025' });

        const response = await request(app).delete('/mentorAvailability/999');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: 'Availability slot not found'
        });
    });

    it('should return 500 when a server error occurs', async () => {
        prisma.mentorAvailability.delete.mockRejectedValue(new Error('Database error'));

        const response = await request(app).delete('/mentorAvailability/1');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server error' });
    });
});

describe('GET /mentorAvailability/mentor/:mentorId/week', () => {
    it('should fetch weekly availability for a specific mentor', async () => {
        const mockWeeklyAvailability = [
            { id: 1, mentorId: 1, dayOfWeek: 0, startTime: '09:00', endTime: '11:00', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' },
            { id: 2, mentorId: 1, dayOfWeek: 1, startTime: '13:00', endTime: '15:00', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }
        ];

        prisma.mentorAvailability.findMany.mockResolvedValue(mockWeeklyAvailability);

        const response = await request(app).get('/mentorAvailability/mentor/1/week');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            0: { dayName: 'Monday', slots: [{ id: 1, startTime: '09:00', endTime: '11:00', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }] },
            1: { dayName: 'Tuesday', slots: [{ id: 2, startTime: '13:00', endTime: '15:00', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }] },
            2: { dayName: 'Wednesday', slots: [] },
            3: { dayName: 'Thursday', slots: [] },
            4: { dayName: 'Friday', slots: [] },
            5: { dayName: 'Saturday', slots: [] },
            6: { dayName: 'Sunday', slots: [] }
        });
    });

    it('should return 500 when a server error occurs', async () => {
        prisma.mentorAvailability.findMany.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get('/mentorAvailability/mentor/1/week');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server error' });
    });
});
});
