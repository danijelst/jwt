// Simple Express server to serve static files
const express = require("express");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));

const PORT = 3000;
app.listen(PORT, () => console.log(`JWT Tool running at http://localhost:${PORT}`));
