const express = require("express");
const cors = require("cors");
const fs = require("fs");
const summaries = require("./summaries.json");

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

version = "1";
const backupSummaries = () => {
  fs.writeFile(`./backups/summaries(${version}).json`, JSON.stringify(summaries), (err) => {
    if (err) {
      console.log(err);
    }
  });
  console.log("summary backup complete - " + version + " - " + new Date());
  version++;
};

setInterval(backupSummaries, 1000 * 60 * 60);

app.get("/test", (req, res) => {
  res.send({ message: "success" });
});

app.get("/getsummaries", (req, res) => {
  res.send(summaries);
});

app.get("/getsummaries/:version_num", (req, res) => {
  const version = req.params.version_num;
  const summaries = require(`./backups/summaries(${version}).json`);
  res.send(summaries);
});

app.post("/setsummaries", (req, res) => {
  summaries[req.body.id].summary = req.body.summary;
  fs.writeFile("./summaries.json", JSON.stringify(summaries), (err) => {
    if (err) {
      console.log(err);
    }
  });
  res.send("summaries updated");
});

app.listen(8080, () => console.log("API is running on port 8080"));
