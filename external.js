let response;
let current_page = window.location.href.replace(/^.*[\\\/]/, "");

// For login.html
if (current_page == "login.html") {
  const form = document.getElementById("submit");
  form.addEventListener("click", (event) => {
    document.getElementById("login_feedback").innerHTML = "Sending..";
    event.preventDefault();
    let input_username = document.getElementById("username").value;
    let input_password = document.getElementById("password").value;
    
    if (input_username == "" || input_password == "") {
      document.getElementById("login_feedback").innerHTML =
        "Username and/or password is empty!";
      return;
    }

    fetch("https://dummyjson.com/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: input_username,
        password: input_password,
        expiresInMins: 30, // optional, defaults to 60
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        response = data;
        localStorage.setItem("response", JSON.stringify(response));

        if (response.message == "Invalid credentials") {
          document.getElementById("login_feedback").innerHTML =
            "Username or password is invalid!";
        } else {
          document.getElementById("login_feedback").innerHTML = "Success!";
          window.setTimeout(() => {
            window.location.href = "recipes.html";
          }, 1000);
        }
      })
      .then(() => {
        console.log();
      });
  });
  
// For recipes.html
} else {
    /* TODO (instaboy): remove this debug on final commit bc localStorage 
     *                  keeps reseting after login during local testing.
     */
    fetch("https://dummyjson.com/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "emilys",
        password: "emilyspass",
        expiresInMins: 30, // optional, defaults to 60
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        response = data;
        localStorage.setItem("response", JSON.stringify(response));
      })
      .then(() => {
        console.log();
      });
      
    /* providing access token in bearer */
fetch('https://dummyjson.com/user/me', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJlbWlseXMiLCJlbWFpbCI6ImVtaWx5LmpvaG5zb25AeC5kdW1teWpzb24uY29tIiwiZmlyc3ROYW1lIjoiRW1pbHkiLCJsYXN0TmFtZSI6IkpvaG5zb24iLCJnZW5kZXIiOiJmZW1hbGUiLCJpbWFnZSI6Imh0dHBzOi8vZHVtbXlqc29uLmNvbS9pY29uL2VtaWx5cy8xMjgiLCJpYXQiOjE3NTk1NDk5NjIsImV4cCI6MTc1OTU1MTc2Mn0.BTsdWAt_6yD5JC0oqx5KnymJtJeF4_yyvU-aYy9T6ms', // Pass JWT via Authorization header
  },
  credentials: 'include' // Include cookies (e.g., accessToken) in the request
})
.then(res => res.json())
.then(console.log);

      
    const user = JSON.parse(localStorage.getItem("response"));
}
