const request = require('supertest');
const express = require('express');
const usersRouter = require('./users');

// Mock the prisma client
jest.mock('../prismaClient.js', () => ({
  user: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

const prisma = require('../prismaClient.js');

// Create a test app
const app = express();
app.use(express.json());
app.use('/users', usersRouter);

describe('Users Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    });

  describe('GET /users', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@test.com', name: 'User 1', role: 'student' },
        { id: 2, email: 'user2@test.com', name: 'User 2', role: 'mentor' }
      ];

      prisma.user.findMany.mockResolvedValue(mockUsers);

      const response = await request(app).get('/users');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
    });

    it('should return 500 when database error occurs', async () => {
      prisma.user.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/users');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch users' });
    });
  });

  describe('POST /users', () => {
    it('should create a new user with an erasmus', async () => {
      const newUser = {
        email: 'newuser@test.com',
        name: 'New User',
        password: 'password123',
        role: 'STUDENT',
        universityId: 1,
        erasmusUniversityId: 2,
        erasmusYear: 2024,
        degree: 'Computer Science',
        openToContact: true
      };

      const createdUser = { id: 1, ...newUser };
      prisma.user.create.mockResolvedValue(createdUser);
      prisma.erasmus = { create: jest.fn().mockResolvedValue({ id: 1, userId: 1, universityId: 2, year: 2024 }) };

      const response = await request(app)
        .post('/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdUser);
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: newUser
      });
    });

    it('should create a new user without an erasmus', async () => {
      const newUser = {
        email: 'newuser@test.com',
        name: 'New User',
        password: 'password123',
        role: 'STUDENT',
        universityId: 1,
        degree: 'Computer Science',
        openToContact: true
      };

      const createdUser = { id: 1, ...newUser };
      prisma.user.create.mockResolvedValue(createdUser);

      const response = await request(app)
        .post('/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdUser);
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: newUser
      });
    });

    it('should return 400 when user data(email) is invalid', async () => {
      const invalidUser = {
        email: 'newuser',
        name: 'New User',
        password: 'password123',
        role: 'STUDENT',
        universityId: 1,
        degree: 'Computer Science',
        openToContact: true
      };

      const response = await request(app)
        .post('/users')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid email format' });
    });

    it('should return 409 when email already exists', async () => {
      const newUser = {
        email: 'newuser@test.com',
        name: 'New User',
        password: 'password123',
        role: 'STUDENT',
        universityId: 1,
        degree: 'Computer Science',
        openToContact: true
      };

    prisma.user.create.mockRejectedValue({
      code: 'P2002',
      meta: {
        target: ['email']
      }
    });

    const response = await request(app)
      .post('/users')
      .send(newUser);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'User with this email already exists' });
    });

    it('should return 500 when user creation fails', async () => {
      const newUser = {
        email: 'newuser@test.com',
        name: 'New User',
        password: 'password123',
        role: 'STUDENT',
        universityId: 1,
        degree: 'Computer Science',
        openToContact: true
      };

      prisma.user.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/users')
        .send(newUser);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to create user' });
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user by ID', async () => {
      const mockUser = { id: 1, email: 'user1@test.com', name: 'User 1', role: 'student' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app).get('/users/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return 404 when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/users/1');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    it('should return 500 when database error occurs', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/users/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch user' });
    });
  });

  describe('GET /users/university/:universityId', () => {
    it('should return users by university ID and role', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@test.com', name: 'User 1', role: 'student' },
        { id: 2, email: 'user2@test.com', name: 'User 2', role: 'mentor' }
      ];
      prisma.user.findMany.mockResolvedValue(mockUsers);

      const response = await request(app).get('/users/university/1?role=student');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { universityId: 1, role: 'student' }
      });
    });

    it('should return 500 when database error occurs', async () => {
      prisma.user.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/users/university/1?role=student');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch users' });
    });

    it('should return 400 when university ID is invalid', async () => {
      const response = await request(app).get('/users/university/invalidId?role=student');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid university ID' });
    });
  });

  describe('PUT /users/:id', () => {
    it('should update a user by ID', async () => {
      const updatedUser = {
        id: 1,
        email: 'newuser@test.com',
        name: 'New User',
        password: 'password123',
        role: 'STUDENT',
        universityId: 1,
        degree: 'Computer Science',
        openToContact: true
      };

      prisma.user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/users/2')
        .send(updatedUser);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedUser);
    });

    it('should return 404 when user is not found', async () => {
      const updatedUser = {
        email: 'updateduser@test.com',
        name: 'Updated User',
        password: 'newpassword123',
        role: 'student',
        universityId: 1,
        erasmus: false,
        year: 2024,
        degree: 'Computer Science',
        openToContact: true
      };

      prisma.user.update.mockRejectedValue({
        code: 'P2025'
      });

      const response = await request(app)
        .put('/users/1')
        .send(updatedUser);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    it('should return 409 when email already exists', async () => {
      const updatedUser = {
        email: 'existinguser@test.com',
        name: 'Updated User',
        password: 'newpassword123',
        role: 'student',
        universityId: 1,
        erasmus: false,
        year: 2024,
        degree: 'Computer Science',
        openToContact: true
      };

      prisma.user.update.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['email'] }
      });

      const response = await request(app)
        .put('/users/1')
        .send(updatedUser);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'Email already in use' });
    });

    it('should return 400 when user ID is invalid', async () => {
      const updatedUser = {
        email: 'updateduser@test.com',
        name: 'Updated User',
        password: 'newpassword123',
        role: 'student',
        universityId: 1,
        erasmus: false,
        year: 2024,
        degree: 'Computer Science',
        openToContact: true
      };

      const response = await request(app)
        .put('/users/invalidId')
        .send(updatedUser);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid user ID' });
    });

    it('should return 500 when update fails', async () => {
      const updatedUser = {
        email: 'updateduser@test.com',
        name: 'Updated User',
        password: 'newpassword123',
        role: 'student',
        universityId: 1,
        erasmus: false,
        year: 2024,
        degree: 'Computer Science',
        openToContact: true
      };

      prisma.user.update.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/users/1')
        .send(updatedUser);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update user' });
    });
  });
  describe('DELETE /users/:id', () => {
    it('should delete a user by ID', async () => {
      prisma.user.delete.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .delete('/users/1');

      expect(response.status).toBe(204);
    });

    it('should return 404 when user is not found', async () => {
      prisma.user.delete.mockRejectedValue({
        code: 'P2025'
      });

      const response = await request(app)
        .delete('/users/1');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    it('should return 400 when user ID is invalid', async () => {
      const response = await request(app)
        .delete('/users/invalidId');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid user ID' });
    });

    it('should return 500 when delete fails', async () => {
      prisma.user.delete.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/users/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to delete user' });
    });
  });
});