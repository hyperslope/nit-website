const http = require('http');

console.log('🔍 Testing API Connection...\n');

// Test 1: Can we reach the server?
function testServerRoot() {
  return new Promise((resolve) => {
    console.log('[Test 1] Checking http://localhost:5000 ...');
    
    const req = http.get('http://localhost:5000', (res) => {
      console.log(`✅ Server responds with status: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.log('❌ Cannot reach server:', error.message);
      console.log('\n💡 Solution: Make sure "npm start" is running!\n');
      resolve(false);
    });

    setTimeout(() => {
      req.destroy();
      console.log('❌ Connection timeout\n');
      resolve(false);
    }, 3000);
  });
}

// Test 2: Can we reach the API?
function testAPIEndpoint() {
  return new Promise((resolve) => {
    console.log('\n[Test 2] Checking http://localhost:5000/api/publications ...');
    
    const req = http.get('http://localhost:5000/api/publications', (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ API works! Received ${json.length} publications`);
          console.log('Data:', JSON.stringify(json, null, 2));
          resolve(true);
        } catch (e) {
          console.log('❌ API responded but not with JSON');
          console.log('Response:', data.substring(0, 200));
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Cannot reach API:', error.message);
      resolve(false);
    });

    setTimeout(() => {
      req.destroy();
      console.log('❌ API timeout\n');
      resolve(false);
    }, 3000);
  });
}

// Test 3: Check other endpoints
async function testOtherEndpoints() {
  console.log('\n[Test 3] Checking other API endpoints...');
  
  const endpoints = [
    '/api/people',
    '/api/news',
    '/api/research-areas'
  ];
  
  for (const endpoint of endpoints) {
    await new Promise((resolve) => {
      const req = http.get(`http://localhost:5000${endpoint}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            console.log(`✅ ${endpoint} - Found ${json.length} items`);
          } catch (e) {
            console.log(`⚠️  ${endpoint} - Invalid response`);
          }
          resolve();
        });
      });
      
      req.on('error', () => {
        console.log(`❌ ${endpoint} - Failed`);
        resolve();
      });
      
      setTimeout(() => {
        req.destroy();
        resolve();
      }, 3000);
    });
  }
}

async function runTests() {
  const serverOk = await testServerRoot();
  
  if (!serverOk) {
    console.log('\n' + '='.repeat(50));
    console.log('❌ SERVER IS NOT RUNNING!\n');
    console.log('Steps to fix:');
    console.log('1. Open a NEW terminal');
    console.log('2. Navigate to your project:');
    console.log('   cd C:\\Users\\gokul\\green-chemistry-website');
    console.log('3. Run: npm start');
    console.log('4. Keep that terminal open');
    console.log('5. Run this test again\n');
    console.log('='.repeat(50) + '\n');
    process.exit(1);
  }
  
  const apiOk = await testAPIEndpoint();
  await testOtherEndpoints();
  
  console.log('\n' + '='.repeat(50));
  
  if (serverOk && apiOk) {
    console.log('✅ API IS WORKING!\n');
    console.log('The problem might be in your HTML/JavaScript.');
    console.log('\nNext step: Check browser console');
    console.log('1. Open: http://localhost:5000');
    console.log('2. Press F12');
    console.log('3. Check Console tab for errors\n');
  } else {
    console.log('❌ API IS NOT WORKING!\n');
    console.log('Check if server is running properly.');
    console.log('Look at the terminal running "npm start" for errors.\n');
  }
  
  console.log('='.repeat(50) + '\n');
  process.exit();
}

runTests();