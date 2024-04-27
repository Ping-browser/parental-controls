import { injectServiceWorker } from "../../service_worker/background.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const cpasswordInput = document.getElementById("cpassword");
  const passwordInput = document.getElementById("password");
  const password1 = document.getElementById("password1");
  const statusDiv = document.getElementsByClassName("status");
  const signUpContainer = document.getElementById("signUpContainer");
  const kidsContent = document.getElementById("kidsContent");
  const logoutForm = document.getElementById("logoutForm");
  const password2 = document.getElementById("password2");
  const signInContainer = document.getElementById("signInContainer");
  const socialToggle = document.getElementById("blockSocialMediaCheckbox");
  const gamingToggle = document.getElementById("blockGamesCheckbox");
  const loginButton = document.getElementById("loginBtn");
  const logoutButton = document.getElementById("logoutBtn");

  // Function to update popup content based on login status
  const updatePopupContent = async () => {
    // Check if user is logged in
    const data = await new Promise((resolve, reject) => {
      chrome.storage.local.get("loggedIn", (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });

    if (data.loggedIn) {
      // User is logged in
      signUpContainer.style.display = "none";
      signInContainer.style.display = "none";
      kidsContent.style.display = "flex";
      kidsContent.style.flexDirection = "column";
    } else if (data.loggedIn === false) {
      // User is not logged in
      signUpContainer.style.display = "none";
      signInContainer.style.display = "flex";
      signInContainer.style.flexDirection = "column";
      kidsContent.style.display = "none";
    } else {
      signUpContainer.style.display = "flex";
      signUpContainer.style.flexDirection = "column";
      signInContainer.style.display = "none";
      kidsContent.style.display = "none";
    }
  };

  // Update popup content when the popup is opened
  await updatePopupContent();

  // Event listener for login form submission
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const pass1 = cpasswordInput.value;
    const pass2 = passwordInput.value;

    statusDiv[0].textContent = "";

    try {
      // Send set password request to background script
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: "register", cpassword: pass1, password: pass2 },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          }
        );
      });

      if (response && response.success === true) {
        statusDiv[0].textContent = "Password set successfully!";
        await updatePopupContent();
      } else {
        statusDiv[0].textContent = response.error;
        cpasswordInput.value = "";
        passwordInput.value = "";
      }
    } catch (error) {
      console.error("Error registering:", error);
      statusDiv[0].textContent = "An error occurred while registering";
    }
  });

  // Event listener for login button
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const pass1 = password1.value;

    statusDiv[1].textContent = "";

    try {
      // Send logout request to background script
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: "login", password: pass1 },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          }
        );
      });
      if (response && response.success === true) {
        statusDiv[1].textContent = "Logged in successfully!";
        handleServiceWorkerInjection();
        await updatePopupContent();
      } else {
        statusDiv[1].textContent = response.error;
        passwordInput.value = "";
      }
    } catch (error) {
      // console.error('Error logging in:', error);
      statusDiv[1].textContent = "An error occurred while logging in.";
    }
  });

  // Event listener for logout button
  logoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const pass2 = password2.value;

    statusDiv[2].textContent = "";

    try {
      // Send logout request to background script
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: "logout", password: pass2 },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          }
        );
      });

      if (response && response.success === true) {
        statusDiv[2].textContent = "Logged out successfully!";
        await updatePopupContent();
      } else {
        statusDiv[2].textContent = response.error;
        passwordInput.value = "";
      }
    } catch (error) {
      console.error("Error logging out:", error);
      statusDiv[2].textContent = "An error occurred while logging out.";
    }
  });

  //an array to store toggle elements and their checked status for service worker injection
  const toggles = [
    { element: socialToggle, checked: false },
    { element: gamingToggle, checked: false },
  ];

  // Function to handle service worker injection based on toggle status and update the toggles array
  const handleServiceWorkerInjection = async () => {
    const checkedToggles = toggles.filter((toggle) => toggle.checked);

    switch (checkedToggles.length) {
      case 0:
        await injectServiceWorker(false, false);
        break;
      case 1:
        const [toggle] = checkedToggles;
        const type =
          toggle.element === socialToggle ? "social media" : "gaming";
        await injectServiceWorker(
          toggle.element === socialToggle,
          toggle.element === gamingToggle
        );
        break;
      case 2:
        await injectServiceWorker(true, true);
        break;
      default:
        console.log("Unknown toggle status");
    }
  };

  // Add event listeners to toggle elements
  toggles.forEach((toggle) => {
    toggle.element.addEventListener("change", function () {
      toggle.checked = this.checked;
      handleServiceWorkerInjection();
    });
  });
});