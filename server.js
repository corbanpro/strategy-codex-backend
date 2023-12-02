const express = require("express");
const cors = require("cors");
const fs = require("fs");
const summaries = require("./summaries.json");
const versions = require("./versions.json");

const folderName = "./backups";
try {
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
  }
} catch (err) {
  console.error(err);
}

const app = express();
app.use(express.json());
app.use(cors());

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

app.get("/test", (req, res) => {
  res.send({ message: "success" });
  console.log("test");
});

app.get("/getsummaries", (req, res) => {
  res.send(summaries);
  console.log("getSummaries");
});

app.get("/versions", (req, res) => {
  res.send({ versions });
  console.log("versions");
});

app.get("/getsummaries/:version_num", (req, res) => {
  const version = req.params.version_num;
  const summaries = require(`./backups/summaries(${version}).json`);
  res.send(summaries);
  console.log("getSummaries/version");
});

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

app.listen(8080, () => console.log("API is running on port 8080"));
