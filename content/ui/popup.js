import { injectServiceWorker } from "../../service_worker/background.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const logoutForm = document.getElementById("logoutForm");

  await updatePopupContent();

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
  const cpasswordInput = document.getElementById("cpassword");
  const passwordInput = document.getElementById("password");
  const statusDiv = document.getElementById("status");

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
  const loginPassword = document.getElementById("loginPassword");
  const statusDiv = document.getElementById("status");
  const passwordInput = document.getElementById("password");
  const socialToggle = document.getElementById("blockSocialMediaCheckbox");
  const gamingToggle = document.getElementById("blockGamesCheckbox");
  //array to store toggle elements and their checked status for service worker injection
  const toggles = [
    { id: "socialMediaToggle", element: socialToggle, checked: false },
    { id: "gamingToggle", element: gamingToggle, checked: false },
  ];
  toggles.forEach((toggle) => {
    toggle.checked = toggle.element.checked;
  });
  const checkedToggles = toggles.filter((toggle) => toggle.checked);

  const pass = loginPassword.value;

  statusDiv.textContent = "";

  // Send login request to background script
  chrome.runtime.sendMessage(
    { action: "login", password: pass, checkedToggles: checkedToggles },
    async (response) => {
      if (response && response.success === true) {
        statusDiv.textContent = "Logged in successfully!";
        await updatePopupContent();
      } else {
        statusDiv.textContent = response.error;
        passwordInput.value = "";
      }
    }
  );
};

//logout
const logout = () => {
  const logoutPassword = document.getElementById("logoutPassword");
  const statusDiv = document.getElementById("status");
  const passwordInput = document.getElementById("password");

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
  const signUpContainer = document.getElementById("signUpContainer");
  const kidsContent = document.getElementById("kidsContent");
  const signInContainer = document.getElementById("signInContainer");
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