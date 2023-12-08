const cors = require("cors");
const express = require("express");
const fs = require("fs");
const sha256 = require("js-sha256").sha256;
const mysql = require("mysql");
const summaries = require("./summaries.json");
const versions = require("./versions.json");
const app = express();
app.use(express.json());
app.use(cors());

let messages = [];

// if there is no backups folder, create one
const folderName = "./backups";
try {
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
  }
} catch (err) {
  console.error(err);
}

//backup the summaries every 6 hours
let versionNum = Object.keys(versions).length + 1;
const backupSummaries = () => {
  fs.writeFile(`./backups/summaries(${versionNum}).json`, JSON.stringify(summaries), (err) => {
    if (err) {
      console.log(err);
    }
  });
  versions[versionNum] = {
    date: new Date().toUTCString(),
  };
  fs.writeFile("./versions.json", JSON.stringify(versions), (err) => {
    if (err) {
      console.log(err);
    }
  });
  versionNum++;
};
backupSummaries();
setInterval(backupSummaries, 1000 * 60 * 60 * 6);

// build database
var connection = mysql.createConnection({
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  port: process.env.RDS_PORT,
});

connection.connect(function (err) {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  messages.push("Connected to database.");
});

connection.query("CREATE DATABASE IF NOT EXISTS strategy_unlocked", function (err, result) {
  if (err) throw err;
  messages.push("Database created");
});

connection.query("USE strategy_unlocked", function (err, result) {
  if (err) throw err;
  messages.push("Using database");
});

let createWebVitals = `create table if not exists web_vitals(
  id int primary key auto_increment,
  date varchar(255)not null,
  page varchar(255)not null,
  message varchar(255)not null
)`;
connection.query(createWebVitals, function (err, result) {
  if (err) throw err;
  messages.push("web_vitals table created");
});

let createUsers = `create table if not exists users(
  id int primary key auto_increment,
  username varchar(255)not null unique,
  password varchar(255)not null
)`;
connection.query(createUsers, function (err, result) {
  if (err) throw err;
  messages.push("users table created");
});

let insertUsers = `insert ignore into users(username,password) values('ilabz','password')`;
connection.query(insertUsers, function (err, result) {
  if (err) throw err;
  messages.push("users data inserted");
});

// test endpoint
app.get("/", (req, res) => {
  res.send({ message: "success" });
  console.log("test");
});

// console log
app.get("/messages", (req, res) => {
  res.send("messages: " + messages);
});

// get latest summaries
app.get("/getsummaries", (req, res) => {
  res.send(summaries);
  console.log("getSummaries");
});

//get a list of version numbers and update dates
app.get("/versions", (req, res) => {
  res.send({ versions });
  console.log("versions");
});

//get a specific version of summaries
app.get("/getsummaries/:version_num", (req, res) => {
  const version = req.params.version_num;
  const summaries = require(`./backups/summaries(${version}).json`);
  res.send(summaries);
  console.log(`getSummaries/version_${version}`);
});

// set summaries
app.post("/setsummaries", (req, res) => {
  summaries[req.body.id].summary = req.body.summary;
  fs.writeFile("./summaries.json", JSON.stringify(summaries), (err) => {
    if (err) {
      console.log(err);
    }
  });
  res.send("summaries updated");
  console.log("setSummaries");
});

//authenticate user
const token = "asibukj4bt283y9827305ih3o8reu94hy57tuirjnb3geyrf78v7ygfruej3mn4rht";

app.post("/checktoken", (req, res) => {
  if (req.body.token === token) {
    res.send({ message: "success", token: token });
  } else {
    res.send({ message: "access denied", token: req.body.token });
  }
  console.log("checkToken");
});

app.post("/gettoken", async (req, res) => {
  let usernameSql = `SELECT * FROM users WHERE username = ?`;
  let usernameParams = [req.body.username];

  connection.query(usernameSql, usernameParams, function (err, result) {
    if (err) throw err;
    if (result.length > 0) {
      if (result[0].password === req.body.password) {
        res.send({ message: "success", token: token });
      } else {
        res.send({ message: "Incorrect Password", token: "" });
      }
    } else {
      res.send({ message: "Incorrect Username", token: "" });
    }
  });
  console.log("getToken");
});

app.post("/reportwebusage", (req, res) => {
  let sql = `INSERT INTO web_vitals (date, page, message) VALUES (?, ?, ?)`;
  let params = [req.body.date, req.body.page, req.body.message];
  connection.query(sql, params, function (err, result) {
    if (err) throw err;
  });
  console.log("reportWebUsage");
});

app.get("/getwebusage", (req, res) => {
  let sql = `SELECT * FROM web_vitals`;
  connection.query(sql, function (err, result) {
    if (err) throw err;
    res.send(result);
  });
  console.log("getWebUsage");
});

app.listen(8080, () => console.log("API is running on port 8080"));
