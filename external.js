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
        const user = data;
        localStorage.setItem("response", JSON.stringify(user));

        if (user.message == "Invalid credentials") {
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
        const user = data;
        localStorage.setItem("response", JSON.stringify(user));
      })
      .then(() => {
        console.log();
      });
      
    const user = JSON.parse(localStorage.getItem("response"));
    console.log(user);
     fetch(`https://dummyjson.com/users/search?q=${user.username}`)
      .then(res => res.json())
      .then((data) => {
        const nuser = Object.keys(data.users).length;
        localStorage.setItem("nuser", nuser);
      });
    const nuser = localStorage.getItem("nuser");
      
    console.log(nuser);
    if(user == null || nuser !== 1) {
      localStorage.clear();
            window.location.href = "login.html";
    }
}
