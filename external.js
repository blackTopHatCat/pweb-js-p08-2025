const form = document.getElementById("submit");
var response;

form.addEventListener("click", (event) => {
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
      localStorage.setItem("response", JSON.stringify(response))
    })
    .then(() => {
      console.log(response);
    });
});
