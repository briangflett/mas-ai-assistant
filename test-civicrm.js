const axios = require('axios');

async function testCiviCRMAPI() {
  try {
    const response = await axios.get('https://masdemo.localhost/wp-content/plugins/civicrm/civicrm/extern/rest.php', {
      params: {
        entity: 'Contact',
        action: 'getcount',
        api_key: 'sEXyubMK0CNrNp8lkCMfDdfP',
        key: '69d785fc05f6607276962b6c00bcfc8b',
        json: 1
      },
      timeout: 10000
    });
    
    console.log('CiviCRM API Response:', response.data);
  } catch (error) {
    console.error('CiviCRM API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCiviCRMAPI();