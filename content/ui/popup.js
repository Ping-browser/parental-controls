import { injectServiceWorker } from "../../service_worker/background.js";

let loginForm, registerForm, cpasswordInput, passwordInput, loginPassword, statusDiv, signUpContainer, kidsContent, logoutForm, logoutPassword, signInContainer, socialToggle, gamingToggle;

document.addEventListener("DOMContentLoaded", () => {
  loginForm = document.getElementById("loginForm");
  registerForm = document.getElementById("registerForm");
  cpasswordInput = document.getElementById("cpassword");
  passwordInput = document.getElementById("password");
  loginPassword = document.getElementById("loginPassword");
  statusDiv = document.getElementById("status");
  signUpContainer = document.getElementById("signUpContainer");
  kidsContent = document.getElementById("kidsContent");
  logoutForm = document.getElementById("logoutForm");
  logoutPassword = document.getElementById("logoutPassword");
  signInContainer = document.getElementById("signInContainer");
  socialToggle = document.getElementById("blockSocialMediaCheckbox");
  gamingToggle = document.getElementById("blockGamesCheckbox");

  updatePopupContent();

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    register();
  });                   

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    login();
  });

  logoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    logout();
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
const updatePopupContent = () => {

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




