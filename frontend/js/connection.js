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
            `${API_URL}/connections/respond`,
            'PUT',
            { 
                connectionId: requestId,
                status: 'accepted'
            }
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
            `${API_URL}/connections/respond`,
            'PUT',
            { 
                connectionId: requestId,
                status: 'rejected'
            }
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

// Handle accept request action
async function acceptRequest(requestId) {
    try {
        await acceptConnectionRequest(requestId);
        showSuccess('Connection request accepted successfully!');
        // Remove the request card from pending requests
        const requestCard = document.querySelector(`[data-request-id="${requestId}"]`);
        if (requestCard) {
            requestCard.remove();
        }
        // Refresh the connections list
        await initializeConnectionsPage();
    } catch (error) {
        console.error('Error accepting request:', error);
        showError('Failed to accept connection request. Please try again.');
    }
}

// Handle reject request action
async function rejectRequest(requestId) {
    try {
        await rejectConnectionRequest(requestId);
        showSuccess('Connection request rejected successfully!');
        // Remove the request card from pending requests
        const requestCard = document.querySelector(`[data-request-id="${requestId}"]`);
        if (requestCard) {
            requestCard.remove();
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
        showError('Failed to reject connection request. Please try again.');
    }
}

// Helper function to show success messages
function showSuccess(message) {
    const successContainer = document.createElement('div');
    successContainer.className = 'alert alert-success';
    successContainer.textContent = message;
    document.body.appendChild(successContainer);
    setTimeout(() => successContainer.remove(), 3000);
}

// Helper function to show errors
function showError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'alert alert-error';
    errorContainer.textContent = message;
    document.body.appendChild(errorContainer);
    setTimeout(() => errorContainer.remove(), 3000);
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
                    <h3>${connection.mentor.firstName} ${connection.mentor.lastName}</h3>
                    <p>Role: ${connection.mentor.id === connection.mentorId ? 'Mentor' : 'Mentee'}</p>
                    <button onclick="viewProfile('${connection.mentor.id}')">View Profile</button>
                </div>
            `).join('');
        }
        
        // Render pending requests
        const requestsContainer = document.getElementById('pending-requests-container');
        if (requestsContainer) {
            requestsContainer.innerHTML = pendingRequests.map(request => `
                <div class="request-card" data-request-id="${request.id}">
                    <div class="request-info">
                        <h3>${request.initiator.firstName} ${request.initiator.lastName}</h3>
                        <p>Wants to be your ${request.initiator.id === request.mentorId ? 'mentor' : 'mentee'}</p>
                    </div>
                    <div class="request-actions">
                        <button class="btn-success" onclick="acceptRequest('${request.id}')">Accept</button>
                        <button class="btn-danger" onclick="rejectRequest('${request.id}')">Reject</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error initializing connections page:', error);
        showError('Failed to load connections. Please try again.');
    }
}

// Initialize page on load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('connections-container')) {
        initializeConnectionsPage();
    }
});
