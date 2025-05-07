// Get user profile
async function getUserProfile() {
    try {
        console.log('Fetching profile data...');
        const response = await authenticatedRequest(`${window.config.API_URL}/profile/me`);
        console.log('Profile data received:', response);
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

// Initialize profile page
async function initializeProfilePage() {
    try {
        console.log('Initializing profile page...');
        
        // Check if we're viewing another user's profile
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');
        
        if (userId) {
            console.log('Fetching profile for user ID:', userId);
            // Fetch other user's profile
            try {
                const response = await authenticatedRequest(`${window.config.API_URL}/profile/user/${userId}`);
                console.log('Received profile data:', response);
                updateProfileView(response);
                // Hide edit functionality for other users' profiles
                const editButton = document.getElementById('edit-profile-btn');
                if (editButton) editButton.style.display = 'none';
                
                // Hide the profile form
                const profileForm = document.getElementById('profile-form');
                if (profileForm) profileForm.style.display = 'none';
                
                // Show the profile view
                const profileView = document.getElementById('profile-view');
                if (profileView) profileView.style.display = 'block';
            } catch (error) {
                console.error('Error fetching user profile:', error);
                showError('Failed to load user profile. Please try again.');
            }
            return;
        }
        
        // Continue with normal profile initialization
        const profileForm = document.getElementById('profile-form');
        const profileView = document.getElementById('profile-view');
        
        if (!profileForm && !profileView) {
            console.error('Profile elements not found');
            return;
        }
        
        // Get profile data
        const profile = await getUserProfile();
        console.log('Profile data to display:', profile);
        
        // Display profile data
        if (profileView) {
            console.log('Updating profile view with data...');
            updateProfileView(profile);
        }
        
        // Handle edit profile form
        if (profileForm) {
            console.log('Setting up edit form...');
            // Populate form with existing data
            const firstNameInput = document.getElementById('first-name');
            const lastNameInput = document.getElementById('last-name');
            const bioInput = document.getElementById('bio');
            const skillsInput = document.getElementById('skills');
            const interestsInput = document.getElementById('interests');
            
            if (firstNameInput) firstNameInput.value = profile.firstName || '';
            if (lastNameInput) lastNameInput.value = profile.lastName || '';
            if (bioInput) bioInput.value = profile.bio || '';
            if (skillsInput) skillsInput.value = profile.skills?.join(', ') || '';
            if (interestsInput) interestsInput.value = profile.interests?.join(', ') || '';
            
            // Set role radio button
            const roleRadio = document.querySelector(`input[name="role"][value="${profile.role}"]`);
            if (roleRadio) {
                roleRadio.checked = true;
            }
            
            // Remove existing event listeners
            const newForm = profileForm.cloneNode(true);
            profileForm.parentNode.replaceChild(newForm, profileForm);
            
            // Add new event listener
            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = {
                    firstName: firstNameInput?.value.trim() || '',
                    lastName: lastNameInput?.value.trim() || '',
                    role: document.querySelector('input[name="role"]:checked')?.value || '',
                    bio: bioInput?.value.trim() || '',
                    skills: skillsInput?.value
                        .split(',')
                        .map(skill => skill.trim())
                        .filter(skill => skill) || [],
                    interests: interestsInput?.value
                        .split(',')
                        .map(interest => interest.trim())
                        .filter(interest => interest) || []
                };
                
                try {
                    await updateProfile(formData);
                    showSuccess('Profile updated successfully!');
                    // Refresh profile view
                    await fetchProfileData();
                } catch (error) {
                    console.error('Error updating profile:', error);
                    showError('Failed to update profile. Please try again.');
                }
            });
        }
        
        // Handle edit button
        const editButton = document.getElementById('edit-profile-btn');
        if (editButton) {
            const newEditButton = editButton.cloneNode(true);
            editButton.parentNode.replaceChild(newEditButton, editButton);
            
            newEditButton.addEventListener('click', () => {
                if (profileView) profileView.classList.add('hidden');
                if (profileForm) profileForm.classList.remove('hidden');
            });
        }
        
        // Handle cancel button
        const cancelButton = document.getElementById('cancel-edit-btn');
        if (cancelButton) {
            const newCancelButton = cancelButton.cloneNode(true);
            cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
            
            newCancelButton.addEventListener('click', () => {
                if (profileForm) profileForm.classList.add('hidden');
                if (profileView) profileView.classList.remove('hidden');
            });
        }

        // Handle tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Remove existing event listeners from tab buttons
        tabButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', () => {
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                newButton.classList.add('active');
                const tabId = newButton.dataset.tab;
                const targetContent = document.getElementById(`${tabId}-connections`);
                if (targetContent) targetContent.classList.add('active');
            });
        });
        
    } catch (error) {
        console.error('Error initializing profile page:', error);
        showError('Failed to load profile. Please try again.');
    }
}

