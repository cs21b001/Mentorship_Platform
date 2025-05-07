// Get all profiles with filters
async function getProfiles(filters = {}) {
    try {
        console.log('Fetching profiles with filters:', filters);
        const queryParams = new URLSearchParams();
        
        if (filters.role) {
            queryParams.append('role', filters.role);
        }
        if (filters.skills) {
            queryParams.append('skills', filters.skills);
        }
        if (filters.interests) {
            queryParams.append('interests', filters.interests);
        }
        
        const response = await authenticatedRequest(`${window.config.API_URL}/profile?${queryParams.toString()}`);
        console.log('Profiles received:', response);
        return response;
    } catch (error) {
        console.error('Error fetching profiles:', error);
        throw error;
    }
}

// Send connection request
async function sendConnectionRequest(userId) {
    try {
        console.log('Sending connection request to user:', userId);
        // Ensure userId is a string and not an object
        const userIdStr = typeof userId === 'object' ? userId._id || userId.id : userId;
        console.log('Formatted user ID:', userIdStr);
        
        const response = await authenticatedRequest(
            `${window.config.API_URL}/connections/request`,
            'POST',
            { userId: userIdStr }
        );
        console.log('Connection request sent:', response);
        return response;
    } catch (error) {
        console.error('Error sending connection request:', error);
        throw error;
    }
}

// Create user card
function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card';
    card.innerHTML = `
        <div class="user-card-header">
            <h3>${user.firstName} ${user.lastName}</h3>
            <span class="user-role">${user.role}</span>
        </div>
        <div class="user-card-body">
            <p class="user-bio">${user.bio || 'No bio available'}</p>
            <div class="user-skills">
                ${user.skills && user.skills.length > 0 
                    ? user.skills.map(skill => `<span class="tag">${skill}</span>`).join('')
                    : 'No skills listed'}
            </div>
        </div>
        <div class="user-card-footer">
            <button class="btn btn-primary view-profile-btn" data-user-id="${user.user._id || user.user}">View Profile</button>
        </div>
    `;
    return card;
}

// Update user cards
function updateUserCards(users) {
    const userCards = document.getElementById('user-cards');
    const emptyState = userCards.querySelector('.empty-state');
    
    // Clear existing cards
    userCards.innerHTML = '';
    
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
                
                const filters = {
                    role: document.getElementById('role-filter').value,
                    skills: document.getElementById('skills-filter').value,
                    interests: document.getElementById('interests-filter').value
                };
                
                try {
                    const profiles = await getProfiles(filters);
                    updateUserCards(profiles);
                } catch (error) {
                    showError('Failed to fetch profiles. Please try again.');
                }
            });
        }
        
        // Handle view profile button clicks
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('view-profile-btn')) {
                const userId = e.target.dataset.userId;
                try {
                    console.log('Fetching profile for user:', userId);
                    const user = await authenticatedRequest(`${window.config.API_URL}/profile/user/${userId}`);
                    console.log('Profile data received:', user);
                    showUserModal(user);
                } catch (error) {
                    console.error('Error fetching profile:', error);
                    showError('Failed to load user profile. Please try again.');
                }
            }
        });
        
        // Handle send request button
        const sendRequestBtn = document.getElementById('send-request-btn');
        if (sendRequestBtn) {
            sendRequestBtn.addEventListener('click', async () => {
                const userId = sendRequestBtn.dataset.userId;
                try {
                    await sendConnectionRequest(userId);
                    showSuccess('Connection request sent successfully!');
                    closeUserModal();
                } catch (error) {
                    console.error('Error sending connection request:', error);
                    showError('Failed to send connection request. Please try again.');
                }
            });
        }
        
    } catch (error) {
        console.error('Error initializing discovery page:', error);
        showError('Failed to load discovery page. Please try again.');
    }
}

// Show user modal
function showUserModal(user) {
    const modal = document.getElementById('user-modal');
    const modalUserName = document.getElementById('modal-user-name');
    const modalUserRole = document.getElementById('modal-user-role');
    const modalUserBio = document.getElementById('modal-user-bio');
    const modalUserSkills = document.getElementById('modal-user-skills');
    const modalUserInterests = document.getElementById('modal-user-interests');
    const sendRequestBtn = document.getElementById('send-request-btn');
    
    modalUserName.textContent = `${user.firstName} ${user.lastName}`;
    modalUserRole.textContent = user.role;
    modalUserBio.textContent = user.bio || 'No bio available';
    
    modalUserSkills.innerHTML = user.skills && user.skills.length > 0
        ? user.skills.map(skill => `<span class="tag">${skill}</span>`).join('')
        : 'No skills listed';
    
    modalUserInterests.innerHTML = user.interests && user.interests.length > 0
        ? user.interests.map(interest => `<span class="tag">${interest}</span>`).join('')
        : 'No interests listed';
    
    // Store the user ID as a string
    const userId = user.user && user.user._id ? user.user._id : user.user;
    console.log('Setting user ID in button:', userId);
    sendRequestBtn.dataset.userId = userId.toString();
    
    modal.style.display = 'block';
}

// Close user modal
function closeUserModal() {
    const modal = document.getElementById('user-modal');
    modal.style.display = 'none';
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
