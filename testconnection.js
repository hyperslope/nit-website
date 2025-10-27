const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...\n');
    console.log('Connection string:', process.env.MONGODB_URI || 'mongodb://localhost:27017/green-chemistry-db');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/green-chemistry-db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ MongoDB Connected Successfully!\n');
    
    // Test collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📦 Available collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Count documents
    const Publication = mongoose.model('Publication', new mongoose.Schema({}, { strict: false }));
    const Person = mongoose.model('Person', new mongoose.Schema({}, { strict: false }));
    const News = mongoose.model('News', new mongoose.Schema({}, { strict: false }));
    const ResearchArea = mongoose.model('ResearchArea', new mongoose.Schema({}, { strict: false }));
    const Admin = mongoose.model('Admin', new mongoose.Schema({}, { strict: false }));
    
    const pubCount = await Publication.countDocuments();
    const peopleCount = await Person.countDocuments();
    const newsCount = await News.countDocuments();
    const researchCount = await ResearchArea.countDocuments();
    const adminCount = await Admin.countDocuments();
    
    console.log('\n📊 Document counts:');
    console.log(`   - Publications: ${pubCount}`);
    console.log(`   - People: ${peopleCount}`);
    console.log(`   - News: ${newsCount}`);
    console.log(`   - Research Areas: ${researchCount}`);
    console.log(`   - Admins: ${adminCount}`);
    
    if (adminCount === 0) {
      console.log('\n⚠️  WARNING: No admin users found!');
      console.log('   Run: node createAdmin.js to create an admin user');
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure MongoDB is running: net start MongoDB');
    console.log('2. Check your .env file for correct MONGODB_URI');
    console.log('3. Verify MongoDB is accessible on the specified port');
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Connection closed.\n');
    process.exit();
  }
}

testConnection();