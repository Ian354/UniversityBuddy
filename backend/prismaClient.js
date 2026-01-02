// prisma.js
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis; 

// Avoid creating multiple instances during development with hot reload
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;