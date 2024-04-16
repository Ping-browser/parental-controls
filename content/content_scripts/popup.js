document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const cpasswordInput = document.getElementById('cpassword');
    const passwordInput = document.getElementById('password');
    const password1 = document.getElementById('password1');
    const statusDiv = document.getElementById('status');
    const signUpContainer = document.getElementById('signUpContainer');
    const kidsContent = document.getElementById('kidsContent');
    const logoutButton = document.getElementById('logoutBtn');
    const password2 = document.getElementById('password2');
    const signInContainer = document.getElementById('signInContainer');

    // Function to update popup content based on login status
    const updatePopupContent = async () => {
        // Check if user is logged in
        const data = await new Promise((resolve, reject) => {
            chrome.storage.local.get('loggedIn', (data) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(data);
                }
            });
        });

        if (data.loggedIn) {
            // User is logged in
            signUpContainer.style.display = 'none';
            signInContainer.style.display = 'none';
            kidsContent.style.display = 'flex';
            kidsContent.style.flexDirection = 'column';
        } else if(data.loggedIn === false) {
            // User is not logged in
            signUpContainer.style.display = 'none';
            signInContainer.style.display = 'flex';
            signInContainer.style.flexDirection = 'column';
            kidsContent.style.display = 'none';
        }
        else{
            signUpContainer.style.display = 'flex';
            signUpContainer.style.flexDirection = 'column';
            signInContainer.style.display = 'none';
            kidsContent.style.display = 'none';
        }
    }

    // Update popup content when the popup is opened
    await updatePopupContent();

    // Event listener for login form submission
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const pass1 = cpasswordInput.value;
        const pass2 = passwordInput.value;

        statusDiv.textContent = '';

        try {
            // Send login request to background script
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: 'register', cpassword: pass1, password: pass2 }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });

            if (response && response.success === true) {
                statusDiv.textContent = 'Password set successfully!';
                await updatePopupContent();
            } else {
                statusDiv.textContent = 'Kids mode failed. Please try again.';
                cpasswordInput.value = '';
                passwordInput.value = '';
            }
        } catch (error) {
            console.error('Error registering:', error);
            statusDiv.textContent = 'An error occurred while registering';
        }
    });

    // Event listener for logout button
    loginForm.addEventListener('click', async (event) => {
        event.preventDefault();
        const pass1 = password1.value;

        statusDiv.textContent = '';

        try {
            // Send logout request to background script
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: 'login', password: pass1 }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });
            console.log(response)
            if (response && response.success === true) {
                statusDiv.textContent = 'Logged in successfully!';
                await updatePopupContent();
            } else {
                statusDiv.textContent = 'Failed to login.';
                passwordInput.value = '';
            }
        } catch (error) {
            console.error('Error logging in:', error);
            statusDiv.textContent = 'An error occurred while logging in.';
        }
    });

    // Event listener for logout button
    logoutButton.addEventListener('click', async (event) => {
        event.preventDefault();
        const pass2 = password2.value;

        statusDiv.textContent = '';

        try {
            // Send logout request to background script
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: 'logout', password: pass2 }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });

            if (response && response.success === true) {
                statusDiv.textContent = 'Logged out successfully!';
                console.log(response)
                
                await updatePopupContent();
            } else {
                statusDiv.textContent = 'Failed to logout.';
                passwordInput.value = '';
            }
        } catch (error) {
            console.error('Error logging out:', error);
            statusDiv.textContent = 'An error occurred while logging out.';
        }
    });
});
