const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;
const SERVER_NAME = process.env.SERVER_NAME || "backend";

app.get("/", (req, res) => {
  res.json({
    message: "Response from backend server",
    server: SERVER_NAME,
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`${SERVER_NAME} started on port ${PORT}`);
});