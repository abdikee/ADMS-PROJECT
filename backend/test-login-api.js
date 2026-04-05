import fetch from 'node-fetch';

async function testLoginAPI() {
  try {
    console.log('=================================');
    console.log('Testing Login API Endpoint');
    console.log('=================================\n');

    const apiUrl = 'http://localhost:5000/api/auth/login';
    
    console.log('Sending POST request to:', apiUrl);
    console.log('Credentials: { username: "admin", password: "admin123" }\n');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    console.log('Response Status:', response.status, response.statusText);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Login Successful!');
      console.log('\nUser Data:');
      console.log(JSON.stringify(data.user, null, 2));
      console.log('\nToken:', data.token.substring(0, 50) + '...');
    } else {
      console.log('\n❌ Login Failed!');
      console.log('Error:', data.error || data.message);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Backend server is not running!');
      console.log('Start the backend server with:');
      console.log('  cd backend');
      console.log('  npm start');
    }
  }
}

testLoginAPI();
