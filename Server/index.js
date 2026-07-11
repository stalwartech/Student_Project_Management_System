const express = require('express');
const ConnectDB = require("./Config/database.js");
const env = require('dotenv').config();
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

ConnectDB();

app.listen(port, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});
