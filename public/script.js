// script.js - Updated with server integration and performance improvements

// --- 1. Server Configuration ---
const SERVER_CONFIG = {
    baseUrl: window.location.origin + '/', // Automatically uses current domain
    saveEndpoint: 'api/trucks',
    loadEndpoint: 'api/trucks'
};

// --- 2. Centralized Truck Data ---
// Initial default trucks (used if server has no data)
let trucks = [
    { id: 'Med-0', name: 'Med-0', location: 'City // HQ', status: 'available', timer: null, timerEndTime: null },
    { id: 'Med-1', name: 'Med-1', location: 'City // HQ', status: 'available', timer: null, timerEndTime: null },
    { id: 'Med-2', name: 'Med-2', location: 'Rock Springs', status: 'available', timer: null, timerEndTime: null },
    { id: 'Med-3', name: 'Med-3', location: 'Homeland Park', status: 'available', timer: null, timerEndTime: null },
    { id: 'Med-4', name: 'Med-4', location: 'Williamston', status: 'available', timer: null, timerEndTime: null },
    { id: 'Med-5', name: 'Med-5', location: 'Rock Springs', status: 'available', timer: null, timerEndTime: null },
    { id: 'Med-6', name: 'Med-6', location: 'Iva', status: 'available', timer: null, timerEndTime: null },
    { id: 'Med-7', name: 'Med-7', location: 'Pendleton', status: 'available', timer: null, timerEndTime: null },
    { id: 'Med-8', name: 'Med-8', location: 'Townville', status: 'available', timer: null, timerEndTime: null },
    { id: 'Med-9', name: 'Med-9', location: 'Centerville', status: 'available', timer: null, timerEndTime: null},
    { id: 'Med-11', name: 'Med-11', location: 'City // HQ', status: 'available', timer: null, timerEndTime: null},
    { id: 'Med-13', name: 'Med-13', location: 'Honea Path', status: 'available', timer: null, timerEndTime: null },
    { id: 'Med-14', name: 'Med-14', location: 'Piedmont', status: 'available', timer: null, timerEndTime: null },
    { id: 'Med-15', name: 'Med-15', location: 'Wren', status: 'available', timer: null, timerEndTime: null },
    { id: 'Med-16', name: 'Med-16', location: 'Williamston', status: 'available', timer: null, timerEndTime: null },
    { id: 'Med-17', name: 'Med-17', location: 'City // HQ', status: 'available', timer: null, timerEndTime: null },
    { id: 'Med-18', name: 'Med-18', location: 'City // HQ', status: 'available', timer: null, timerEndTime: null },
];

// Define the order for right-click menu and status display
const allTruckStatuses = ['available', 'dispatched', 'onScene', 'enRouteToDestination', 'atDestination', 'logistics', 'unavailable'];

// Define the cycle order for left-click cycling (excluding 'posted')
const statusCycleOrder = ['available', 'dispatched', 'onScene', 'enRouteToDestination', 'atDestination'];

// Default timer durations (in minutes)
let timerDefaults = {
    atDestination: 20, // minutes
    logistics: 10    // minutes
};

// Variable to hold the ID of the truck currently being edited
let editingTruckId = null;

// --- 3. DOM Elements ---
const trucksContainer = document.getElementById('trucksContainer');
const availableTruckCountSpan = document.getElementById('availableTruckCount');
const adminPanelToggleBtn = document.getElementById('adminPanelToggle');
const adminPanel = document.getElementById('adminPanel');
const closeAdminPanelBtn = document.getElementById('closeAdminPanel');
const adminTruckList = document.getElementById('adminTruckList');
const destinationTimeInput = document.getElementById('destinationTime');
const logisticsTimeInput = document.getElementById('logisticsTime');
const saveTimerDefaultsBtn = document.getElementById('saveTimerDefaults');
const darkModeToggleBtn = document.getElementById('darkModeToggle');

