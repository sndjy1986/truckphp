// server.js - Node.js/Express backend
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = 'truck_data.json';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve your HTML/CSS/JS files

// Default truck data
const DEFAULT_DATA = {
    trucks: [
        { id: 'Med-0', name: 'Med-0', location: 'City // HQ', status: 'available', timerEndTime: null },
        { id: 'Med-1', name: 'Med-1', location: 'City // HQ', status: 'available', timerEndTime: null },
        { id: 'Med-2', name: 'Med-2', location: 'Rock Springs', status: 'available', timerEndTime: null },
        { id: 'Med-3', name: 'Med-3', location: 'Homeland Park', status: 'available', timerEndTime: null },
        { id: 'Med-4', name: 'Med-4', location: 'Williamston', status: 'available', timerEndTime: null },
        { id: 'Med-5', name: 'Med-5', location: 'Rock Springs', status: 'available', timerEndTime: null },
        { id: 'Med-6', name: 'Med-6', location: 'Iva', status: 'available', timerEndTime: null },
        { id: 'Med-7', name: 'Med-7', location: 'Pendleton', status: 'available', timerEndTime: null },
        { id: 'Med-8', name: 'Med-8', location: 'Townville', status: 'available', timerEndTime: null },
        { id: 'Med-9', name: 'Med-9', location: 'Centerville', status: 'available', timerEndTime: null },
        { id: 'Med-11', name: 'Med-11', location: 'City // HQ', status: 'available', timerEndTime: null },
        { id: 'Med-13', name: 'Med-13', location: 'Honea Path', status: 'available', timerEndTime: null },
        { id: 'Med-14', name: 'Med-14', location: 'Piedmont', status: 'available', timerEndTime: null },
        { id: 'Med-15', name: 'Med-15', location: 'Wren', status: 'available', timerEndTime: null },
        { id: 'Med-16', name: 'Med-16', location: 'Williamston', status: 'available', timerEndTime: null },
        { id: 'Med-17', name: 'Med-17', location: 'City // HQ', status: 'available', timerEndTime: null },
        { id: 'Med-18', name: 'Med-18', location: 'City // HQ', status: 'available', timerEndTime: null }
    ],
    timerDefaults: {
        atDestination: 20,
        logistics: 10
    },
    lastUpdated: new Date().toISOString()
};

// Helper function to read data file
async function readDataFile() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, create it with default data
            await writeDataFile(DEFAULT_DATA);
            return DEFAULT_DATA;
        }
        throw error;
    }
}

// Helper function to write data file
async function writeDataFile(data) {
    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Routes

// Get truck data
app.get('/api/trucks', async (req, res) => {
    try {
        const data = await readDataFile();
        res.json(data);
    } catch (error) {
        console.error('Error reading truck data:', error);
        res.status(500).json({ error: 'Failed to read truck data' });
    }
});

// Save truck data
app.post('/api/trucks', async (req, res) => {
    try {
        const { trucks, timerDefaults } = req.body;
        
        if (!trucks || !Array.isArray(trucks)) {
            return res.status(400).json({ error: 'Invalid truck data' });
        }

        const dataToSave = {
            trucks: trucks.map(truck => ({
                id: truck.id,
                name: truck.name,
                location: truck.location,
                status: truck.status,
                timerEndTime: truck.timerEndTime
            })),
            timerDefaults: timerDefaults || DEFAULT_DATA.timerDefaults
        };

        await writeDataFile(dataToSave);
        
        res.json({ 
            success: true, 
            message: 'Truck data saved successfully',
            lastUpdated: dataToSave.lastUpdated
        });

    } catch (error) {
        console.error('Error saving truck data:', error);
        res.status(500).json({ error: 'Failed to save truck data' });
    }
});

// Get server status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Backup endpoint
app.get('/api/backup', async (req, res) => {
    try {
        const data = await readDataFile();
        res.setHeader('Content-Disposition', 'attachment; filename=truck-backup.json');
        res.setHeader('Content-Type', 'application/json');
        res.json(data);
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

// Restore from backup
app.post('/api/restore', async (req, res) => {
    try {
        const backupData = req.body;
        
        if (!backupData.trucks || !Array.isArray(backupData.trucks)) {
            return res.status(400).json({ error: 'Invalid backup data' });
        }

        await writeDataFile(backupData);
        
        res.json({
            success: true,
            message: 'Data restored from backup successfully'
        });

    } catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({ error: 'Failed to restore backup' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚛 Truck Dispatch Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api/trucks`);
});

module.exports = app;