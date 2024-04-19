import {defaultBlockRules} from "../assets/rules/defaultBlockRules.js";
import {socialMediaBlockRules} from "../assets/rules/socialMediaBlockRules.js";
import {gamingSiteRules} from "../assets/rules/newsBlockRules.js";

// Hash password function
const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

// Function to start kids mode
const kidsModeSignUp = async (cpassword, password, sendResponse) => {
    if (cpassword === password) {
        try {
            const hash = await hashPassword(password)
            chrome.storage.local.set({ loggedIn: false, password: hash }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error storing data:', chrome.runtime.lastError);
                    sendResponse({ success: false });
                } else if (cpassword && password) {
                    console.log('Kids mode started successfully:', cpassword);
                    sendResponse({ success: true });
                }
            });
        }
        catch (error) {
            console.error('Error hashing password:', error);
        }
    }
    else {
        // Confirm Password mismatch, send error response
        sendResponse({ success: false, error: '*Passwords do not match' });
    }
}

const kidsModeSignIn = async (password, sendResponse) => {
    try {
        // Retrieve stored data
        const data = await new Promise((resolve, reject) => {
            chrome.storage.local.get(['loggedIn', 'password'], (data) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(data);
                }
            });
        });

        const storedPassword = data.password;

        // Hash the provided password
        const hash = await hashPassword(password);

        // Check if the provided password matches the stored password
        if (storedPassword === hash) {

            try {
                chrome.storage.local.set({ loggedIn: true }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error storing data:', chrome.runtime.lastError);
                        sendResponse({ success: false });
                    } else  {
                        console.log('Kids mode started successfully:');
                        sendResponse({ success: true });
    
                        // Close current windows
                        chrome.windows.getAll({ populate: true }, (windows) => {
                            windows.forEach((window) => {
                                chrome.windows.remove(window.id);
                            });
                        });
    
                        // Create a new window with Google
                        chrome.windows.create({
                            url: '../content/ui/home.html',
                            type: 'normal'
                        });
                    }
                });
            }
            catch (error) {
                console.error('Error logging in:', error);
            }}
            else {
                // Password mismatch, send error response
                sendResponse({ success: false, error: '*Invalid credentials' });
            }
        }catch(error){
            console.error('Error logging in:', error);
        }
}
// Function to handle user logout
const logoutUser = async (password, sendResponse) => {
    try {
        // Retrieve stored data
        const data = await new Promise((resolve, reject) => {
            chrome.storage.local.get(['loggedIn', 'password'], (data) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(data);
                }
            });
        });

        const storedPassword = data.password;

        // Hash the provided password
        const hash = await hashPassword(password);

        // Check if the provided password matches the stored password
        if (storedPassword === hash) {
            chrome.storage.local.set({loggedIn : false},)

            console.log('User logged out successfully');
            sendResponse({ success: true });

            // await allowHttpsSearchAsync();

            // Close current windows
            chrome.windows.getAll({ populate: true }, (windows) => {
                windows.forEach((window) => {
                    chrome.windows.remove(window.id);
                });
            });

            // Create a new window with Google
            chrome.windows.create({
                url: 'https://google.com',
                type: 'normal'
            });
        } else {
            sendResponse({ success: false, error: '*Invalid Credentials' });
        }
    } catch (error) {
        console.error('Error logging out:', error);
        sendResponse({ success: false, error: 'An error occurred while logging out' });
    }
}

export const injectServiceWorker = async (socialMediaChecked, gamingChecked) => {
    const rulesToInject = [];

    // Pushing defaultBlockRules and additional rules based on conditions
    rulesToInject.push(...defaultBlockRules);
    if (socialMediaChecked) {
        rulesToInject.push(...socialMediaBlockRules);
    }
    if (gamingChecked) {
        rulesToInject.push(...gamingSiteRules);
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rulesToInject
    });
}



export const deinjectServiceWorker = async (socialMediaChecked, gamingChecked) => {
    const oldRules = await chrome.declarativeNetRequest.getRules();
    const oldRulesIds =  oldRules.map(rule => rule.id);
    const newRules = [];

    // Pushing defaultBlockRules and additional rules based on conditions
    newRules.push(...defaultBlockRules);
    if (socialMediaChecked) {
        newRules.push(...socialMediaBlockRules);
    }
    if (gamingChecked) {
        newRules.push(...gamingSiteRules);
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRulesIds,
        addRules: newRules
    });
}


// Listener for messages from content scripts or UI components
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'register') {
        kidsModeSignUp(request.cpassword, request.password, sendResponse);
        return true;

    }else if (request.action === 'login') {
        kidsModeSignIn(request.password, sendResponse);
        return true;
    } else if (request.action === 'logout') {
        logoutUser(request.password, sendResponse);
        return true;
    }
});