// Add/Edit Truck Form Elements
const truckFormTitle = document.getElementById('truckFormTitle');
const truckIdInput = document.getElementById('truckIdInput');
const truckNameInput = document.getElementById('truckNameInput');
const truckLocationInput = document.getElementById('truckLocationInput');
const truckStatusSelect = document.getElementById('truckStatusSelect');
const saveTruckBtn = document.getElementById('saveTruckBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Data Management Elements
const exportDataBtn = document.getElementById('exportDataBtn');
const importFileInput = document.getElementById('importFileInput');

// Custom Modal Elements
const customModal = document.getElementById('customModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');

// Custom Context Menu Elements
const customContextMenu = document.getElementById('customContextMenu');
let activeTruckIdForContextMenu = null;

// --- 4. Server Communication Functions ---

/**
 * Shows a custom modal dialog.
 */
function showModal(message, type = 'alert', callback = () => {}) {
    modalTitle.textContent = type === 'alert' ? 'Notification' : 'Confirmation';
    modalMessage.textContent = message;
    customModal.classList.add('active');

    if (type === 'confirm') {
        customModal.classList.remove('alert-type');
        modalConfirmBtn.onclick = () => {
            customModal.classList.remove('active');
            callback(true);
        };
        modalCancelBtn.onclick = () => {
            customModal.classList.remove('active');
            callback(false);
        };
    } else {
        customModal.classList.add('alert-type');
        modalConfirmBtn.onclick = () => {
            customModal.classList.remove('active');
            callback();
        };
    }
}

/**
 * Shows loading indicator
 */
function showLoadingMessage(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingIndicator';
    loadingDiv.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    background: var(--modal-bg); padding: 20px; border-radius: 8px;
                    box-shadow: 0 4px 12px var(--box-shadow-dark); z-index: 1001;
                    color: var(--modal-text);">
            <div style="text-align: center;">
                <div style="border: 3px solid #f3f3f3; border-top: 3px solid var(--button-primary);
                           border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite;
                           margin: 0 auto 10px;"></div>
                ${message}
            </div>
        </div>
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5); z-index: 1000;"></div>
    `;

    if (!document.querySelector('#spinnerCSS')) {
        const style = document.createElement('style');
        style.id = 'spinnerCSS';
        style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }

    document.body.appendChild(loadingDiv);
    return loadingDiv;
}

/**
 * Hides loading indicator
 */
function hideLoadingMessage(loadingElement) {
    if (loadingElement && loadingElement.parentNode) {
        loadingElement.parentNode.removeChild(loadingElement);
    }
    const existing = document.getElementById('loadingIndicator');
    if (existing) {
        existing.remove();
    }
}

/**
 * Updates last sync indicator
 */
function updateLastSyncIndicator(timestamp) {
    let indicator = document.getElementById('lastSyncIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'lastSyncIndicator';
        indicator.style.cssText = `
            position: fixed; bottom: 10px; right: 10px;
            background: var(--button-secondary); color: white;
            padding: 5px 10px; border-radius: 15px;
            font-size: 0.8em; z-index: 100;
            opacity: 0.8;
        `;
        document.body.appendChild(indicator);
    }
    indicator.textContent = `Last sync: ${timestamp}`;
}

/**
 * Saves data to server
 */
async function saveData() {
    try {
        const loadingMsg = showLoadingMessage('Saving data...');

        const dataToSave = {
            trucks: trucks.map(truck => ({
                id: truck.id,
                name: truck.name,
                location: truck.location,
                status: truck.status,
                timerEndTime: truck.timerEndTime
            })),
            timerDefaults: timerDefaults,
            clientTimestamp: Date.now()
        };

        const response = await fetch(SERVER_CONFIG.baseUrl + SERVER_CONFIG.saveEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSave)
        });

        hideLoadingMessage(loadingMsg);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Data saved successfully:', result);
            updateLastSyncIndicator('Just now');

            // Save to localStorage as backup
            try {
                localStorage.setItem('truckDispatchBackup', JSON.stringify(dataToSave));
            } catch (e) {
                console.warn('Could not save local backup:', e);
            }

        } else {
            throw new Error(`Server responded with status: ${response.status}`);
        }

    } catch (error) {
        hideLoadingMessage();
        console.error('❌ Error saving data to server:', error);

        // Try to save to localStorage as fallback
        try {
            const backupData = {
                trucks: trucks.map(truck => ({
                    id: truck.id,
                    name: truck.name,
                    location: truck.location,
                    status: truck.status,
                    timerEndTime: truck.timerEndTime
                })),
                timerDefaults: timerDefaults,
                clientTimestamp: Date.now()
            };
            localStorage.setItem('truckDispatchBackup', JSON.stringify(backupData));
            updateLastSyncIndicator('Local backup');
            showModal('Server unavailable. Data saved locally as backup.', 'alert');
        } catch (localError) {
            showModal('Failed to save data to server and locally. Please try again.', 'alert');
        }
    }
}

/**
 * Loads data from server
 */
async function loadData() {
    try {
        const loadingMsg = showLoadingMessage('Loading data...');

        const response = await fetch(SERVER_CONFIG.baseUrl + SERVER_CONFIG.loadEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        hideLoadingMessage(loadingMsg);

        if (response.ok) {
            const serverData = await response.json();
            console.log('✅ Data loaded from server:', serverData);

            if (serverData.trucks && Array.isArray(serverData.trucks)) {
                trucks = serverData.trucks.map(truck => ({
                    ...truck,
                    timer: null
                }));
            }

            if (serverData.timerDefaults) {
                timerDefaults = { ...timerDefaults, ...serverData.timerDefaults };
            }

            const lastUpdated = serverData.lastUpdated ?
                new Date(serverData.lastUpdated).toLocaleString() : 'Just now';
            updateLastSyncIndicator(lastUpdated);

        } else {
            throw new Error(`Server responded with status: ${response.status}`);
        }

    } catch (error) {
        hideLoadingMessage();
        console.error('❌ Error loading data from server:', error);

        // Try to load from localStorage backup
        try {
            const backupData = localStorage.getItem('truckDispatchBackup');
            if (backupData) {
                const parsedBackup = JSON.parse(backupData);

                if (parsedBackup.trucks) {
                    trucks = parsedBackup.trucks.map(truck => ({
                        ...truck,
                        timer: null
                    }));
                }

                if (parsedBackup.timerDefaults) {
                    timerDefaults = { ...timerDefaults, ...parsedBackup.timerDefaults };
                }

                updateLastSyncIndicator('Local backup');
                showModal('Server unavailable. Loaded backup data from this device.', 'alert');
            } else {
                updateLastSyncIndicator('Using defaults');
                showModal('Could not load data from server. Using defaults.', 'alert');
            }
        } catch (localError) {
            console.error('Could not load backup data:', localError);
            updateLastSyncIndicator('Using defaults');
            showModal('Could not load data. Using default values.', 'alert');
        }
    }
}

/**
 * Manual sync with server
 */
async function syncWithServer() {
    showModal('Sync with server? This will reload data from the server.', 'confirm', async (confirmed) => {
        if (confirmed) {
            await loadData();
            renderTrucks();
            renderAdminTruckList();
        }
    });
}

// --- 5. UI Rendering and Logic ---

function renderTrucks() {
    trucksContainer.innerHTML = '';
    let availableCount = 0;

    trucks.forEach(truck => {
        const box = document.createElement('div');
        box.classList.add('status-box');
        box.dataset.truckId = truck.id;
        trucksContainer.appendChild(box);
        if (truck.status === 'available') {
            availableCount++;
        }
    });

    updateSystemLevel(availableCount);
    updateTrucksDisplay(); // Initial update
}


function updateTrucksDisplay() {
    let availableCount = 0;
    trucks.forEach(truck => {
        const box = trucksContainer.querySelector(`.status-box[data-truck-id="${truck.id}"]`);
        if (!box) return;

        // Update status class
        box.className = 'status-box ' + truck.status;

        let displayStatus = truck.status;
        switch (truck.status) {
            case 'dispatched':
                displayStatus = 'En Route';
                break;
            case 'onScene':
                displayStatus = 'On Scene';
                break;
            case 'enRouteToDestination':
                displayStatus = 'En Route to Destination';
                break;
            case 'atDestination':
                displayStatus = 'At Destination';
                break;
        }

        let content = `<p><strong>${truck.id}</strong></p>`;
        content += `<p>${truck.name} - ${displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}</p>`;

        let timerDisplay = '';
        if ((truck.status === 'atDestination' || truck.status === 'logistics') && truck.timerEndTime) {
            const timeLeftMs = truck.timerEndTime - Date.now();
            const displayPrefix = timeLeftMs > 0 ? '' : '+';
            const totalSeconds = Math.floor(Math.abs(timeLeftMs) / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            timerDisplay = `Time: ${displayPrefix}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (timeLeftMs > 0 && timeLeftMs < 60000) {
                box.classList.add('flash-alert');
            } else {
                box.classList.remove('flash-alert');
            }
        } else {
            box.classList.remove('flash-alert');
        }

        content += `<p class="timer">${timerDisplay}</p>`;
        box.innerHTML = content;

        if (truck.status === 'available') {
            availableCount++;
        }
    });
    updateSystemLevel(availableCount);
}


