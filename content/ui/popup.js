import { injectServiceWorker } from "../../service_worker/background.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const cpasswordInput = document.getElementById("cpassword");
const passwordInput = document.getElementById("password");
const loginPassword = document.getElementById("loginPassword");
const statusDiv = document.getElementById("status");
const signUpContainer = document.getElementById("signUpContainer");
const kidsContent = document.getElementById("kidsContent");
const logoutForm = document.getElementById("logoutForm");
const logoutPassword = document.getElementById("logoutPassword");
const signInContainer = document.getElementById("signInContainer");
const socialToggle = document.getElementById("blockSocialMediaCheckbox");
const gamingToggle = document.getElementById("blockGamesCheckbox");

document.addEventListener("DOMContentLoaded", async () => {

  await updatePopupContent();

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await register();
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await login();
  });

  logoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await logout();
  });
});


//register
const register = () => {
  const pass1 = cpasswordInput.value;
  const pass2 = passwordInput.value;

  statusDiv.textContent = "";

      chrome.runtime.sendMessage(
        { action: "register", cpassword: pass1, password: pass2 },
        (response) => {
          if (response && response.success === true) {
            statusDiv.textContent = "Password set successfully!";
            updatePopupContent();
          } else {
            statusDiv.textContent = response.error;
            cpasswordInput.value = "";
            passwordInput.value = "";
          }
        }
      ); 
};

//login
const login = () => {
  const pass = loginPassword.value;

  statusDiv.textContent = "";

    // Send login request to background script
    chrome.runtime.sendMessage(
        { action: "login", password: pass },
        (response) => {
          if (response && response.success === true) {
            statusDiv.textContent = "Logged in successfully!";
            toggles.forEach((toggle) => {
              toggle.checked=toggle.element.checked;
            });
            handleServiceWorkerInjection();
            updatePopupContent();
          } else {
            statusDiv.textContent = response.error;
            passwordInput.value = "";
          }
        }
      );
};

//logout
const logout = () => {
  const pass2 = logoutPassword.value;

  statusDiv.textContent = "";

      chrome.runtime.sendMessage(
        { action: "logout", password: pass2 },
        (response) => {
          if (response && response.success === true) {
            statusDiv.textContent = "Logged out successfully!";
            updatePopupContent();
          } else {
            statusDiv.textContent = response.error;
            passwordInput.value = "";
          }
        }
      );
};

// Function to update popup content based on login status
const updatePopupContent = async () => {

    chrome.storage.local.get("loggedIn", (data) => {
      if (data.loggedIn) {
        // User is logged in
        signUpContainer.style.display = "none";
        signInContainer.style.display = "none";
        kidsContent.style.display = "block";
      } else if (data.loggedIn === false) {
        // User is not logged in
        signUpContainer.style.display = "none";
        signInContainer.style.display = "block";
        kidsContent.style.display = "none";
      } else {
        signUpContainer.style.display = "block";
        signInContainer.style.display = "none";
        kidsContent.style.display = "none";
      }
    });
};

//array to store toggle elements and their checked status for service worker injection
const toggles = [
  { id: "socialMediaToggle", element: socialToggle, checked: false },
  { id: "gamingToggle", element: gamingToggle, checked: false },
];

// Function to handle service worker injection based on toggle status and update the toggles array
const handleServiceWorkerInjection = async () => {
  const checkedToggles = toggles.filter((toggle) => toggle.checked);
  await injectServiceWorker(checkedToggles);
};




