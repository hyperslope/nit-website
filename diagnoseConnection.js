const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Running Full Diagnostics...\n');
console.log('='.repeat(50));

// Test 1: Check MongoDB
async function testMongoDB() {
  console.log('\n[1/4] Testing MongoDB Connection...');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/green-chemistry-db');
    console.log('✅ MongoDB is connected');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections`);
    
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    console.log('   Fix: Run "net start MongoDB" as administrator');
    return false;
  }
}

// Test 2: Check if server is running
function testServer() {
  return new Promise((resolve) => {
    console.log('\n[2/4] Testing Server Connection...');
    
    const req = http.get('http://localhost:5000', (res) => {
      console.log(`✅ Server is running (Status: ${res.statusCode})`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.log('❌ Server is NOT running');
      console.log('   Fix: Run "npm start" in your project folder');
      resolve(false);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      console.log('❌ Server connection timeout');
      resolve(false);
    });
  });
}

// Test 3: Check API endpoints
function testAPI() {
  return new Promise((resolve) => {
    console.log('\n[3/4] Testing API Endpoints...');
    
    const req = http.get('http://localhost:5000/api/publications', (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ API is responding (Found ${json.length} publications)`);
          resolve(true);
        } catch (e) {
          console.log('⚠️  API responded but not with JSON');
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      console.log('❌ API is not accessible');
      console.log('   Fix: Make sure server is running with "npm start"');
      resolve(false);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      console.log('❌ API connection timeout');
      resolve(false);
    });
  });
}

// Test 4: Check file structure
function testFileStructure() {
  console.log('\n[4/4] Checking File Structure...');
  const fs = require('fs');
  const path = require('path');
  
  const files = [
    'server.js',
    'package.json',
    '.env',
    'public/index.html'
  ];
  
  let allGood = true;
  
  files.forEach(file => {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} is missing`);
      if (file === 'public/index.html') {
        console.log('   Fix: Move index.html to public folder');
      }
      allGood = false;
    }
  });
  
  return allGood;
}

// Run all tests
async function runDiagnostics() {
  const mongoOK = await testMongoDB();
  const serverOK = await testServer();
  const apiOK = await testAPI();
  const filesOK = testFileStructure();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 DIAGNOSTIC SUMMARY:\n');
  
  console.log(`MongoDB:       ${mongoOK ? '✅ Working' : '❌ Not Working'}`);
  console.log(`Server:        ${serverOK ? '✅ Working' : '❌ Not Working'}`);
  console.log(`API:           ${apiOK ? '✅ Working' : '❌ Not Working'}`);
  console.log(`File Structure: ${filesOK ? '✅ Working' : '❌ Not Working'}`);
  
  console.log('\n' + '='.repeat(50));
  
  if (mongoOK && serverOK && apiOK && filesOK) {
    console.log('\n🎉 Everything looks good!');
    console.log('\n✅ Your website should work at: http://localhost:5000\n');
  } else {
    console.log('\n⚠️  Issues Found!\n');
    console.log('Follow the fixes shown above, then run this script again.\n');
    
    if (!mongoOK) {
      console.log('Step 1: Start MongoDB');
      console.log('   → Open Command Prompt as Administrator');
      console.log('   → Run: net start MongoDB\n');
    }
    
    if (!filesOK) {
      console.log('Step 2: Fix file structure');
      console.log('   → Create "public" folder');
      console.log('   → Move index.html into public folder\n');
    }
    
    if (!serverOK || !apiOK) {
      console.log('Step 3: Start server');
      console.log('   → Run: npm start');
      console.log('   → Keep the terminal open\n');
    }
  }
  
  process.exit();
}

runDiagnostics();