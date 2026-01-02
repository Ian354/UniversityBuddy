const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleTopics = [
    {
        title: "Where to find accommodation near campus?",
        category: "Accommodation",
        isPinned: true,
        initialPost: "Hi everyone! I'm looking for recommendations on student residences or shared apartments near campus. Can anyone help?"
    },
    {
        title: "Clubs and extracurricular activities",
        category: "Activities",
        isPinned: false,
        initialPost: "What sports or cultural clubs are there at the university? I'd like to join one to meet new people."
    },
    {
        title: "Tips for new students",
        category: "General",
        isPinned: true,
        initialPost: "I'm starting university next semester. What advice would current students give me? What do you wish you had known before starting?"
    },
    {
        title: "Public transport: passes and discounts",
        category: "Student Life",
        isPinned: false,
        initialPost: "Is there any special transport pass for students? What's the best option for getting around the city?"
    },
    {
        title: "Best professors and recommended courses",
        category: "Academics",
        isPinned: false,
        initialPost: "For those who've been here for a while, which professors do you recommend? Are there any elective courses especially worth taking?"
    },
    {
        title: "Libraries and study rooms",
        category: "Academics",
        isPinned: false,
        initialPost: "What are the best places to study at the university? Are the libraries open 24 hours?"
    }
];

const sampleResponses = [
    "I live in Central Residence, and it's great, though a bit expensive. Another option is sharing an apartment in the area of...",
    "I was in the theater club last year, and it was an incredible experience. I highly recommend it.",
    "My advice would be to get involved in campus life early on. Join clubs, attend events, and don't be afraid to ask for help.",
    "The student office can give you more information about transport passes. They usually have a 50% discount.",
    "Professor García in Physics is excellent. Her classes are very dynamic, and you learn a lot.",
    "The main library closes at 10 pm on weekdays, but there are 24-hour study rooms in Building C.",
];

async function seedForumTopics() {
    try {
        console.log('Starting forum seeding...');

        const universities = await prisma.university.findMany();
        console.log(`Found ${universities.length} universities`);

        if (universities.length === 0) {
            console.log('No universities found. Please create universities first.');
            return;
        }

        let testUser = await prisma.user.findFirst({
            where: { email: 'testforum@example.com' }
        });

        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    email: 'testforum@example.com',
                    name: 'Forum Admin',
                    password: '$2a$10$testHashedPassword', // This is just for seeding, not real authentication
                    role: 'ADMIN',
                    openToContact: true
                }
            });
            console.log('Created test user for forum posts');
        }

        for (const university of universities) {
            console.log(`Seeding topics for ${university.name}...`);

            const numTopics = Math.floor(Math.random() * 3) + 3;
            const selectedTopics = [...sampleTopics]
                .sort(() => Math.random() - 0.5)
                .slice(0, numTopics);

            for (const topicData of selectedTopics) {
                const topic = await prisma.forumTopic.create({
                    data: {
                        universityId: university.id,
                        title: topicData.title,
                        category: topicData.category,
                        isPinned: topicData.isPinned,
                        posts: {
                            create: {
                                userId: testUser.id,
                                content: topicData.initialPost
                            }
                        }
                    }
                });

                const numResponses = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < numResponses; i++) {
                    const randomResponse = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
                    await prisma.forumPost.create({
                        data: {
                            topicId: topic.id,
                            userId: testUser.id,
                            content: randomResponse
                        }
                    });
                }
            }
        }

        console.log('Forum seeding completed successfully!');
    } catch (error) {
        console.error('Error seeding forum topics:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedForumTopics()
    .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    });