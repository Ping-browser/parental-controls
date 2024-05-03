document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const logoutForm = document.getElementById("logoutForm");
  const sessionTimeSelect = document.getElementById("sessionTime"); 
  const timerDisplay = document.getElementById("timerDisplay")

  await updatePopupContent();
  // displayTimer(sessionTimeSelect.value);


  setSessionTimer();
  resizeDropdown();

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
const login = async () => {
  const sessionTimeSelect = document.getElementById("sessionTime"); 
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

  const sessionTime = {value : sessionTimeSelect.value};
  // Send login request to background script
  await chrome.runtime.sendMessage(
    { action: "login", password: pass, checkedToggles: checkedToggles, sessionTime: sessionTime.value},
    async(response) => {
      if (response && response.success === true) {
        statusDiv.textContent = "Logged in successfully!";
        await updatePopupContent({sessionTime: sessionTime.value});
        
      } else {
        statusDiv.textContent = response.error + " login yyyy";
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
const updatePopupContent = async (args) => {
  const signUpContainer = document.getElementById("signUpContainer");
  const kidsContent = document.getElementById("kidsContent");
  const signInContainer = document.getElementById("signInContainer");
  let isLoggedInLocal = false;
  displayTimer(args)
  await chrome.storage.local.get("loggedIn", (data) => {
    if (data.loggedIn) {
      // User is logged in
      isLoggedInLocal = true;
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
  // if(isLoggedInLocal) 
  
};

const setSessionTimer = () => {
  // Get the select element
const sessionTimeSelect = document.getElementById("sessionTime");

// Array of numbers from 1 to 24
const hours = Array.from({ length: 24 }, (_, index) => index + 1);

// Iterate over the array to create options
hours.forEach(hour => {
const option = document.createElement("option");
option.value = hour;
option.text = hour + " Hr" + (hour !== 1 ? "s" : ""); // Pluralize "Hour" if hour is not 1
sessionTimeSelect.appendChild(option);
});
}

const resizeDropdown = () => {
  const selectElement = document.getElementById("sessionTime");

  selectElement.addEventListener('mousedown', () => {
    if (selectElement.options.length > 6) {
      selectElement.size = 6;
    }
  });

  selectElement.addEventListener('change', () => {
    selectElement.size = 0;
  });

  selectElement.addEventListener('blur', () => {
    selectElement.size = 0;
  });
};

const displayTimer = (args) => {
  const text = document.getElementById("custom")
  if(!args) text.textContent = "args not recieved";
  text.innerHTML = args
  // let sessionTime = args.sessionTime;
// var countDownDate = new Date().getTime() + sessionTime * 60 * 60 * 1000;

// text.textContent = "iiii" + sessionTime

// // Update the count down every 1 second
// var x = setInterval(() => {

//   var now = new Date().getTime();
//   var distance = countDownDate - now;

//   // Time calculations for days, hours, minutes and seconds
//   var days = Math.floor(distance / (1000 * 60 * 60 * 24));
//   var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//   var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
//   var seconds = Math.floor((distance % (1000 * 60)) / 1000);

//   // Display the result in the element with id="demo"
//   document.getElementById("timerDisplay").textContent = hours + "h "
//   + minutes + "m " + seconds + "s ";

//   // If the count down is finished, write some text
//   if (distance < 0) {
//     clearInterval(x);
//     if(sessionTime) document.getElementById("timerDisplay").textContent = sessionTime;
//     else document.getElementById("timerDisplay").textContent = "expired";
//   }
// }, 1000);

}
