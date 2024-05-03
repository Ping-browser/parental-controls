import {defaultBlockRules} from "../assets/rules/defaultBlockRules.js";
import {socialMediaBlockRules} from "../assets/rules/socialMediaBlockRules.js";
import {gamingSiteRules} from "../assets/rules/gamesBlockRules.js";

let startTime;
let timerId;
let timeoutDuration;
const startSessionTimeout = () => {
    startTime = Date.now();
    chrome.storage.local.set({startTime: startTime})
    timerId = setTimeout(sessionTimeout, timeoutDuration);
}

// Function to restart the timer with the remaining time when the first window is opened again
const restartTimer = async () => {

    await new Promise((resolve, reject) => {
        chrome.storage.local.get(['timeLeft'], (data) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(data);
            }

            if(data.timeLeft) timeoutDuration = data.timeLeft;
        });
    });
    startSessionTimeout()
}


// Listener for when a window is created
chrome.windows.onCreated.addListener(async () => {
    await chrome.storage.local.get(['loggedIn', 'sessionTimeout', 'timeLeft'], (data) => {
        chrome.windows.getAll({ populate: false }, async (windows) => {
            if (windows.length === 1) {
                if (data.loggedIn && data.sessionTimeout != true) {
                    restartTimer();
                    await injectServiceWorker()
                }
            }
        });
    });

});

chrome.tabs.onCreated.addListener(async (tab) => {
    await chrome.storage.local.get(['loggedIn', 'sessionTimeout'], (data) => {
        if (data.loggedIn && data.sessionTimeout) {
            chrome.tabs.update(tab.id, { url: '../content/ui/sessionTimeout.html' });
            blockHttpsSearch();
        }
    });
});

// Function to update time in local storage every minute
const updateTimeInLocalStorage = () => {
    setInterval(async () => {
        const currentTime = Date.now();
        await chrome.storage.local.set({ timeLeft: timeoutDuration - (currentTime - startTime) })
    }, 60000); // 60000 milliseconds = 1 minute
}

updateTimeInLocalStorage();

const sessionTimeout = async () => {

    // Perform necessary actions when the session times out
    await chrome.storage.local.set({ sessionTimeout: true }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error setting sessionTimeout flag:', chrome.runtime.lastError);
        }
    });
    chrome.windows.create({
        url: '../content/ui/sessionTimeout.html',
        type: 'normal'
    },
        chrome.windows.getAll({ populate: true }, (windows) => {
            windows.forEach((window) => {
                chrome.windows.remove(window.id);
            });
        })
    )
}

// Function to block Google search URLs
const blockHttpsSearch = async () => {
    const blockRule = {
        id: 1,
        priority: 1,
        action: {
            type: 'block'
        },
        condition: {
            urlFilter: 'https://*/*',
            resourceTypes: ['main_frame']
        }
    };

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [],
        addRules: [blockRule]
    });
}

// Function to allow Google search URLs
const allowHttpsSearchAsync = async () => {
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1],
        addRules: []
    }
    )}

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
            await chrome.storage.local.set({ loggedIn: false, password: hash }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error storing data:', chrome.runtime.lastError);
                    sendResponse({ success: false });
                } else if (cpassword && password) {
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

const kidsModeSignIn = async (password, checkedToggles, sessionTime, sendResponse) => {
    try {
        await chrome.storage.local.get(['loggedIn', 'password'], async (data) => {
            const storedPassword = data.password;

            const hash = await hashPassword(password);

            if (storedPassword === hash) {

                try {
                    await injectServiceWorker(checkedToggles)
                    timeoutDuration = sessionTime * 60 * 60 * 1000; //no. of hrs * 60 min
                    startSessionTimeout();
                    await chrome.storage.local.set({ loggedIn: true, timeLeft: timeoutDuration }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('Error storing data:', chrome.runtime.lastError);
                            sendResponse({ success: false });
                        } else {
                            sendResponse({ success: true });

                            // Close current windows
                            chrome.windows.getAll({ populate: true }, (windows) => {
                                windows.forEach((window) => {
                                    chrome.windows.remove(window.id);
                                });
                            });

                            // Create a new window
                            chrome.windows.create({
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
        });


    }catch(error){
        console.error('Error logging in:', error);
    }
}
// Function to handle user logout
const logoutUser = async (password, sendResponse) => {
    try {
        await chrome.storage.local.get(['loggedIn', 'password'], async (data) => {
            const storedPassword = data.password;

            const hash = await hashPassword(password);

            // Check if the provided password matches the stored password
            if (storedPassword === hash) {
                removeServiceWorker();
                clearTimeout(timerId);
                await chrome.storage.local.set({ loggedIn: false, sessionTimeout: false})

                sendResponse({ success: true });

                await allowHttpsSearchAsync();

                chrome.windows.getAll({ populate: true }, (windows) => {
                    windows.forEach((window) => {
                        chrome.windows.remove(window.id);
                    });
                });

                chrome.windows.create({
                    type: 'normal'
                });
            } else {
                sendResponse({ success: false, error: '*Invalid Credentials' });
            }
        });


    } catch (error) {
        console.error('Error logging out:', error);
        sendResponse({ success: false, error: 'An error occurred while logging out' });
    }
}

export const injectServiceWorker = async (checkedToggles) => {
    const rulesToInject = [];
    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRulesIds = oldRules.map(rule => rule.id);

    rulesToInject.push(...defaultBlockRules);

    checkedToggles.forEach((toggle) => {
        const {id}= toggle;
        switch (id) {
            case "socialMediaToggle":
                rulesToInject.push(...socialMediaBlockRules);
                break;
            case "gamingToggle":
                rulesToInject.push(...gamingSiteRules);
                break;
            default:
                console.log("Unknown toggle status");
        }
    });

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRulesIds,
        addRules: rulesToInject
    });
}

//remove all the rules on the session end
const removeServiceWorker = async () => {
    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRulesIds = oldRules.map(rule => rule.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRulesIds
    });
}


// Listener for messages from content scripts or UI components
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'register') {
        kidsModeSignUp(request.cpassword, request.password, sendResponse);
        return true;

    } else if (request.action === 'login') {
        kidsModeSignIn(request.password, request.checkedToggles, request.sessionTime, sendResponse);
        return true;
    } else if (request.action === 'logout') {
        logoutUser(request.password, sendResponse);
        return true;
    }
});
