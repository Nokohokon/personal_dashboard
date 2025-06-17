#!/usr/bin/env node
const https = require('https');

async function addUserViaAPI() {
  console.log('Adding test@test.de to project via API...');
  
  // This would normally require authentication, but let's see what the API expects
  const postData = JSON.stringify({
    emails: ['test@test.de']
  });
  
  console.log('Would send POST request to: /api/projects/684eecdedd82941492bbe733/collaborators');
  console.log('With data:', postData);
  console.log('\nNote: This requires a valid session. Please add the user via the web interface instead.');
  console.log('\nAlternatively, run the direct database script:');
  console.log('node add-test-user.js');
}

addUserViaAPI();
