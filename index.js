const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const app = express();
//rest API requirements
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());
app.use(
  session({
    secret: "tribe-secret",
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

//Models & routes
require("./models/Users");
require("./config/passport");
app.use(require("./api"));

var health = function(req, res, next) {
  return res.send({
    health: 100,
    message: "API ENDPOINT IS WORKING FINE"
  });
};

router.route("/").get(health);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/v1", router);

app.listen(3000);
console.log("App is listening on port 3000");
module.exports = app;