function updateSystemLevel(count) {
    availableTruckCountSpan.textContent = count;
}

function updateTruckStatus(truckId, newStatus) {
    const truckIndex = trucks.findIndex(truck => truck.id === truckId);
    if (truckIndex > -1) {
        const truck = trucks[truckIndex];
        truck.status = newStatus;

        if (newStatus === 'atDestination' || newStatus === 'logistics') {
            const durationInMinutes = timerDefaults[newStatus];
            truck.timerEndTime = Date.now() + (durationInMinutes * 60 * 1000);
        } else {
            truck.timerEndTime = null;
        }

        updateTrucksDisplay();
        renderAdminTruckList();
        saveData();
    }
}


function addOrUpdateTruck() {
    const id = truckIdInput.value.trim();
    const name = truckNameInput.value.trim();
    const location = truckLocationInput.value.trim();
    const status = truckStatusSelect.value;

    if (!id || !name || !location) {
        showModal('Please fill in all truck details.', 'alert');
        return;
    }

    if (editingTruckId) {
        const truckIndex = trucks.findIndex(truck => truck.id === editingTruckId);
        if (truckIndex > -1) {
            trucks[truckIndex].id = id;
            trucks[truckIndex].name = name;
            trucks[truckIndex].location = location;
            if (trucks[truckIndex].status !== status) {
                 updateTruckStatus(editingTruckId, status);
            }
        }
        editingTruckId = null;
        truckFormTitle.textContent = 'Add New Truck';
        saveTruckBtn.textContent = 'Add Truck';
        cancelEditBtn.style.display = 'none';
        truckIdInput.disabled = false;
    } else {
        if (trucks.some(truck => truck.id === id)) {
            showModal('Truck with this ID already exists. Please use a unique ID.', 'alert');
            return;
        }
        const newTruck = { id, name, location, status, timer: null, timerEndTime: null };
        trucks.push(newTruck);
        if (status === 'atDestination' || status === 'logistics') {
            updateTruckStatus(id, status);
        }
    }

    truckIdInput.value = '';
    truckNameInput.value = '';
    truckLocationInput.value = '';
    truckStatusSelect.value = 'available';

    renderTrucks();
    renderAdminTruckList();
    saveData();
}

