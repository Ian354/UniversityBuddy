const request = require('supertest');
const express = require('express');
const forumRouter = require('./forum');
const jwt = require('jsonwebtoken');

// Mock the prisma client
jest.mock('../prismaClient.js', () => ({
    forumTopic: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
    },
    forumPost: {
        create: jest.fn()
    }
}));

// Mock auth middleware
jest.mock('../middleware/auth.js', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 1, email: 'test@example.com', role: 'STUDENT' };
        next();
    },
    JWT_SECRET: 'test-secret'
}));

const prisma = require('../prismaClient.js');

// Create a test app
const app = express();
app.use(express.json());
app.use('/forum', forumRouter);

describe('Forum Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockTopics = [
        { 
            id: 1, 
            universityId: 1, 
            title: 'Where to find accommodation?', 
            category: 'Accommodation',
            isPinned: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { posts: 5 }
        },
        { 
            id: 2, 
            universityId: 1, 
            title: 'Best cafes near campus?', 
            category: 'Student Life',
            isPinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { posts: 3 }
        }
    ];

    const mockPosts = [
        {
            id: 1,
            topicId: 1,
            userId: 1,
            content: 'Check the university housing portal!',
            createdAt: new Date().toISOString(),
            user: { id: 1, name: 'John Doe', role: 'STUDENT' }
        }
    ];

    describe('GET /forum/university/:universityId/topics', () => {
        it('should return all topics for a university', async () => {
            prisma.forumTopic.findMany.mockResolvedValue(mockTopics);

            const response = await request(app)
                .get('/forum/university/1/topics')
                .expect(200);

            expect(response.body).toEqual(mockTopics);
            expect(prisma.forumTopic.findMany).toHaveBeenCalledWith({
                where: { universityId: 1 },
                include: {
                    _count: {
                        select: { posts: true }
                    }
                },
                orderBy: [
                    { isPinned: 'desc' },
                    { updatedAt: 'desc' }
                ]
            });
        });

        it('should handle errors', async () => {
            prisma.forumTopic.findMany.mockRejectedValue(new Error('Database error'));

            await request(app)
                .get('/forum/university/1/topics')
                .expect(500)
                .expect({ error: 'Internal server Error' });
        });
    });

    describe('GET /forum/topic/:topicId', () => {
        it('should return a topic with its posts', async () => {
            const mockTopic = {
                ...mockTopics[0],
                posts: mockPosts
            };
            prisma.forumTopic.findUnique.mockResolvedValue(mockTopic);

            const response = await request(app)
                .get('/forum/topic/1')
                .expect(200);

            expect(response.body).toEqual(mockTopic);
            expect(prisma.forumTopic.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                include: {
                    posts: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    role: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                }
            });
        });

        it('should return 404 if topic not found', async () => {
            prisma.forumTopic.findUnique.mockResolvedValue(null);

            await request(app)
                .get('/forum/topic/999')
                .expect(404)
                .expect({ error: 'Topic not found' });
        });
    });

    describe('POST /forum/university/:universityId/topics', () => {
        it('should create a new topic with initial post', async () => {
            const newTopic = {
                id: 3,
                universityId: 1,
                title: 'Need study partners',
                category: 'Academics',
                isPinned: false,
                posts: [{
                    id: 10,
                    content: 'Looking for study partners for Math 101',
                    user: { id: 1, name: 'John Doe', role: 'STUDENT' }
                }]
            };
            prisma.forumTopic.create.mockResolvedValue(newTopic);

            const response = await request(app)
                .post('/forum/university/1/topics')
                .send({
                    title: 'Need study partners',
                    category: 'Academics',
                    initialPost: 'Looking for study partners for Math 101'
                })
                .expect(201);

            expect(response.body).toEqual(newTopic);
            expect(prisma.forumTopic.create).toHaveBeenCalled();
        });

        it('should return 400 if required fields are missing', async () => {
            await request(app)
                .post('/forum/university/1/topics')
                .send({ title: 'Incomplete' })
                .expect(400)
                .expect({ error: 'Title, category, and initial post are required' });
        });
    });

    describe('POST /forum/topic/:topicId/posts', () => {
        it('should create a new post in a topic', async () => {
            const newPost = {
                id: 11,
                topicId: 1,
                userId: 1,
                content: 'Great idea!',
                user: { id: 1, name: 'John Doe', role: 'STUDENT' }
            };
            prisma.forumPost.create.mockResolvedValue(newPost);
            prisma.forumTopic.update.mockResolvedValue({});

            const response = await request(app)
                .post('/forum/topic/1/posts')
                .send({ content: 'Great idea!' })
                .expect(201);

            expect(response.body).toEqual(newPost);
            expect(prisma.forumPost.create).toHaveBeenCalled();
            expect(prisma.forumTopic.update).toHaveBeenCalled();
        });

        it('should return 400 if content is missing', async () => {
            await request(app)
                .post('/forum/topic/1/posts')
                .send({})
                .expect(400)
                .expect({ error: 'Content is required' });
        });
    });
});