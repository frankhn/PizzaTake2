const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const { join } = require("path");
const authConfig = require("./auth_config.json");
const autho0Mgmt = require("./management.js")
const app = express();
app.use(express.json())

if (!authConfig.domain || !authConfig.audience) {
  throw "Please make sure that auth_config.json is in place and populated";
}

app.use(morgan("dev"));
app.use(helmet());
app.use(express.static(join(__dirname, "public")));

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"]
});

app.post("/api/external", checkJwt, (req, res) => {
  var userId = req.user['sub'];
 // Add a custom rule
 // The namespaced claim will point to the /verified endpoint
   if (!req.user['https://quickstarts/api/verified']) {
     console.log(userId)
     res.send({
         msg: "Sorry, only verified emails may place an order. Please make sure to verify your email!"         

     });
   }
  // Update metadata for the user
 else{
  autho0Mgmt.updateUserMetadata(userId, req.body.pizzaName);
  res.send({
    msg: "Thank you for your order"
  });
 }
  
});

app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

app.get("/*", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});

process.on("SIGINT", function() {
  process.exit();
});

module.exports = app;
