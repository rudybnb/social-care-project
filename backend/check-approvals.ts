
import axios from 'axios';

const API_URL = 'https://social-care-backend.onrender.com/api/approvals';

async function checkApprovals() {
    try {
        console.log('Fetching all requests...');
        const all = await axios.get(API_URL);
        console.log('All requests:', all.data);

        console.log('\nFetching pending requests...');
        const pending = await axios.get(`${API_URL}?status=pending`);
        console.log('Pending requests:', pending.data);
    } catch (error) {
        console.error('Error fetching approvals:', error.message);
    }
}

checkApprovals();
