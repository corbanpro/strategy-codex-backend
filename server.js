const express = require("express");
const cors = require("cors");
const fs = require("fs");
const summaries = require("./summaries.json");
const versions = require("./versions.json");

const app = express();
app.use(express.json());
app.use(cors());

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
    date: new Date().toLocaleString() + " MST",
  };
  fs.writeFile("./versions.json", JSON.stringify(versions), (err) => {
    if (err) {
      console.log(err);
    }
  });
  versionNum++;
};
setInterval(backupSummaries, 1000 * 60 * 60 * 6);

// test endpoint
app.get("/test", (req, res) => {
  res.send({ message: "success" });
  console.log("test");
});

// get latest summaries
app.get("/getsummaries", (req, res) => {
  res.send(summaries);
  console.log(summaries);
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
  console.log("getSummaries/version");
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
const username = "ilabz";
const password = "password";

app.post("/checktoken", (req, res) => {
  if (req.body.token === token) {
    res.send({ message: "success", token: token });
  } else {
    res.send({ message: "access denied", token: req.body.token });
  }
  console.log("checkToken");
});

app.post("/gettoken", (req, res) => {
  if (req.body.username === username) {
    if (req.body.password === password) {
      res.send({ message: "success", token: token });
    } else {
      res.send({ message: "incorrect password", token: "" });
    }
  } else {
    res.send({ message: "incorrect username", token: "" });
  }
  console.log("getToken");
});

app.listen(8080, () => console.log("API is running on port 8080"));
