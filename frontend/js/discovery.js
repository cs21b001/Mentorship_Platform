// Get all profiles with filters
async function getProfiles(filters = {}) {
    try {
        console.log('Fetching profiles with filters:', filters);
        const queryParams = new URLSearchParams();
        
        // Process role filter
        if (filters.role) {
            queryParams.append('role', filters.role);
            console.log('Role filter:', filters.role);
        }
        
        // Process skills filter
        if (filters.skills) {
            const processedSkills = filters.skills
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0)
                .join(',');
                
            if (processedSkills) {
                console.log('Skills filter:', processedSkills);
                console.log('Individual skills:', processedSkills.split(','));
                queryParams.append('skills', processedSkills);
            }
        }
        
        // Process interests filter
        if (filters.interests) {
            const processedInterests = filters.interests
                .split(',')
                .map(i => i.trim())
                .filter(i => i.length > 0)
                .join(',');
                
            if (processedInterests) {
                console.log('Interests filter:', processedInterests);
                console.log('Individual interests:', processedInterests.split(','));
                queryParams.append('interests', processedInterests);
            }
        }
        
        // Add timestamp to prevent caching
        queryParams.append('_t', Date.now());
        
        const url = `${window.config.API_URL}/profile?${queryParams.toString()}`;
        console.log('Fetching profiles from:', url);
        console.log('Query parameters:', Object.fromEntries(queryParams.entries()));
        
        const response = await authenticatedRequest(url);
        console.log('Raw API response:', response);
        
        // Extract profiles array from response
        const profiles = response.data;
        console.log('Number of profiles found:', profiles.length);
        
        if (profiles.length > 0) {
            console.log('Profiles found:');
            profiles.forEach(profile => {
                console.log(`Profile ${profile.userId} (${profile.User.firstName} ${profile.User.lastName}):`);
                if (filters.skills) {
                    console.log('- Skills:', profile.skills);
                }
                if (filters.interests) {
                    console.log('- Interests:', profile.interests);
                }
            });
        } else {
            console.log('No profiles found matching the criteria');
        }
        
        return profiles;
    } catch (error) {
        console.error('Error fetching profiles:', error);
        throw error;
    }
}

// Show role mismatch error modal
function showRoleMismatchError() {
    const modal = document.getElementById('role-error-modal');
    const closeBtn = modal.querySelector('.close-modal');
    const understandBtn = document.getElementById('understand-btn');

    modal.style.display = 'block';

    const closeModal = () => {
        modal.style.display = 'none';
    };

    closeBtn.addEventListener('click', closeModal);
    understandBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Show API error modal
function showApiError(message) {
    const modal = document.getElementById('api-error-modal');
    const messageElement = document.getElementById('api-error-message');
    const closeButtons = modal.querySelectorAll('.close-modal');

    messageElement.textContent = message;
    modal.style.display = 'block';

    const closeModal = () => {
        modal.style.display = 'none';
    };

    // Add click handlers to all close buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    // Close on outside click
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Function to show pending request modal
function showPendingRequestModal() {
    const modal = document.getElementById('pending-request-modal');
    modal.style.display = 'block';

    // Close modal functionality
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.onclick = function() {
            modal.style.display = 'none';
        }
    });

    // Close on outside click
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}

