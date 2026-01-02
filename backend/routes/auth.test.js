const request = require('supertest');
const express = require('express');
const universityRouter = require('./auth');

// Mock the prisma client
jest.mock('../prismaClient.js', () => ({
    user: {
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
app.use('/auth', universityRouter);

describe('Authorization Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    });

    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const mockUser = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'password123',
                role: 'USER',
                university: '1',
                erasmus: false,
                degree: 'Computer Science',
                openToContact: true
            };

            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({
                id: 1,
                email: mockUser.email,
                name: mockUser.name,
                role: mockUser.role,
                universityId: parseInt(mockUser.university, 10),
                erasmus: mockUser.erasmus,
                degree: mockUser.degree,
                openToContact: mockUser.openToContact
            });

            const response = await request(app)
                .post('/auth/register')
                .send(mockUser);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.user).toMatchObject({
                email: mockUser.email,
                name: mockUser.name,
                role: mockUser.role,
                universityId: parseInt(mockUser.university, 10),
                erasmus: mockUser.erasmus,
                degree: mockUser.degree,
                openToContact: mockUser.openToContact
            });
            expect(response.body.token).toBeDefined();
        });
        it('should return 400 if required fields are missing', async () => {
                const response = await request(app)
                    .post('/auth/register')
                    .send({
                        email: 'test@example.com',
                        name: 'Test User'
                        // Missing password
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toBe('Missing required fields: email, name, and password');
            });

            it('should return 400 if user already exists', async () => {
                const mockUser = {
                    email: 'test@example.com',
                    name: 'Test User',
                    password: 'password123',
                    role: 'USER',
                    university: '1',
                    erasmus: false,
                    degree: 'Computer Science',
                    openToContact: true
                };

                prisma.user.findUnique.mockResolvedValue(mockUser);

                const response = await request(app)
                    .post('/auth/register')
                    .send(mockUser);

                expect(response.status).toBe(400);
                expect(response.body.error).toBe('User already exists with this email');
            });

            it('should return 500 if password hashing fails', async () => {
                const mockUser = {
                    email: 'test@example.com',
                    name: 'Test User',
                    password: 'password123',
                    role: 'USER',
                    university: '1',
                    erasmus: false,
                    degree: 'Computer Science',
                    openToContact: true
                };

                prisma.user.findUnique.mockResolvedValue(null);
                jest.spyOn(require('bcryptjs'), 'hash').mockRejectedValue(new Error('Hashing error'));

                const response = await request(app)
                    .post('/auth/register')
                    .send(mockUser);

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('Password hashing failed');
            });

            it('should return 409 if email is already registered', async () => {
                const mockUser = {
                    email: 'test@example.com',
                    name: 'Test User',
                    password: 'password123',
                    role: 'USER',
                    university: '1',
                    erasmus: false,
                    degree: 'Computer Science',
                    openToContact: true
                };

                prisma.user.findUnique.mockResolvedValue(null);
                prisma.user.create.mockRejectedValue({
                    code: 'P2002',
                    meta: { target: ['email'] }
                });

                const response = await request(app)
                    .post('/auth/register')
                    .send(mockUser);

                expect(response.status).toBe(409);
                expect(response.body.error).toBe('Email already registered');
            });

            it('should return 500 for unexpected errors during registration', async () => {
                const mockUser = {
                    email: 'test@example.com',
                    name: 'Test User',
                    password: 'password123',
                    role: 'USER',
                    university: '1',
                    erasmus: false,
                    degree: 'Computer Science',
                    openToContact: true
                };

                prisma.user.findUnique.mockResolvedValue(null);
                prisma.user.create.mockRejectedValue(new Error('Unexpected error'));

                const response = await request(app)
                    .post('/auth/register')
                    .send(mockUser);

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('Failed to register user');
        });
    });

    describe('POST /auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: await require('bcryptjs').hash('password123', 10),
                role: 'USER',
                name: 'Test User',
                universityId: 1,
                erasmus: false,
                degree: 'Computer Science',
                openToContact: true
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.user).toMatchObject({
                email: mockUser.email,
                name: mockUser.name,
                role: mockUser.role,
                universityId: mockUser.universityId,
                erasmus: mockUser.erasmus,
                degree: mockUser.degree,
                openToContact: mockUser.openToContact
            });
            expect(response.body.token).toBeDefined();
        });

        it('should return 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'test@example.com' }); // Missing password

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Missing required fields: email and password');
        });

        it('should return 401 if user does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });

        it('should return 401 if password is incorrect', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: await require('bcryptjs').hash('password123', 10),
                role: 'USER',
                name: 'Test User',
                universityId: 1,
                erasmus: false,
                degree: 'Computer Science',
                openToContact: true
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'test@example.com', password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });

        it('should return 500 for unexpected errors during login', async () => {
            prisma.user.findUnique.mockRejectedValue(new Error('Unexpected error'));

            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to login');
        });
    });
});