function editTruck(truckId) {
    const truck = trucks.find(t => t.id === truckId);
    if (truck) {
        editingTruckId = truck.id;
        truckFormTitle.textContent = `Edit Truck: ${truck.name} (ID: ${truck.id})`;
        truckIdInput.value = truck.id;
        truckIdInput.disabled = false; // Allow editing ID
        truckNameInput.value = truck.name;
        truckLocationInput.value = truck.location;
        truckStatusSelect.value = truck.status;
        saveTruckBtn.textContent = 'Update Truck';
        cancelEditBtn.style.display = 'inline-block';
    }
}

function resetTruckForm() {
    editingTruckId = null;
    truckFormTitle.textContent = 'Add New Truck';
    truckIdInput.value = '';
    truckIdInput.disabled = false;
    truckNameInput.value = '';
    truckLocationInput.value = '';
    truckStatusSelect.value = 'available';
    saveTruckBtn.textContent = 'Add Truck';
    cancelEditBtn.style.display = 'none';
}

function removeTruck(truckId) {
    trucks = trucks.filter(truck => truck.id !== truckId);
    renderTrucks();
    renderAdminTruckList();
    if (editingTruckId === truckId) {
        resetTruckForm();
    }
    saveData();
}

function renderAdminTruckList() {
    adminTruckList.innerHTML = '<h3>Manage Existing Trucks</h3>';
    if (trucks.length === 0) {
        adminTruckList.innerHTML += '<p>No trucks currently in the system.</p>';
        return;
    }

    trucks.forEach(truck => {
        const item = document.createElement('div');
        item.classList.add('admin-truck-item');

        let displayStatus = truck.status;
        switch (truck.status) {
            case 'dispatched':
                displayStatus = 'En Route';
                break;
            case 'onScene':
                displayStatus = 'On Scene';
                break;
            case 'enRouteToDestination':
                displayStatus = 'En Route to Destination';
                break;
            case 'atDestination':
                displayStatus = 'At Destination';
                break;
        }

        item.innerHTML = `
            <span><strong>${truck.id}</strong> - ${truck.name} <span class="truck-details">(${truck.location ? truck.location + ' - ' : ''}Status: ${displayStatus})</span></span>
            <div class="controls">
                <button class="edit-truck" data-id="${truck.id}">Edit</button>
                <button class="take-down" data-id="${truck.id}">Take Down</button>
            </div>
        `;
        adminTruckList.appendChild(item);
    });

    adminTruckList.querySelectorAll('.edit-truck').forEach(button => {
        button.addEventListener('click', (e) => editTruck(e.target.dataset.id));
    });
    adminTruckList.querySelectorAll('.take-down').forEach(button => {
        button.addEventListener('click', (e) => {
            showModal(`Are you sure you want to take down ${e.target.dataset.id}? This cannot be undone.`, 'confirm', (confirmed) => {
                if (confirmed) {
                    removeTruck(e.target.dataset.id);
                }
            });
        });
    });
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
}