// Function to send connection request
async function sendConnectionRequest(userId) {
    try {
        const response = await authenticatedRequest(`${window.config.API_URL}/connections/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ receiverId: userId })
        });

        if (response.status === 'error') {
            if (response.message.includes('pending connection request already exists')) {
                showPendingRequestModal();
            } else {
                showError(response.message);
            }
            return;
        }

        // Show success message
        showSuccess('Connection request sent successfully!');
        
        // Close the user modal
        const userModal = document.getElementById('user-modal');
        userModal.style.display = 'none';
        
        // Refresh the user cards to update the UI
        await loadUsers();
    } catch (error) {
        if (error.message.includes('pending connection request already exists')) {
            showPendingRequestModal();
        } else {
            showError('Error sending connection request. Please try again.');
        }
    }
}

// Create user card
function createUserCard(profile) {
    const card = document.createElement('div');
    card.className = 'user-card';
    card.innerHTML = `
        <div class="user-card-header">
            <h3>${profile.User.firstName} ${profile.User.lastName}</h3>
            <span class="user-role">${profile.User.role}</span>
        </div>
        <div class="user-card-body">
            <p class="user-bio">${profile.bio || 'No bio available'}</p>
            <div class="user-skills" data-label="Skills">
                ${profile.skills && profile.skills.length > 0 
                    ? profile.skills.map(skill => `<span class="tag skill">${skill}</span>`).join('')
                    : '<span class="empty-message">No skills listed</span>'}
            </div>
            <div class="user-interests" data-label="Interests">
                ${profile.interests && profile.interests.length > 0 
                    ? profile.interests.map(interest => `<span class="tag interest">${interest}</span>`).join('')
                    : '<span class="empty-message">No interests listed</span>'}
            </div>
        </div>
        <div class="user-card-footer">
            <button class="btn btn-primary view-profile-btn" data-user-id="${profile.userId}">View Profile</button>
        </div>
    `;
    return card;
}

// Update user cards
function updateUserCards(users) {
    const userCards = document.getElementById('user-cards');
    if (!userCards) {
        console.error('User cards container not found');
        return;
    }

    // Create empty state if it doesn't exist
    let emptyState = userCards.querySelector('.empty-state');
    if (!emptyState) {
        emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = '<p>No users found matching your criteria.</p>';
        userCards.appendChild(emptyState);
    }
    
    // Remove all child elements except empty state
    Array.from(userCards.children).forEach(child => {
        if (!child.classList.contains('empty-state')) {
            child.remove();
        }
    });
    
    if (!users || users.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    users.forEach(user => {
        const card = createUserCard(user);
        userCards.appendChild(card);
    });
}

// Show user modal
async function showUserModal(response) {
    try {
        const modal = document.getElementById('user-modal');
        const modalUserName = document.getElementById('modal-user-name');
        const modalUserRole = document.getElementById('modal-user-role');
        const modalUserBio = document.getElementById('modal-user-bio');
        const modalUserSkills = document.getElementById('modal-user-skills');
        const modalUserInterests = document.getElementById('modal-user-interests');
        const sendRequestBtn = document.getElementById('send-request-btn');

        if (!modal || !modalUserName || !modalUserRole || !modalUserBio || !modalUserSkills || !modalUserInterests || !sendRequestBtn) {
            throw new Error('Required modal elements not found');
        }

        // Extract profile data from the response
        const profile = response.data || response;

        modalUserName.textContent = `${profile.User.firstName} ${profile.User.lastName}`;
        modalUserRole.textContent = profile.User.role;
        modalUserBio.textContent = profile.bio || 'No bio available';

        // Update skills with consistent styling
        modalUserSkills.innerHTML = `
            <div class="user-skills" data-label="Skills">
                ${profile.skills && profile.skills.length > 0
                    ? profile.skills.map(skill => `<span class="tag skill">${skill}</span>`).join('')
                    : '<span class="empty-message">No skills listed</span>'}
            </div>`;

        // Update interests with consistent styling
        modalUserInterests.innerHTML = `
            <div class="user-interests" data-label="Interests">
                ${profile.interests && profile.interests.length > 0
                    ? profile.interests.map(interest => `<span class="tag interest">${interest}</span>`).join('')
                    : '<span class="empty-message">No interests listed</span>'}
            </div>`;

        // Set up send request button
        sendRequestBtn.dataset.userId = profile.userId;

        // Show the modal
        modal.style.display = 'block';

        // Set up close button functionality
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            // Remove any existing listeners
            closeBtn.onclick = null;
            // Add new listener
            closeBtn.onclick = closeUserModal;
        }

        // Close modal when clicking outside
        window.onclick = (event) => {
            if (event.target === modal) {
                closeUserModal();
            }
        };

    } catch (error) {
        console.error('Error showing user modal:', error);
        showError('Failed to load user profile. Please try again.');
    }
}

// Close user modal
function closeUserModal() {
    const modal = document.getElementById('user-modal');
    if (modal) {
        modal.style.display = 'none';
        // Remove event listeners when closing
        window.onclick = null;
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = null;
        }
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

// Initialize page on load
window.addEventListener('load', () => {
    console.log('Window loaded, initializing discovery page...');
    initializeDiscoveryPage();
    
    // Handle modal close button
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', closeUserModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('user-modal');
        if (e.target === modal) {
            closeUserModal();
        }
    });
});

// Load user profile
async function loadUserProfile() {
    try {
        const profile = await authenticatedRequest(`${window.config.API_URL}/profile`);
        const profileContent = document.getElementById('profile-content');
        
        if (profile) {
            profileContent.innerHTML = `
                <div class="profile-info">
                    <h3>${profile.User.firstName} ${profile.User.lastName}</h3>
                    <span class="user-role">${profile.User.role}</span>
                    <p class="bio">${profile.bio || 'No bio available'}</p>
                    
                    <div class="skills-section">
                        <h4>Skills</h4>
                        <div class="tags">
                            ${profile.skills && profile.skills.length > 0 
                                ? profile.skills.map(skill => `<span class="tag skill">${skill}</span>`).join('')
                                : 'No skills listed'}
                        </div>
                    </div>
                    
                    <div class="interests-section">
                        <h4>Interests</h4>
                        <div class="tags">
                            ${profile.interests && profile.interests.length > 0 
                                ? profile.interests.map(interest => `<span class="tag interest">${interest}</span>`).join('')
                                : 'No interests listed'}
                        </div>
                    </div>
                </div>
            `;
        } else {
            profileContent.innerHTML = '<p class="empty-state">Failed to load profile.</p>';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile. Please try again.');
    }
}

// Load connections
async function loadConnections() {
    try {
        const connections = await authenticatedRequest(`${window.config.API_URL}/connections`);
        const activeConnections = document.getElementById('active-connections');
        const pendingRequests = document.getElementById('pending-requests');
        
        if (connections) {
            // Update active connections
            if (connections.active && connections.active.length > 0) {
                activeConnections.innerHTML = connections.active.map(conn => `
                    <div class="connection">
                        <div class="connection-info">
                            <h4>${conn.User.firstName} ${conn.User.lastName}</h4>
                            <span class="user-role">${conn.User.role}</span>
                        </div>
                        <div class="connection-actions">
                            <button class="btn btn-danger" onclick="removeConnection(${conn.id})">Remove</button>
                        </div>
                    </div>
                `).join('');
            } else {
                activeConnections.innerHTML = '<div class="empty-state"><p>No active connections yet.</p></div>';
            }
            
            // Update pending requests
            if (connections.pending && connections.pending.length > 0) {
                pendingRequests.innerHTML = connections.pending.map(req => `
                    <div class="connection-request">
                        <div class="request-info">
                            <h4>${req.User.firstName} ${req.User.lastName}</h4>
                            <span class="user-role">${req.User.role}</span>
                            <p class="request-status">${req.status}</p>
                        </div>
                        <div class="request-actions">
                            ${req.type === 'received' ? `
                                <button class="btn btn-success" onclick="acceptRequest(${req.id})">Accept</button>
                                <button class="btn btn-danger" onclick="rejectRequest(${req.id})">Reject</button>
                            ` : `
                                <button class="btn btn-danger" onclick="cancelRequest(${req.id})">Cancel</button>
                            `}
                        </div>
                    </div>
                `).join('');
            } else {
                pendingRequests.innerHTML = '<div class="empty-state"><p>No pending requests.</p></div>';
            }
        }
    } catch (error) {
        console.error('Error loading connections:', error);
        showError('Failed to load connections. Please try again.');
    }
}

// Connection management functions
async function removeConnection(connectionId) {
    try {
        await authenticatedRequest(`${window.config.API_URL}/connections/${connectionId}`, 'DELETE');
        showSuccess('Connection removed successfully');
        loadConnections();
    } catch (error) {
        console.error('Error removing connection:', error);
        showError('Failed to remove connection. Please try again.');
    }
}

async function acceptRequest(requestId) {
    try {
        await authenticatedRequest(`${window.config.API_URL}/connections/accept/${requestId}`, 'POST');
        showSuccess('Connection request accepted');
        loadConnections();
    } catch (error) {
        console.error('Error accepting request:', error);
        showError('Failed to accept request. Please try again.');
    }
}

async function rejectRequest(requestId) {
    try {
        await authenticatedRequest(`${window.config.API_URL}/connections/reject/${requestId}`, 'POST');
        showSuccess('Connection request rejected');
        loadConnections();
    } catch (error) {
        console.error('Error rejecting request:', error);
        showError('Failed to reject request. Please try again.');
    }
}

async function cancelRequest(requestId) {
    try {
        await authenticatedRequest(`${window.config.API_URL}/connections/cancel/${requestId}`, 'POST');
        showSuccess('Connection request cancelled');
        loadConnections();
    } catch (error) {
        console.error('Error cancelling request:', error);
        showError('Failed to cancel request. Please try again.');
    }
}

// Initialize discovery page
async function initializeDiscoveryPage() {
    try {
        console.log('Initializing discovery page...');
        
        // Get initial profiles
        const profiles = await getProfiles();
        updateUserCards(profiles);
        
        // Handle filter form
        const filterForm = document.getElementById('filter-form');
        if (filterForm) {
            filterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Get form elements
                const roleFilter = document.getElementById('role-filter');
                const skillsFilter = document.getElementById('skills-filter');
                const interestsFilter = document.getElementById('interests-filter');
                const submitButton = filterForm.querySelector('button[type="submit"]');
                
                // Show loading state
                submitButton.disabled = true;
                submitButton.textContent = 'Applying Filters...';
                
                try {
                    const filters = {
                        role: roleFilter.value,
                        skills: skillsFilter.value,
                        interests: interestsFilter.value
                    };
                    
                    console.log('Applying filters:', filters);
                    const profiles = await getProfiles(filters);
                    updateUserCards(profiles);
                } catch (error) {
                    console.error('Error applying filters:', error);
                    showError('Failed to fetch profiles. Please try again.');
                } finally {
                    // Reset button state
                    submitButton.disabled = false;
                    submitButton.textContent = 'Apply Filters';
                }
            });
        }
        
        // Handle view profile button clicks
        document.getElementById('user-cards').addEventListener('click', async (e) => {
            const viewProfileBtn = e.target.closest('.view-profile-btn');
            if (viewProfileBtn) {
                const userId = viewProfileBtn.dataset.userId;
                try {
                    console.log('Fetching profile for user:', userId);
                    const response = await authenticatedRequest(`${window.config.API_URL}/profile/user/${userId}`);
                    console.log('Profile data received:', response);
                    showUserModal(response);
                } catch (error) {
                    console.error('Error fetching profile:', error);
                    showError('Failed to load user profile. Please try again.');
                }
            }
        });
        
        // Handle send request button clicks
        document.getElementById('send-request-btn').addEventListener('click', async () => {
            const userId = document.getElementById('send-request-btn').dataset.userId;
            if (!userId) {
                console.error('No user ID found for connection request');
                return;
            }
            
            try {
                await sendConnectionRequest(userId);
                showSuccess('Connection request sent successfully!');
                closeUserModal();
            } catch (error) {
                console.error('Error sending connection request:', error);
                // Error is already handled in sendConnectionRequest function
            }
        });
        
    } catch (error) {
        console.error('Error initializing discovery page:', error);
        showError('Failed to load discovery page. Please try again.');
    }
}
