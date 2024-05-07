document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const logoutForm = document.getElementById("logoutForm");
  
  await updatePopupContent();

  setSessionTimer();

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
  const successStatusDiv = document.getElementById("successStatus");
  const errorStatusDiv = document.getElementById("errorStatus");


  const pass1 = cpasswordInput.value;
  const pass2 = passwordInput.value;

  successStatusDiv.textContent = "";
  errorStatusDiv.textContent = "";

  chrome.runtime.sendMessage(
    { action: "register", cpassword: pass1, password: pass2 },
    (response) => {
      if (response && response.success === true) {
        successStatusDiv.textContent = "Password set successfully!";
        updatePopupContent();
      } else {
        errorStatusDiv.textContent = response.error;
        cpasswordInput.value = "";
        passwordInput.value = "";
      }
    }
  );
};

//login
const login = async () => {
  const sessionTimeInput = document.getElementById("sessionTime");
  const loginPassword = document.getElementById("loginPassword");
  const successStatusDiv = document.getElementById("successStatus");
  const errorStatusDiv = document.getElementById("errorStatus");
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
  successStatusDiv.textContent = "";
  errorStatusDiv.textContent = "";

  const sessionTime = sessionTimeInput.value;
  // Send login request to background script
  chrome.runtime.sendMessage(
    { action: "login", password: pass, checkedToggles: checkedToggles, sessionTime: sessionTime },
    (response) => {
      if (response && response.success === true) {
                successStatusDiv.textContent = "Logged in successfully!";
        updatePopupContent();

      } else {
        errorStatusDiv.textContent = response.error;
        passwordInput.value = "";
      }
    }
  );
};

//logout
const logout = () => {
  const logoutPassword = document.getElementById("logoutPassword");
  const successStatusDiv = document.getElementById("successStatus");
  const errorStatusDiv = document.getElementById("errorStatus");
  const passwordInput = document.getElementById("password");

  const pass2 = logoutPassword.value;
  successStatusDiv.textContent = "";
  errorStatusDiv.textContent = "";

  chrome.runtime.sendMessage(
    { action: "logout", password: pass2 },
    (response) => {
      if (response && response.success === true) {
        successStatusDiv.textContent = "Logged out successfully!";
        updatePopupContent();
      } else {
        errorStatusDiv.textContent = response.error;
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
  await chrome.storage.local.get(["loggedIn"], (data) => {


    if (data.loggedIn) {
      // User is logged in
      signUpContainer.style.display = "none";
      signInContainer.style.display = "none";
      kidsContent.style.display = "block";
      updateTimeLeftUI()
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

const setSessionTimer = () => {
  // Get the input element
  const sessionTimeInput = document.getElementById("sessionTime");
  const sessionTimeSpan = document.getElementById("sessionTimeSpan");


  // Restrict input to numbers from 1 to 24
  sessionTimeInput.addEventListener('input', () => {
    let value = parseInt(sessionTimeInput.value);
    if (isNaN(value) || value < 1) {
      sessionTimeInput.value = 1; // Redirect to 1 if value is less than 1 or NaN
    } else if (value > 24) {
      sessionTimeInput.value = 24; // Redirect to 24 if value is greater than 24
    }
  });

    sessionTimeSpan.textContent = " Hr" 
}

// Function to fetch timeLeft from local storage and update UI
const updateTimeLeftUI = async () => {
  const timerDisplay = document.getElementById("timerDisplay");

    // Function to update the timer display
    const updateTimer = async () => {
        await chrome.storage.local.get("timeLeft", (data) => {
            let timeLeft = data.timeLeft;
            if (timeLeft !== undefined) {
        let hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        timerDisplay.textContent = "Time left : " + hours + "h " + minutes + "m ";
        if (timeLeft <= 0) {
                    clearInterval(intervalId);
          timerDisplay.textContent = "expired";
        }
      } else {
                clearInterval(intervalId);
        timerDisplay.textContent = "expired";
      }
    });
  };

  await updateTimer();

  const intervalId = setInterval(updateTimer, 60000);
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.status === "ping") {
    console.log("Received ping from service worker");
    return true;
  }
});