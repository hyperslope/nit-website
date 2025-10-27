const mongoose = require('mongoose');
require('dotenv').config();

// Schemas
const publicationSchema = new mongoose.Schema({
  authors: String,
  title: String,
  journal: String,
  year: String,
  timestamp: { type: Date, default: Date.now }
});

const personSchema = new mongoose.Schema({
  name: String,
  role: String,
  email: String,
  category: String,
  createdAt: { type: Date, default: Date.now }
});

const newsSchema = new mongoose.Schema({
  date: Date,
  headline: String,
  content: String,
  tag: String,
  createdAt: { type: Date, default: Date.now }
});

const researchAreaSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with test data...\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/green-chemistry-db');
    console.log('✅ Connected to MongoDB\n');

    const Publication = mongoose.model('Publication', publicationSchema);
    const Person = mongoose.model('Person', personSchema);
    const News = mongoose.model('News', newsSchema);
    const ResearchArea = mongoose.model('ResearchArea', researchAreaSchema);

    // Check if already seeded
    const pubCount = await Publication.countDocuments();
    if (pubCount > 0) {
      console.log('⚠️  Database already has data. Do you want to clear it first?');
      console.log('   To clear: node clearDatabase.js');
      console.log('   Then run this script again.\n');
      process.exit(0);
    }

    // Seed Publications
    console.log('📚 Adding publications...');
    await Publication.insertMany([
      {
        authors: 'Chen, E.; Mitchell, S.; Patel, P.; Walsh, J.',
        title: 'Hydrogen-Bonding Organocatalysts for Highly Enantioselective Michael Additions',
        journal: 'Journal of the American Chemical Society, 2025, 147, 12845-12856',
        year: '2025'
      },
      {
        authors: 'Zhang, M.; Anderson, J.; Walsh, J.',
        title: 'Aqueous-Phase Organocatalytic Aldol Reactions Using Bio-Derived Thiourea Catalysts',
        journal: 'Green Chemistry, 2025, 27, 3421-3430',
        year: '2025'
      }
    ]);
    console.log('   ✓ Added 2 publications\n');

    // Seed People
    console.log('👥 Adding team members...');
    await Person.insertMany([
      { name: 'Dr. Emily Chen', role: 'Postdoctoral Researcher', email: 'e.chen@nitbhopal.ac.in', category: 'postdoc' },
      { name: 'Dr. James Anderson', role: 'Postdoctoral Researcher', email: 'j.anderson@nitbhopal.ac.in', category: 'postdoc' },
      { name: 'Sarah Mitchell', role: 'PhD Candidate (4th Year)', email: 's.mitchell@nitbhopal.ac.in', category: 'phd' },
      { name: 'Michael Zhang', role: 'PhD Candidate (3rd Year)', email: 'm.zhang@nitbhopal.ac.in', category: 'phd' },
      { name: 'Thomas Murphy', role: 'Research Technician', email: 't.murphy@nitbhopal.ac.in', category: 'technician' }
    ]);
    console.log('   ✓ Added 5 team members\n');

    // Seed News
    console.log('📰 Adding news items...');
    await News.insertMany([
      {
        date: new Date('2025-10-08'),
        headline: 'Major Research Grant Awarded',
        content: 'Our group has been awarded a prestigious ₹750,000 research grant from the National Science Foundation to investigate novel organocatalytic cascades for complex molecule synthesis.',
        tag: 'Funding'
      },
      {
        date: new Date('2025-09-22'),
        headline: 'Best Poster Award at International Symposium',
        content: 'PhD candidate Sarah Mitchell received the Best Poster Award at the 15th International Symposium on Green Chemistry in Copenhagen.',
        tag: 'Award'
      }
    ]);
    console.log('   ✓ Added 2 news items\n');

    // Seed Research Areas
    console.log('🔬 Adding research areas...');
    await ResearchArea.insertMany([
      {
        title: 'Green & Sustainable Chemistry',
        description: 'Developing environmentally benign synthetic methodologies using renewable feedstocks, aqueous media, and energy-efficient processes. We aim to reduce chemical waste and eliminate hazardous substances from synthetic protocols.'
      },
      {
        title: 'Organocatalysis',
        description: 'Designing and synthesizing small organic molecules that catalyze asymmetric transformations with high enantioselectivity. Our work explores new catalytic scaffolds and activation modes for challenging chemical reactions.'
      },
      {
        title: 'Physical Organic Chemistry',
        description: 'Investigating reaction mechanisms and structure-reactivity relationships through computational and experimental methods. Understanding fundamental principles guides the rational design of more efficient catalysts.'
      }
    ]);
    console.log('   ✓ Added 3 research areas\n');

    console.log('✅ Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log('   - Publications: 2');
    console.log('   - Team Members: 5');
    console.log('   - News Items: 2');
    console.log('   - Research Areas: 3\n');
    
    console.log('🚀 Next steps:');
    console.log('   1. Start server: npm start');
    console.log('   2. Open browser: http://localhost:5000');
    console.log('   3. View your data!\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Connection closed.\n');
    process.exit();
  }
}

seedDatabase();