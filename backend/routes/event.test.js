const request = require('supertest');
const express = require('express');
const eventRouter = require('./event');

// Mock the prisma client
jest.mock('../prismaClient.js', () => ({
    event: {
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
app.use('/event', eventRouter);

describe('Event Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    });

    // Create a test app
    const app = express();
    app.use(express.json());
    app.use('/event', eventRouter);

    describe('GET /event', () => {
        it('should return all events', async () => {
            const mockEvents = [
                { id: 1, title: 'Event 1', start: '2025-10-14T16:00:00.000Z', end: '2025-10-14T17:00:00.000Z', mentor: { id: 1, name: 'John', email: 'john@test.com' }, attendees: [] },
                { id: 2, title: 'Event 2', start: '2025-10-14T16:00:00.000Z', end: '2025-10-14T17:00:00.000Z', mentor: { id: 2, name: 'Jane', email: 'jane@test.com' }, attendees: [] }
            ];
            prisma.event.findMany.mockResolvedValue(mockEvents);

            const response = await request(app).get('/event');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockEvents);
        });

        it('should filter events by mentorId', async () => {
            const mockEvents = [
                { id: 1, title: 'Event 1', mentorId: 1, start: '2025-10-14T16:00:00.000Z', end: '2025-10-14T17:00:00.000Z', mentor: { id: 1, name: 'John', email: 'john@test.com' }, attendees: [] }
            ];
            prisma.event.findMany.mockResolvedValue(mockEvents);

            const response = await request(app).get('/event?mentorId=1');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockEvents);
        });

        it('should return 400 if mentorId is not a number', async () => {
            const response = await request(app).get('/event?mentorId=abc');
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'Invalid mentorId format' });
        });

        it('should filter events by userId (attendee)', async () => {
            const mockEvents = [
                { id: 1, title: 'Event 1', start: '2025-10-14T16:00:00.000Z', end: '2025-10-14T17:00:00.000Z', mentor: { id: 1, name: 'John', email: 'john@test.com' }, attendees: [{ id: 1, name: 'User', email: 'user@test.com' }] }
            ];
            prisma.event.findMany.mockResolvedValue(mockEvents);

            const response = await request(app).get('/event?userId=1');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockEvents);
        });

        it('should return 400 if userId is not a number', async () => {
            const response = await request(app).get('/event?userId=abc');
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'Invalid userId format' });
        });

        it('should filter upcoming events', async () => {
            const mockEvents = [
                { id: 1, title: 'Event 1', start: '2025-10-14T16:00:00.000Z', end: '2025-10-14T17:00:00.000Z', mentor: { id: 1, name: 'John', email: 'john@test.com' }, attendees: [] }
            ];
            prisma.event.findMany.mockResolvedValue(mockEvents);

            const response = await request(app).get('/event?upcoming=true');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockEvents);
        });

        it('should return 500 if there is a server error', async () => {
            prisma.event.findMany.mockRejectedValue(new Error('Database error'));

            const response = await request(app).get('/event');
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Internal server error' });
        });
    });

    describe('GET /event/:id', () => {
        describe('GET /event/:id', () => {
            it('should return 400 if the ID is not a number', async () => {
                const response = await request(app).get('/event/abc');
                expect(response.status).toBe(400);
                expect(response.body).toEqual({ error: 'Invalid ID format' });
            });

            it('should return 404 if the event is not found', async () => {
                prisma.event.findUnique.mockResolvedValue(null);

                const response = await request(app).get('/event/999');
                expect(response.status).toBe(404);
                expect(response.body).toEqual({ error: 'Event not found' });
            });

            it('should return 500 if there is a server error', async () => {
                prisma.event.findUnique.mockRejectedValue(new Error('Database error'));

                const response = await request(app).get('/event/1');
                expect(response.status).toBe(500);
                expect(response.body).toEqual({ error: 'Internal server error' });
            });

            it('should return the event if it exists', async () => {
                const mockEvent = { id: 1, title: 'Test Event' };
                prisma.event.findUnique.mockResolvedValue(mockEvent);

                const response = await request(app).get('/event/1');
                expect(response.status).toBe(200);
                expect(response.body).toEqual(mockEvent);
            });
        });
    });

    describe('GET /event/:id/attendees', () => {
        it('should return 400 if the ID is not a number', async () => {
            const response = await request(app).get('/event/abc/attendees');
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'Invalid ID format' });
        });

        it('should return 404 if the event is not found', async () => {
            prisma.event.findUnique.mockResolvedValue(null);

            const response = await request(app).get('/event/999/attendees');
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Event not found' });
        });

        it('should return 500 if there is a server error', async () => {
            prisma.event.findUnique.mockRejectedValue(new Error('Database error'));

            const response = await request(app).get('/event/1/attendees');
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Internal server error' });
        });

        it('should return the attendees if the event exists', async () => {
            const mockAttendees = [{ id: 1, name: 'John Doe' }, { id: 2, name: 'Jane Smith' }];
            const mockEvent = { id: 1, attendees: mockAttendees };
            prisma.event.findUnique.mockResolvedValue(mockEvent);

            const response = await request(app).get('/event/1/attendees');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockAttendees);
        });
    });

    describe('POST /event', () => {
        it('should return 400 if required fields are missing', async () => {
            const response = await request(app).post('/event').send({
                description: 'Test description',
                start: '2023-01-01T10:00:00Z',
                end: '2023-01-01T12:00:00Z',
            });
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'Missing required fields' });
        });

        it('should return 409 if there is a unique constraint error', async () => {
            prisma.event.create.mockRejectedValue({ code: 'P2002' });

            const response = await request(app).post('/event').send({
                title: 'Duplicate Event',
                description: 'Test description',
                start: '2023-01-01T10:00:00Z',
                end: '2023-01-01T12:00:00Z',
                location: 'Test Location',
                capacity: 100,
            });
            expect(response.status).toBe(409);
            expect(response.body).toEqual({ error: 'Unique constraint error: Duplicate entry' });
        });

        it('should return 400 if mentorId is invalid', async () => {
            prisma.event.create.mockRejectedValue({
                code: 'P2003',
                meta: { field_name: 'mentorId' },
            });

            const response = await request(app).post('/event').send({
                title: 'Test Event',
                description: 'Test description',
                start: '2023-01-01T10:00:00Z',
                end: '2023-01-01T12:00:00Z',
                location: 'Test Location',
                capacity: 100,
                mentorId: 999,
            });
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'Invalid mentorId: Mentor does not exist' });
        });

        it('should return 500 if there is a server error', async () => {
            prisma.event.create.mockRejectedValue(new Error('Database error'));

            const response = await request(app).post('/event').send({
                title: 'Test Event',
                description: 'Test description',
                start: '2023-01-01T10:00:00Z',
                end: '2023-01-01T12:00:00Z',
                location: 'Test Location',
                capacity: 100,
            });
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Internal server error' });
        });

        it('should create a new event and return it', async () => {
            const mockEvent = {
                id: 1,
                title: 'Test Event',
                description: 'Test description',
                start: '2023-01-01T10:00:00Z',
                end: '2023-01-01T12:00:00Z',
                location: 'Test Location',
                capacity: 100,
                mentorId: null,
                groupId: null,
            };
            prisma.event.create.mockResolvedValue(mockEvent);

            const response = await request(app).post('/event').send({
                title: 'Test Event',
                description: 'Test description',
                start: '2023-01-01T10:00:00Z',
                end: '2023-01-01T12:00:00Z',
                location: 'Test Location',
                capacity: 100,
            });
            expect(response.status).toBe(201);
            expect(response.body).toEqual(mockEvent);
        });
    });

    describe('POST /event/:eventId/attend', () => {
        it('should return 400 if eventId or userId is not a number', async () => {
            const response = await request(app)
                .post('/event/abc/attend')
                .send({ userId: 'xyz' });
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'Invalid event or user ID format' });
        });

        it('should return 404 if the event is not found', async () => {
            prisma.event.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/event/999/attend')
                .send({ userId: 1 });
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Event not found' });
        });

        it('should return 404 if the user is not found', async () => {
            prisma.event.findUnique.mockResolvedValue({ id: 1 });
            prisma.user = { findUnique: jest.fn().mockResolvedValue(null) };

            const response = await request(app)
                .post('/event/1/attend')
                .send({ userId: 999 });
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'User not found' });
        });

        it('should return 500 if there is a server error', async () => {
            prisma.event.findUnique.mockResolvedValue({ id: 1 });
            prisma.user = { findUnique: jest.fn().mockResolvedValue({ id: 1 }) };
            prisma.event.update.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/event/1/attend')
                .send({ userId: 1 });
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Internal server error' });
        });

        it('should add the attendee to the event and return the updated event', async () => {
            const mockEvent = {
                id: 1,
                title: 'Test Event',
                attendees: [{ id: 1, name: 'John Doe' }]
            };
            prisma.event.findUnique.mockResolvedValue({ id: 1 });
            prisma.user = { findUnique: jest.fn().mockResolvedValue({ id: 1 }) };
            prisma.event.update.mockResolvedValue(mockEvent);

            const response = await request(app)
                .post('/event/1/attend')
                .send({ userId: 1 });
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockEvent);
        });
    });

    describe('POST /event/:eventId/unattend', () => {
        it('should return 400 if eventId or userId is not a number', async () => {
            const response = await request(app)
                .post('/event/abc/unattend')
                .send({ userId: 'xyz' });
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'Invalid event ID format' });
        });

        it('should return 404 if the event is not found', async () => {
            prisma.event.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/event/999/unattend')
                .send({ userId: 1 });
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Event not found' });
        });

        it('should return 404 if the user is not found', async () => {
            prisma.event.findUnique.mockResolvedValue({ id: 1 });
            prisma.user = { findUnique: jest.fn().mockResolvedValue(null) };

            const response = await request(app)
                .post('/event/1/unattend')
                .send({ userId: 999 });
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'User not found' });
        });

        it('should return 500 if there is a server error', async () => {
            prisma.event.findUnique.mockResolvedValue({ id: 1 });
            prisma.user = { findUnique: jest.fn().mockResolvedValue({ id: 1 }) };
            prisma.event.update.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/event/1/unattend')
                .send({ userId: 1 });
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Internal server error' });
        });

        it('should remove the attendee from the event and return the updated event', async () => {
            const mockEvent = {
                id: 1,
                title: 'Test Event',
                attendees: []
            };
            prisma.event.findUnique.mockResolvedValue({ id: 1 });
            prisma.user = { findUnique: jest.fn().mockResolvedValue({ id: 1 }) };
            prisma.event.update.mockResolvedValue(mockEvent);

            const response = await request(app)
                .post('/event/1/unattend')
                .send({ userId: 1 });
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockEvent);
        });
    });
});