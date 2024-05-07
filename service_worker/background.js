import {defaultBlockRules} from "../assets/rules/defaultBlockRules.js";
import {socialMediaBlockRules} from "../assets/rules/socialMediaBlockRules.js";
import {gamingSiteRules} from "../assets/rules/gamesBlockRules.js";

let startTime;
let timerId;
let timeoutDuration;
const startSessionTimeout = async () => {
    startTime = Date.now();
    await chrome.storage.local.set({ startTime: startTime })
    timerId = setTimeout(sessionTimeout, timeoutDuration);
    // console.log("startSessionTimer", timeoutDuration,)
}

// Function to restart the timer with the remaining time when the first window is opened again
const restartTimer = async () => {
    const data = await chrome.storage.local.get(['timeLeft', 'loggedIn', 'sessionTimeout'])
    const pingInterval = setInterval(() => {
        chrome.runtime.sendMessage({
            status: "ping",
        });
    }, 20000); // Ping every 10 seconds
    if (!data.loggedIn || data.sessionTimeout) return;
    if (data.timeLeft) timeoutDuration = data.timeLeft;
    // console.log(timeoutDuration, "timeoutduration")
    await updateTimeInLocalStorage();
    startSessionTimeout()
}

// Listener for when a window is created
chrome.windows.onCreated.addListener(async () => {
    const data = await chrome.storage.local.get(['loggedIn', 'sessionTimeout', 'timeLeft'])
    chrome.windows.getAll({ populate: false }, async (windows) => {
        if (windows.length === 1) {
            if (data.loggedIn && data.sessionTimeout != true) {
                restartTimer();
            }
        }
    });
});

chrome.tabs.onCreated.addListener(async (tab) => {
    const data = await chrome.storage.local.get(['loggedIn', 'sessionTimeout'])
    if (data.loggedIn && data.sessionTimeout) {
        chrome.tabs.update(tab.id, { url: '../content/ui/sessionTimeout.html' });
        blockHttpsSearch();
    }
});

// Function to update time in local storage every minute
const updateTimeInLocalStorage = async () => {
    const intervalId = setInterval(async () => {
            const currentTime = Date.now();
            await chrome.storage.local.set({ timeLeft: timeoutDuration - (currentTime - startTime) })
            // console.log(timeoutDuration, currentTime, startTime, timeoutDuration - (currentTime - startTime), "  ", userData.loggedIn, "logedin", " sessionTimeout", userData.sessionTimeout)
            if (timeoutDuration - (currentTime - startTime) < 0) {
                sessionTimeout()
                clearInterval(intervalId);
            }
    }, 60000); // 60000 milliseconds = 1 minute
}


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

let ruleAdded = false;
// Function to block Google search URLs
const blockHttpsSearch = async () => {
    if(ruleAdded) return;
    const blockRule = {
        id: 999,
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
    ruleAdded = true;
}

// Function to allow Google search URLs
const allowHttpsSearchAsync = async () => {
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [999],
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
            await chrome.storage.local.set({ loggedIn: false, password: hash })
            if (chrome.runtime.lastError) {
                console.error('Error storing data:', chrome.runtime.lastError);
                sendResponse({ success: false });
            } else if (cpassword && password) {
                sendResponse({ success: true });
            }
        }
        catch (error) {
            console.error('Error hashing password:', error);
        }
    }
    else {
        // Confirm Password mismatch, send error response
        sendResponse({ success: false, error: 'Passwords do not match' });
    }
}

const kidsModeSignIn = async (password, checkedToggles, sessionTime, sendResponse) => {
    try {
        const data = await chrome.storage.local.get(['loggedIn', 'password']);
        const storedPassword = data.password;

        const hash = await hashPassword(password);

        if (storedPassword === hash) {

            try {
                chrome.action.setIcon({
                    path: "../assets/Logo_active.png",
                });
                                
                await injectServiceWorker(checkedToggles)
                timeoutDuration = sessionTime * 60 * 60 * 1000; //no. of hrs * 60 min
                await chrome.storage.local.set({ loggedIn: true, timeLeft: timeoutDuration })
                startSessionTimeout();
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
            }
            catch (error) {
                console.error('Error logging in:', error);
            }
        }
        else {
            // Password mismatch, send error response
            sendResponse({ success: false, error: 'Invalid password' });
        }

    } catch (error) {
        console.error('Error logging in:', error);
    }
}
// Function to handle user logout
const logoutUser = async (password, sendResponse) => {
    try {
        const data = await chrome.storage.local.get(['loggedIn', 'password'])
        const storedPassword = data.password;

        const hash = await hashPassword(password);

        // Check if the provided password matches the stored password
        if (storedPassword === hash) {
            chrome.action.setIcon({
                path: "../assets/Logo_inactive.png",
            });
            removeServiceWorker();
            clearTimeout(timerId);
            await chrome.storage.local.set({ loggedIn: false, sessionTimeout: false })

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
            sendResponse({ success: false, error: 'Invalid password' });
        }

    } catch (error) {
        console.error('Error logging out:', error);
        sendResponse({ success: false, error: 'An error occurred while logging out' });
    }
}

export const injectServiceWorker = async (checkedToggles) => {

    if(!checkedToggles) return;
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