const express = require("express");
const cors = require("cors");
const fs = require("fs");
const summaries = require("./summaries.json");

const app = express();
app.use(express.json());
app.use(cors());

app.get("/getsummaries", (req, res) => {
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

app.listen(8080, () => console.log("API is running on http://localhost:8080"));
