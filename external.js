let response;
let current_page = window.location.href.replace(/^.*[\\\/]/, "");

if (current_page == "login.html") {
  const form = document.getElementById("submit");
  form.addEventListener("click", (event) => {
    document.getElementById("login_feedback").innerHTML = "Sending..";
    event.preventDefault();
    let input_username = document.getElementById("username").value;
    let input_password = document.getElementById("password").value;

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

        if (
          response.message == "Invalid credentials" ||
          input_username == "" ||
          input_password == ""
        ) {
          document.getElementById("login_feedback").innerHTML =
            "Username or password is invalid!";
        } else {
          document.getElementById("login_feedback").innerHTML = "Success!";
          window.location.href = 'shop.html'; 
        }
      })
      .then(() => {
        console.log();
      });
  });
}
