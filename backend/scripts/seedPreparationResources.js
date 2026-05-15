import mongoose from 'mongoose';
import PreparationResource from '../models/PreparationResource.js';
import dotenv from 'dotenv';

dotenv.config();

const seedResources = [
  {
    title: "React Technical Interview Guide",
    type: "guide",
    category: "technical",
    duration: "15 min read",
    difficulty: "intermediate",
    rating: 4.8,
    description: "Comprehensive guide covering React fundamentals, hooks, and advanced concepts for technical interviews.",
    content: "This guide covers everything from basic React concepts to advanced patterns used in production applications...",
    externalUrl: "https://reactjs.org/docs/getting-started.html",
    tags: ["react", "javascript", "frontend", "hooks"]
  },
  {
    title: "Behavioral Questions: STAR Method",
    type: "video",
    category: "behavioral", 
    duration: "12:30",
    difficulty: "beginner",
    rating: 4.9,
    description: "Learn how to structure your answers to behavioral questions using the STAR method.",
    content: "The STAR method (Situation, Task, Action, Result) is a structured approach to answering behavioral questions...",
    externalUrl: "https://youtube.com/watch?v=example",
    tags: ["behavioral", "star", "communication"]
  },
  {
    title: "System Design Fundamentals",
    type: "guide",
    category: "technical",
    duration: "25 min read", 
    difficulty: "advanced",
    rating: 4.7,
    description: "Essential system design concepts for senior engineering roles.",
    content: "System design interviews test your ability to design large-scale systems. Key concepts include...",
    tags: ["system design", "architecture", "scalability"]
  },
  {
    title: "Salary Negotiation Strategies",
    type: "article",
    category: "career",
    duration: "8 min read",
    difficulty: "intermediate", 
    rating: 4.6,
    description: "Effective strategies for negotiating your compensation package.",
    content: "Salary negotiation is a critical part of the job search process. Learn how to approach it confidently...",
    tags: ["salary", "negotiation", "career"]
  },
  {
    title: "Data Structures Crash Course",
    type: "video",
    category: "technical",
    duration: "45:15",
    difficulty: "intermediate",
    rating: 4.8,
    description: "Quick review of essential data structures for coding interviews.",
    content: "This crash course covers arrays, linked lists, trees, graphs, and hash tables with practical examples...",
    externalUrl: "https://youtube.com/watch?v=datastructures",
    tags: ["data structures", "algorithms", "coding"]
  },
  {
    title: "Leadership Principles at FAANG",
    type: "article", 
    category: "behavioral",
    duration: "10 min read",
    difficulty: "intermediate",
    rating: 4.5,
    description: "Understanding leadership principles for Amazon and other tech giants.",
    content: "FAANG companies have specific leadership principles they look for in candidates. Learn how to demonstrate them...",
    tags: ["leadership", "faang", "behavioral"]
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interviewapp');
    
    console.log('Connected to MongoDB');
    
    // Clear existing resources
    await PreparationResource.deleteMany({});
    console.log('Cleared existing resources');
    
    // Insert new resources
    await PreparationResource.insertMany(seedResources);
    
    console.log('✅ Preparation resources seeded successfully!');
    
    // Count and display seeded resources
    const count = await PreparationResource.countDocuments();
    console.log(`📚 Total resources in database: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

seedDatabase();