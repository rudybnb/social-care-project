import { Router, Request, Response } from 'express';

const router: Router = Router();

// Test credentials (firstname / firstname123)
const TEST_CREDENTIALS: { [key: string]: { password: string; role: string; staffId?: number; name: string } } = {
  // Admin
  'admin': { password: 'admin123', role: 'admin', name: 'Administrator' },
  'manager': { password: 'Manager123', role: 'admin', name: 'Manager' },
  
  // Staff with Annual Leave
  'lauren': { password: 'Lauren123', role: 'worker', staffId: 7, name: 'Lauren Alecia' },
  'Lauren': { password: 'Lauren123', role: 'worker', staffId: 7, name: 'Lauren Alecia' },
  'melissa': { password: 'Melissa123', role: 'worker', staffId: 8, name: 'Melissa Blake' },
  'Melissa': { password: 'Melissa123', role: 'worker', staffId: 8, name: 'Melissa Blake' },
  'irina': { password: 'Irina123', role: 'worker', staffId: 2, name: 'Irina Mitrovici' },
  'Irina': { password: 'Irina123', role: 'worker', staffId: 2, name: 'Irina Mitrovici' },
  
  // Other Workers
  'evander': { password: 'Evander123', role: 'worker', staffId: 3, name: 'Evander Fisher' },
  'Evander': { password: 'Evander123', role: 'worker', staffId: 3, name: 'Evander Fisher' },
  'narfisa': { password: 'Narfisa123', role: 'worker', staffId: 4, name: 'Narfisa Patel' },
  'Narfisa': { password: 'Narfisa123', role: 'worker', staffId: 4, name: 'Narfisa Patel' },
  'singita': { password: 'Singita123', role: 'worker', staffId: 5, name: 'Singita Zoe' },
  'Singita': { password: 'Singita123', role: 'worker', staffId: 5, name: 'Singita Zoe' },
  'rudy': { password: 'Rudy123', role: 'worker', staffId: 9, name: 'Rudy Diedericks' },
  'Rudy': { password: 'Rudy123', role: 'worker', staffId: 9, name: 'Rudy Diedericks' }
};

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check credentials (case-insensitive username)
    const user = TEST_CREDENTIALS[username] || TEST_CREDENTIALS[username.toLowerCase()] || TEST_CREDENTIALS[username.charAt(0).toUpperCase() + username.slice(1)];
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Return user info
    res.json({
      success: true,
      user: {
        username,
        name: user.name,
        role: user.role,
        staffId: user.staffId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/verify - Verify if user is logged in
router.get('/verify', async (req: Request, res: Response) => {
  // For now, just return success (no session management yet)
  res.json({ success: true });
});

export default router;

