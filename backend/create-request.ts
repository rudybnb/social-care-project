
import axios from 'axios';

const API_URL = 'https://social-care-backend.onrender.com/api/approvals';

async function createRequest() {
    const payload = {
        staffId: 'e99f9d49-603c-4e3f-9b23-7764f9c683dc', // Lauren Alecia
        staffName: 'Lauren Alecia',
        siteId: 'SITE_003',
        siteName: 'Erith Care Home',
        date: new Date().toISOString().split('T')[0]
    };

    try {
        console.log('Sending request:', payload);
        const response = await axios.post(API_URL, payload);
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error creating request:', error.response?.data || error.message);
    }
}

createRequest();
