const express = require("express");
const path = require("path");

const router = express.Router();

/* GET home page. */
router.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "..", "backend", "public", "index.html"));
});

module.exports = router;
module.exports = router