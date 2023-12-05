const express = require("express");
const cors = require("cors");
const fs = require("fs");
const summaries = require("./summaries.json");
const versions = require("./versions.json");
const sqlite3 = require("sqlite3").verbose();
const sha256 = require("js-sha256").sha256;
var http = require("http");
var https = require("https");

const app = express();
app.use(express.json());
app.use(cors());

// if there is no database, create one
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error(err.message);
  }
});

// create the tables if they don't exist
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS "web_vitals" (
      "id"	INTEGER NOT NULL UNIQUE,
      "date"	TEXT NOT NULL,
      "page"	TEXT NOT NULL,
      "message"	TEXT NOT NULL,
      PRIMARY KEY("id" AUTOINCREMENT)
    );`
  );
  db.run(
    `CREATE TABLE IF NOT EXISTS "users" (
      "id"	INTEGER NOT NULL UNIQUE,
      "username"	TEXT NOT NULL UNIQUE,
      "password_hash"	TEXT NOT NULL,
      PRIMARY KEY("id" AUTOINCREMENT)
    );`
  );
  db.run(`DELETE FROM "web_vitals" WHERE "message" = "[object Object]";`);
  // db.run(
  //   `INSERT INTO "users" ("username", "password_hash") VALUES ("ilabz", "${sha256("password")}")`
  // );
});

db.a;

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

// test endpoint
app.get("/test", (req, res) => {
  res.send({ message: "success" });
  console.log("test");
});

app.get("/info", (req, res) => {
  res.send({ message: "success" });
  console.log("info");
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

  db.get(usernameSql, usernameParams, (err, row) => {
    if (err) {
      console.log(err);
    }
    if (row) {
      username = row.username;
      if (row.password_hash === sha256(req.body.password)) {
        res.send({ message: "success", token: token });
        console.log();
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
  db.run(sql, params, (err) => {
    if (err) {
      console.log(err);
      res.send("error");
    } else {
      res.send("success");
    }
  });
  console.log("reportWebUsage");
});

app.get("/getwebusage", (req, res) => {
  let sql = `SELECT * FROM web_vitals`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.log(err);
    }
    res.send(rows);
  });
  console.log("getWebUsage");
});

http.createServer(app).listen(80, () => console.log("API is running on port 80"));
// app.listen(443, () => console.log("API is running on port 8080"));
https
  .createServer(
    {
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.cert"),
    },
    app
  )
  .listen(443, function () {
    console.log("API is running on port 443");
  });
