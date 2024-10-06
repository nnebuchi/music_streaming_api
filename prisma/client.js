const { PrismaClient } = require('@prisma/client');
const prisma  = new PrismaClient();

const {user_middleware, song_middleware} = require('./middleware');
prisma.$use(user_middleware)
prisma.$use(song_middleware)
module.exports = prisma;