function applyDarkModePreference() {
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }
}

function exportTrucksToJson() {
    const exportableTrucks = trucks.map(({ id, name, location, status, timerEndTime }) => ({
        id, name, location, status, timerEndTime
    }));
    const data = {
        trucks: exportableTrucks,
        timerDefaults: timerDefaults
    };
    const jsonString = JSON.stringify(data, null, 2);

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'truck_dispatch_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showModal('Truck data exported successfully!', 'alert');
}

function importTrucksFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);

            if (!importedData || !Array.isArray(importedData.trucks) || typeof importedData.timerDefaults !== 'object') {
                showModal('Invalid JSON file format.', 'alert');
                return;
            }

            showModal('Importing new data will overwrite current truck data. Continue?', 'confirm', (confirmed) => {
                if (confirmed) {
                    trucks = importedData.trucks.map(t => ({
                        id: t.id,
                        name: t.name,
                        location: t.location,
                        status: t.status,
                        timer: null,
                        timerEndTime: t.timerEndTime
                    }));
                    timerDefaults = importedData.timerDefaults;

                    if (timerDefaults.destination && !timerDefaults.atDestination) {
                        timerDefaults.atDestination = timerDefaults.destination;
                        delete timerDefaults.destination;
                    } else if (timerDefaults.enRouteToDestination && !timerDefaults.atDestination) {
                        timerDefaults.atDestination = timerDefaults.enRouteToDestination;
                        delete timerDefaults.enRouteToDestination;
                    }

                    renderTrucks();
                    renderAdminTruckList();
                    destinationTimeInput.value = timerDefaults.atDestination;
                    logisticsTimeInput.value = timerDefaults.logistics;

                    showModal('Truck data imported successfully!', 'alert');
                    saveData();
                }
            });

        } catch (error) {
            console.error("Error importing JSON:", error);
            showModal('Failed to read or parse JSON file.', 'alert');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function showCustomContextMenu(event, truckId) {
    event.preventDefault();
    activeTruckIdForContextMenu = truckId;

    customContextMenu.innerHTML = '';

    const statusDisplayNames = {
        available: 'Available',
        dispatched: 'En Route',
        onScene: 'On Scene',
        enRouteToDestination: 'En Route to Destination',
        atDestination: 'At Destination',
        logistics: 'Logistics',
        unavailable: 'Unavailable'
    };

    allTruckStatuses.forEach(status => {
        const menuItem = document.createElement('div');
        menuItem.classList.add('context-menu-item');
        menuItem.textContent = statusDisplayNames[status];
        menuItem.dataset.status = status;

        menuItem.addEventListener('click', () => {
            updateTruckStatus(activeTruckIdForContextMenu, status);
            hideCustomContextMenu();
        });
        customContextMenu.appendChild(menuItem);
    });

    customContextMenu.style.left = `${event.clientX}px`;
    customContextMenu.style.top = `${event.clientY}px`;
    customContextMenu.classList.add('active');
}

function hideCustomContextMenu() {
    customContextMenu.classList.remove('active');
    activeTruckIdForContextMenu = null;
}

function addSyncButton() {
    const syncButton = document.createElement('button');
    syncButton.textContent = '🔄 Sync';
    syncButton.onclick = syncWithServer;
    syncButton.style.cssText = `
        padding: 10px 20px; font-size: 1em; color: white; border: none;
        border-radius: 5px; cursor: pointer; margin: 0 5px;
        background-color: var(--button-info);
        transition: background-color 0.3s ease;
    `;
    syncButton.onmouseover = () => syncButton.style.backgroundColor = 'var(--button-info-hover)';
    syncButton.onmouseout = () => syncButton.style.backgroundColor = 'var(--button-info)';

    const header = document.querySelector('header');
    header.appendChild(syncButton);
}

// --- 6. Event Listeners ---

document.addEventListener('DOMContentLoaded', async () => {
    applyDarkModePreference();

    await loadData();
    renderTrucks();
    addSyncButton();
    
    // Global timer for UI updates
    setInterval(updateTrucksDisplay, 1000);

    trucksContainer.addEventListener('click', (event) => {
        const targetBox = event.target.closest('.status-box');
        if (targetBox) {
            const truckId = targetBox.dataset.truckId;
            const truckIndex = trucks.findIndex(truck => truck.id === truckId);
            if (truckIndex > -1) {
                const currentStatus = trucks[truckIndex].status;
                if (statusCycleOrder.includes(currentStatus)) {
                    const currentIndex = statusCycleOrder.indexOf(currentStatus);
                    const nextIndex = (currentIndex + 1) % statusCycleOrder.length;
                    const nextStatus = statusCycleOrder[nextIndex];
                    updateTruckStatus(truckId, nextStatus);
                } else if (currentStatus === 'unavailable') {
                    updateTruckStatus(truckId, 'available');
                }
            }
        }
    });

    trucksContainer.addEventListener('contextmenu', (event) => {
        const targetBox = event.target.closest('.status-box');
        if (targetBox) {
            event.preventDefault();
            const truckId = targetBox.dataset.truckId;
            showCustomContextMenu(event, truckId);
        }
    });

    document.addEventListener('click', (event) => {
        if (!customContextMenu.contains(event.target)) {
            hideCustomContextMenu();
        }
    });

    adminPanelToggleBtn.addEventListener('click', () => {
        adminPanel.classList.add('active');
        renderAdminTruckList();
        resetTruckForm();
        destinationTimeInput.value = timerDefaults.atDestination;
        logisticsTimeInput.value = timerDefaults.logistics;
    });

    closeAdminPanelBtn.addEventListener('click', () => {
        adminPanel.classList.remove('active');
    });

    saveTruckBtn.addEventListener('click', addOrUpdateTruck);
    cancelEditBtn.addEventListener('click', resetTruckForm);

    saveTimerDefaultsBtn.addEventListener('click', () => {
        const newAtDestTime = parseInt(destinationTimeInput.value);
        const newLogTime = parseInt(logisticsTimeInput.value);

        if (isNaN(newAtDestTime) || isNaN(newLogTime) || newAtDestTime <= 0 || newLogTime <= 0) {
            showModal('Please enter valid positive numbers for timer defaults.', 'alert');
            return;
        }

        timerDefaults.atDestination = newAtDestTime;
        timerDefaults.logistics = newLogTime;
        saveData();
        showModal('Timer defaults saved!', 'alert');
    });

    adminPanel.addEventListener('click', (event) => {
        if (event.target === adminPanel) {
            adminPanel.classList.remove('active');
        }
    });

    darkModeToggleBtn.addEventListener('click', toggleDarkMode);
    exportDataBtn.addEventListener('click', exportTrucksToJson);
    importFileInput.addEventListener('change', importTrucksFromJson);
});
