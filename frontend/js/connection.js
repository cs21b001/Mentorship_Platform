// Constants
const API_URL = 'http://localhost:5000/api';

// Get all connections for current user
async function getConnections() {
    try {
        const response = await authenticatedRequest(`${API_URL}/connections`);
        return response.connections;
    } catch (error) {
        console.error('Error fetching connections:', error);
        throw error;
    }
}

// Send connection request
async function sendConnectionRequest(mentorId) {
    try {
        const response = await authenticatedRequest(
            `${API_URL}/connections/request`,
            'POST',
            { mentorId }
        );
        return response;
    } catch (error) {
        console.error('Error sending connection request:', error);
        throw error;
    }
}

// Accept connection request
async function acceptConnectionRequest(requestId) {
    try {
        const response = await authenticatedRequest(
            `${API_URL}/connections/accept/${requestId}`,
            'POST'
        );
        return response;
    } catch (error) {
        console.error('Error accepting connection request:', error);
        throw error;
    }
}

// Reject connection request
async function rejectConnectionRequest(requestId) {
    try {
        const response = await authenticatedRequest(
            `${API_URL}/connections/reject/${requestId}`,
            'POST'
        );
        return response;
    } catch (error) {
        console.error('Error rejecting connection request:', error);
        throw error;
    }
}

// Get pending connection requests
async function getPendingRequests() {
    try {
        const response = await authenticatedRequest(`${API_URL}/connections/pending`);
        return response.requests;
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        throw error;
    }
}

// Initialize connections page
async function initializeConnectionsPage() {
    try {
        const connections = await getConnections();
        const pendingRequests = await getPendingRequests();
        
        // Render connections
        const connectionsContainer = document.getElementById('connections-container');
        if (connectionsContainer) {
            connectionsContainer.innerHTML = connections.map(connection => `
                <div class="connection-card">
                    <h3>${connection.user.name}</h3>
                    <p>${connection.user.bio || 'No bio available'}</p>
                    <button onclick="viewProfile('${connection.user.id}')">View Profile</button>
                </div>
            `).join('');
        }
        
        // Render pending requests
        const requestsContainer = document.getElementById('pending-requests-container');
        if (requestsContainer) {
            requestsContainer.innerHTML = pendingRequests.map(request => `
                <div class="request-card">
                    <h3>${request.user.name}</h3>
                    <p>${request.user.bio || 'No bio available'}</p>
                    <div class="request-actions">
                        <button onclick="acceptRequest('${request.id}')">Accept</button>
                        <button onclick="rejectRequest('${request.id}')">Reject</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error initializing connections page:', error);
        showError('Failed to load connections. Please try again.');
    }
}

// Helper function to show errors
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }
}

// Initialize page on load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('connections-container')) {
        initializeConnectionsPage();
    }
});
