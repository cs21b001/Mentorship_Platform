// Get user profile
async function getUserProfile() {
    try {
        console.log('Fetching profile data...');
        const response = await authenticatedRequest(`${window.config.API_URL}/profile/me`);
        console.log('Raw profile response:', response);
        return response;
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
}

// Update user profile
async function updateProfile(profileData) {
    try {
        const response = await authenticatedRequest(
            `${window.config.API_URL}/profile`,
            'POST',
            profileData
        );
        return response;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

// Show user modal
async function showUserModal(userId) {
    try {
        // Convert userId to number if it's a string
        const numericUserId = parseInt(userId, 10);
        if (isNaN(numericUserId)) {
            throw new Error('Invalid user ID');
        }

        console.log('Fetching user profile for modal:', numericUserId);
        
        // Fetch both profiles in parallel
        const [response, currentUserResponse] = await Promise.all([
            authenticatedRequest(`${window.config.API_URL}/profile/user/${numericUserId}`),
            authenticatedRequest(`${window.config.API_URL}/profile/me`)
        ]);
        
        // Extract profile data from response
        const profile = response.data;
        const currentUserProfile = currentUserResponse;
        
        console.log('Profile data received:', profile);
        console.log('Current user profile:', currentUserProfile);

        const modal = document.getElementById('user-modal');
        const modalUserName = document.getElementById('modal-user-name');
        const modalUserRole = document.getElementById('modal-user-role');
        const modalUserBio = document.getElementById('modal-user-bio');
        const modalUserSkills = document.getElementById('modal-user-skills');
        const modalUserInterests = document.getElementById('modal-user-interests');
        const sendRequestBtn = document.getElementById('send-request-btn');

        if (!modal || !modalUserName || !modalUserRole || !modalUserBio || !modalUserSkills || !modalUserInterests) {
            throw new Error('Required modal elements not found');
        }

        modalUserName.textContent = `${profile.User.firstName} ${profile.User.lastName}`;
        modalUserRole.textContent = profile.User.role;
        modalUserBio.textContent = profile.bio || 'No bio available';

        // Update skills with consistent styling
        modalUserSkills.innerHTML = `
            <div class="tags-container">
                ${profile.skills && profile.skills.length > 0
                    ? profile.skills.map(skill => `<span class="tag skill">${skill}</span>`).join('')
                    : '<span class="empty-message">No skills listed</span>'}
            </div>`;

        // Update interests with consistent styling
        modalUserInterests.innerHTML = `
            <div class="tags-container">
                ${profile.interests && profile.interests.length > 0
                    ? profile.interests.map(interest => `<span class="tag interest">${interest}</span>`).join('')
                    : '<span class="empty-message">No interests listed</span>'}
            </div>`;

        // Show/hide send request button based on connection status
        if (sendRequestBtn) {
            // Hide the button for existing connections or pending requests
            const isConnected = currentUserProfile.activeConnections?.some(conn => 
                conn.mentorId === numericUserId || conn.menteeId === numericUserId
            );
            const hasPendingRequest = currentUserProfile.pendingRequests?.some(req => 
                req.mentorId === numericUserId || req.menteeId === numericUserId
            );

            if (isConnected || hasPendingRequest) {
                sendRequestBtn.style.display = 'none';
            } else {
                sendRequestBtn.style.display = 'block';
                sendRequestBtn.dataset.userId = numericUserId;
                
                // Remove any existing click event listeners
                const newSendRequestBtn = sendRequestBtn.cloneNode(true);
                sendRequestBtn.parentNode.replaceChild(newSendRequestBtn, sendRequestBtn);
                
                // Add click event listener
                newSendRequestBtn.addEventListener('click', async () => {
                    try {
                        await sendConnectionRequest(numericUserId);
                        showSuccess('Connection request sent successfully!');
                        closeUserModal();
                        // Refresh the connections data
                        await fetchProfileData();
                    } catch (error) {
                        console.error('Error sending connection request:', error);
                        if (error.message.includes('already exists')) {
                            showError('A connection request already exists with this user.');
                        } else {
                            showError('Failed to send connection request. Please try again.');
                        }
                    }
                });
            }
        }

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

// Update pending requests
function updatePendingRequests(pendingConnectionsContainer, data) {
    if (!pendingConnectionsContainer) return;

    if (data.pendingRequests && data.pendingRequests.length > 0) {
        pendingConnectionsContainer.innerHTML = data.pendingRequests.map(request => {
            const mentorId = request.mentorId;
            const menteeId = request.menteeId;
            const currentUserId = data.userId;
            
            const isMentor = mentorId === currentUserId;
            const isMentee = menteeId === currentUserId;
            
            const otherUser = isMentor ? request.mentee : request.mentor;
            const otherUserName = `${otherUser.firstName} ${otherUser.lastName}`;
            const otherUserEmail = otherUser.email;
            const otherUserId = isMentor ? request.menteeId : request.mentorId;
            
            const isRequestSentByMe = request.initiatorId === currentUserId;
            
            return `
                <div class="connection-request">
                    <div class="request-info" onclick="showUserModal('${otherUserId}')" style="cursor: pointer;">
                        <p><strong>${otherUserName}</strong></p>
                        <p>${otherUserEmail}</p>
                        <p class="request-status">${isRequestSentByMe ? 'Request sent by you' : 'Request sent to you'}</p>
                    </div>
                    ${!isRequestSentByMe ? `
                        <div class="request-actions">
                            <button onclick="respondToRequest(${request.id}, 'accepted')" class="btn btn-success">Accept</button>
                            <button onclick="respondToRequest(${request.id}, 'rejected')" class="btn btn-danger">Reject</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    } else {
        pendingConnectionsContainer.innerHTML = '<p>No pending connection requests</p>';
    }
}

// Handle remove connection modal
function showRemoveConnectionModal(connectionId, userName) {
    const modal = document.getElementById('remove-connection-modal');
    const userNameElement = document.getElementById('remove-connection-user-name');
    const confirmBtn = document.getElementById('confirm-remove-btn');
    const cancelBtn = document.getElementById('cancel-remove-btn');
    const closeBtn = modal.querySelector('.close-modal');

    userNameElement.textContent = userName;
    modal.style.display = 'block';

    // Remove any existing event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Add event listeners
    newConfirmBtn.addEventListener('click', async () => {
        try {
            await removeConnection(connectionId);
            modal.style.display = 'none';
            showSuccess('Connection removed successfully');
            await fetchProfileData(); // Refresh the connections list
        } catch (error) {
            console.error('Error removing connection:', error);
            showError('Failed to remove connection. Please try again.');
        }
    });

    const closeModal = () => {
        modal.style.display = 'none';
    };

    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Update active connections
function updateActiveConnections(acceptedConnectionsContainer, data) {
    if (!acceptedConnectionsContainer) {
        console.log('No accepted connections container found');
        return;
    }

    console.log('Updating active connections:', data.activeConnections);

    if (data.activeConnections && data.activeConnections.length > 0) {
        acceptedConnectionsContainer.innerHTML = data.activeConnections.map(connection => {
            // Determine if the current user is the mentor or mentee
            const isMentor = connection.mentorId === data.userId;
            
            // Get the other user's data based on the role
            const otherUser = isMentor ? connection.mentee : connection.mentor;
            const otherUserName = `${otherUser.firstName} ${otherUser.lastName}`;
            const otherUserEmail = otherUser.email;
            const otherUserId = isMentor ? connection.menteeId : connection.mentorId;
                    
            return `
                <div class="connection">
                    <div class="connection-info" onclick="showUserModal(${otherUserId})" style="cursor: pointer;">
                        <p><strong>${otherUserName}</strong></p>
                        <p>${otherUserEmail}</p>
                        <p class="connection-role">${isMentor ? 'You are mentoring' : 'Your mentor'}</p>
                    </div>
                    <div class="connection-actions">
                        <button onclick="showRemoveConnectionModal(${connection.id}, '${otherUserName}')" class="btn btn-danger">Remove Connection</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Show the container and hide empty state
        const emptyState = acceptedConnectionsContainer.querySelector('.empty-state');
        if (emptyState) emptyState.classList.add('hidden');
    } else {
        // Show empty state message
        acceptedConnectionsContainer.innerHTML = `
            <div class="empty-state">
                <p>No active connections yet.</p>
                <p>Head to the <a href="discovery.html">Discovery</a> page to find mentors or mentees!</p>
            </div>
        `;
    }
}

// Update profile view
function updateProfileView(data) {
    try {
        console.log('Starting updateProfileView with data:', data);
        
        // Update user info
        const nameElement = document.getElementById('profile-name');
        const emailElement = document.getElementById('profile-email');
        const roleElement = document.getElementById('profile-role');
        const bioElement = document.getElementById('profile-bio');
        const skillsElement = document.getElementById('profile-skills');
        const interestsElement = document.getElementById('profile-interests');
        
        console.log('Found DOM elements:', {
            nameElement: !!nameElement,
            emailElement: !!emailElement,
            roleElement: !!roleElement,
            bioElement: !!bioElement,
            skillsElement: !!skillsElement,
            interestsElement: !!interestsElement
        });

        console.log('User data from response:', data.User);
        
        if (nameElement) {
            const fullName = `${data.User?.firstName || ''} ${data.User?.lastName || ''}`.trim();
            nameElement.textContent = fullName || 'Name not available';
            console.log('Set name to:', fullName);
        }
        if (emailElement && data.User?.email) {
            emailElement.textContent = data.User.email;
            console.log('Set email to:', data.User.email);
        }
        if (roleElement && data.User?.role) {
            roleElement.textContent = data.User.role;
            console.log('Set role to:', data.User.role);
        }
        if (bioElement) {
            bioElement.textContent = data.bio || 'No bio available';
            console.log('Set bio to:', data.bio || 'No bio available');
        }
        if (skillsElement) {
            skillsElement.innerHTML = `
                <div class="user-skills" data-label="Skills">
                    ${data.skills && data.skills.length > 0
                        ? data.skills.map(skill => `<span class="tag skill">${skill}</span>`).join('')
                        : '<span class="empty-message">No skills listed</span>'}
                </div>`;
            console.log('Set skills');
        }
        if (interestsElement) {
            interestsElement.innerHTML = `
                <div class="user-interests" data-label="Interests">
                    ${data.interests && data.interests.length > 0
                        ? data.interests.map(interest => `<span class="tag interest">${interest}</span>`).join('')
                        : '<span class="empty-message">No interests listed</span>'}
                </div>`;
            console.log('Set interests');
        }

        // Update connections sections
        const pendingConnectionsContainer = document.getElementById('pending-connections');
        const acceptedConnectionsContainer = document.getElementById('accepted-connections');
        
        console.log('Found connections containers:', {
            pendingContainer: !!pendingConnectionsContainer,
            acceptedContainer: !!acceptedConnectionsContainer
        });

        updatePendingRequests(pendingConnectionsContainer, data);
        updateActiveConnections(acceptedConnectionsContainer, data);

    } catch (error) {
        console.error('Error in updateProfileView:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            data: data
        });
        showError('Failed to update profile view. Please try again.');
    }
}

// Navigate to profile
function navigateToProfile(userId) {
    try {
        // Get the current path without the filename
        const currentPath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        // Construct the new URL using the current path
        const newUrl = `${currentPath}/profile.html?id=${userId}`;
        window.location.href = newUrl;
    } catch (error) {
        console.error('Error navigating to profile:', error);
        showError('Failed to navigate to profile. Please try again.');
    }
}

// Respond to connection request
async function respondToRequest(connectionId, status) {
    try {
        console.log('Responding to connection request:', connectionId, status);
        const endpoint = status === 'accepted' ? 'accept' : 'reject';
        const response = await authenticatedRequest(
            `${window.config.API_URL}/connections/${endpoint}/${connectionId}`,
            'POST'
        );
        console.log('Response to request:', response);
        showSuccess(`Connection request ${status} successfully!`);
        // Refresh profile data
        await fetchProfileData();
    } catch (error) {
        console.error('Error responding to request:', error);
        showError(`Failed to ${status} request. Please try again.`);
    }
}

// Remove connection
async function removeConnection(connectionId) {
    try {
        await authenticatedRequest(
            `${window.config.API_URL}/connections/${connectionId}`,
            'DELETE'
        );
    } catch (error) {
        console.error('Error removing connection:', error);
        throw error;
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

// Wait for auth.js to load before initializing
window.addEventListener('load', () => {
    console.log('Window loaded, checking for profile elements...');
    
    // Check if config.js is loaded
    if (!window.config) {
        console.error('Config not loaded');
        showError('Configuration not available. Please refresh the page.');
        return;
    }
    
    // Check if auth.js is loaded
    if (typeof window.authenticatedRequest !== 'function') {
        console.error('Auth functions not loaded');
        showError('Authentication system not available. Please refresh the page.');
        return;
    }
    
    // Check if profile elements exist
    const profileForm = document.getElementById('profile-form');
    const profileView = document.getElementById('profile-view');
    
    if (!profileForm && !profileView) {
        console.error('Profile elements not found');
        showError('Profile page not properly loaded. Please refresh the page.');
        return;
    }
    
    console.log('All required elements and functions found, initializing profile...');
    initializeProfilePage();
});

// Initialize profile page
async function initializeProfilePage() {
    try {
        console.log('Initializing profile page...');
        await fetchProfileData();
        initializeTabs();
    } catch (error) {
        console.error('Error initializing profile page:', error);
        showError('Failed to load profile. Please try again.');
    }
}

// Initialize tabs functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Set active tab
            button.classList.add('active');
            document.getElementById(`${tabId}-connections`).classList.add('active');
        });
    });
}

// Fetch profile data
async function fetchProfileData() {
    try {
        const data = await getUserProfile();
        updateProfileView(data);
        populateProfileForm(data);
        updatePendingRequests(document.getElementById('pending-connections'), data);
        updateActiveConnections(document.getElementById('accepted-connections'), data);
    } catch (error) {
        console.error('Error fetching profile data:', error);
        showError('Failed to load profile data. Please try again.');
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeProfilePage();
    
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

// Send connection request
async function sendConnectionRequest(userId) {
    try {
        const response = await authenticatedRequest(
            `${window.config.API_URL}/connections/request`,
            'POST',
            { userId }
        );
        return response;
    } catch (error) {
        console.error('Error sending connection request:', error);
        throw error;
    }
}

// Handle edit profile button click
document.getElementById('edit-profile-btn').addEventListener('click', () => {
    document.getElementById('profile-view').classList.add('hidden');
    document.getElementById('profile-form').classList.remove('hidden');
});

// Handle cancel edit button click
document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    document.getElementById('profile-form').classList.add('hidden');
    document.getElementById('profile-view').classList.remove('hidden');
});

// Handle profile form submission
document.getElementById('update-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const profileData = {
            bio: formData.get('bio'),
            skills: formData.get('skills').split(',').map(skill => skill.trim()).filter(skill => skill),
            interests: formData.get('interests').split(',').map(interest => interest.trim()).filter(interest => interest)
        };

        await updateProfile(profileData);
        
        // Refresh profile data and update view
        await fetchProfileData();
        
        // Switch back to view mode
        document.getElementById('profile-form').classList.add('hidden');
        document.getElementById('profile-view').classList.remove('hidden');
        
        showSuccess('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile. Please try again.');
    }
});

// Populate form with current profile data
function populateProfileForm(data) {
    const form = document.getElementById('update-profile-form');
    if (!form) return;

    // Set bio
    form.querySelector('#bio').value = data.bio || '';
    
    // Set skills
    form.querySelector('#skills').value = data.skills ? data.skills.join(', ') : '';
    
    // Set interests
    form.querySelector('#interests').value = data.interests ? data.interests.join(', ') : '';
    
    // Set role radio button
    const roleRadio = form.querySelector(`input[name="role"][value="${data.User.role}"]`);
    if (roleRadio) roleRadio.checked = true;
    
    // Set name fields
    form.querySelector('#first-name').value = data.User.firstName;
    form.querySelector('#last-name').value = data.User.lastName;
}

// Delete account
async function deleteAccount() {
    try {
        await authenticatedRequest(
            `${window.config.API_URL}/profile`,
            'DELETE'
        );
        // Clear auth token and redirect to home page
        localStorage.removeItem('token');
        window.location.href = '/frontend/index.html';
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
    }
}

// Show delete account modal
function showDeleteAccountModal() {
    const modal = document.getElementById('delete-account-modal');
    const confirmBtn = document.getElementById('confirm-delete-account-btn');
    const cancelBtn = document.getElementById('cancel-delete-account-btn');
    const closeBtn = modal.querySelector('.close-modal');
    const confirmationInput = document.getElementById('delete-confirmation');

    modal.style.display = 'block';

    // Enable/disable confirm button based on input
    confirmationInput.addEventListener('input', (e) => {
        confirmBtn.disabled = e.target.value !== 'DELETE';
    });

    // Reset input when modal is shown
    confirmationInput.value = '';
    confirmBtn.disabled = true;

    // Handle delete confirmation
    confirmBtn.addEventListener('click', async () => {
        try {
            await deleteAccount();
            showSuccess('Account deleted successfully');
            // Redirect will happen in deleteAccount function
        } catch (error) {
            showError('Failed to delete account. Please try again.');
        }
    });

    // Handle modal close
    const closeModal = () => {
        modal.style.display = 'none';
        confirmationInput.value = '';
        confirmBtn.disabled = true;
    };

    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Add event listener for delete account button
document.getElementById('delete-account-btn').addEventListener('click', showDeleteAccountModal);