// Update profile view with data
function updateProfileView(data) {
    console.log('Updating profile view with data:', data);
    
    try {
        // Update basic info
        const nameElement = document.getElementById('profile-name');
        const emailElement = document.getElementById('profile-email');
        const roleElement = document.getElementById('profile-role');
        const bioElement = document.getElementById('profile-bio');
        const skillsContainer = document.getElementById('profile-skills');
        const interestsContainer = document.getElementById('profile-interests');
        const pendingConnectionsContainer = document.getElementById('pending-connections');
        const acceptedConnectionsContainer = document.getElementById('accepted-connections');

        if (nameElement) nameElement.textContent = `${data.firstName} ${data.lastName}`;
        if (emailElement) emailElement.textContent = data.email;
        if (roleElement) roleElement.textContent = data.role;
        if (bioElement) bioElement.textContent = data.bio || 'No bio available';
        
        // Update skills
        if (skillsContainer) {
            skillsContainer.innerHTML = data.skills && data.skills.length > 0
                ? data.skills.map(skill => `<span class="tag">${skill}</span>`).join('')
                : 'No skills listed';
        }
        
        // Update interests
        if (interestsContainer) {
            interestsContainer.innerHTML = data.interests && data.interests.length > 0
                ? data.interests.map(interest => `<span class="tag">${interest}</span>`).join('')
                : 'No interests listed';
        }

        // Update pending requests
        if (pendingConnectionsContainer) {
            if (data.pendingRequests && data.pendingRequests.length > 0) {
                pendingConnectionsContainer.innerHTML = data.pendingRequests.map(request => {
                    const mentorId = request.mentor._id;
                    const menteeId = request.mentee._id;
                    const currentUserId = data.user;
                    
                    const isMentor = mentorId === currentUserId;
                    const isMentee = menteeId === currentUserId;
                    
                    const otherUserEmail = isMentor ? request.mentee.email : request.mentor.email;
                    const otherUserId = isMentor ? request.mentee._id : request.mentor._id;
                    
                    const isRequestSentByMe = request.initiator ? 
                        request.initiator._id === currentUserId :
                        (isMentee && request.mentor._id === mentorId) || 
                        (isMentor && request.mentee._id === menteeId);
                    
                    return `
                        <div class="connection-request">
                            <div class="request-info" onclick="navigateToProfile('${otherUserId}')" style="cursor: pointer;">
                                <p><strong>${otherUserEmail}</strong></p>
                                <p class="request-status">${isRequestSentByMe ? 'Request sent by you' : 'Request sent to you'}</p>
                            </div>
                            ${!isRequestSentByMe ? `
                                <div class="request-actions">
                                    <button class="btn btn-success" onclick="event.stopPropagation(); respondToRequest('${request._id}', 'accepted')">Accept</button>
                                    <button class="btn btn-danger" onclick="event.stopPropagation(); respondToRequest('${request._id}', 'rejected')">Reject</button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('');
            } else {
                pendingConnectionsContainer.innerHTML = '<div class="empty-state"><p>No pending requests</p></div>';
            }
        }

        // Update active connections
        if (acceptedConnectionsContainer) {
            if (data.activeConnections && data.activeConnections.length > 0) {
                acceptedConnectionsContainer.innerHTML = data.activeConnections.map(connection => {
                    const isMentor = connection.mentor._id === data.user;
                    const otherUserEmail = isMentor ? connection.mentee.email : connection.mentor.email;
                    const otherUserId = isMentor ? connection.mentee._id : connection.mentor._id;
                    
                    return `
                        <div class="connection">
                            <div class="connection-info" onclick="navigateToProfile('${otherUserId}')" style="cursor: pointer;">
                                <p><strong>${otherUserEmail}</strong></p>
                                <p class="connection-role">${isMentor ? 'Mentee' : 'Mentor'}</p>
                            </div>
                            <div class="connection-actions">
                                <button class="btn btn-danger" onclick="event.stopPropagation(); removeConnection('${connection._id}')">Remove Connection</button>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                acceptedConnectionsContainer.innerHTML = '<div class="empty-state"><p>No active connections</p></div>';
            }
        }
    } catch (error) {
        console.error('Error updating profile view:', error);
        showError('Failed to update profile view. Please refresh the page.');
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
        const response = await authenticatedRequest(
            `${window.config.API_URL}/connections/respond`,
            'PUT',
            { connectionId, status }
        );
        console.log('Response to request:', response);
        showSuccess('Connection request updated successfully!');
        // Refresh profile data
        await fetchProfileData();
    } catch (error) {
        console.error('Error responding to request:', error);
        showError('Failed to update connection request. Please try again.');
    }
}

// Remove connection
async function removeConnection(connectionId) {
    try {
        if (!confirm('Are you sure you want to remove this connection?')) {
            return;
        }
        
        const response = await authenticatedRequest(
            `${window.config.API_URL}/connections/${connectionId}`,
            'DELETE'
        );
        
        showSuccess('Connection removed successfully!');
        await fetchProfileData();
    } catch (error) {
        console.error('Error removing connection:', error);
        showError('Failed to remove connection. Please try again.');
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

// Fetch profile data
async function fetchProfileData() {
    try {
        const profile = await getUserProfile();
        updateProfileView(profile);
    } catch (error) {
        console.error('Error fetching profile data:', error);
        showError('Failed to refresh profile data. Please try again.');
    }
}
