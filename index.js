"use strict";

//mongoose file must be loaded before all other files in order to provide
// models to other modules
const express = require("express"),
  router = express.Router(),
  bodyParser = require("body-parser"),
  swaggerUi = require("swagger-ui-express"),
  swaggerDocument = require("./swagger.json"),
  session = require("express-session"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  crypto = require("crypto");

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

mongoose.connect(
  "mongodb+srv://test_user:1WnA1VLFXMQ6g34l@cluster0-fmmlf.mongodb.net/test?retryWrites=true&w=majority",
  { useUnifiedTopology: true, useNewUrlParser: true }
);

var UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  },
  name: { type: String },
  hash: String,
  salt: String,
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() }
});

UserSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, "sha512")
    .toString("hex");
};

UserSchema.methods.validatePassword = function(password) {
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, "sha512")
    .toString("hex");
  return this.hash === hash;
};

mongoose.model("User", UserSchema);
var User = require("mongoose").model("User");

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

require("./config/passport");

var health = function(req, res, next) {
  return res.send({
    health: 100,
    message: "API ENDPOINT IS WORKING FINE"
  });
};

//middleware for create
var createUser = function(req, res, next) {
  var userData = req.body;
  if (!userData.email) {
    return res.status(422).json({
      errors: {
        email: "is required"
      }
    });
  }

  if (!userData.password) {
    return res.status(422).json({
      errors: {
        password: "is required"
      }
    });
  }

  if (!userData.name) {
    return res.status(422).json({
      errors: {
        name: "is required"
      }
    });
  }
  var finalUser = new User(req.body);
  finalUser.setPassword(userData.password);

  finalUser.save(function(err) {
    if (err) {
      next(err);
    } else {
      res.json(finalUser);
    }
  });
};

var loginUser = function(req, res, next) {
  var user = req.body;
  console.log(user);

  if (!user.email) {
    return res.status(422).json({
      errors: {
        email: "is required"
      }
    });
  }

  if (!user.password) {
    return res.status(422).json({
      errors: {
        password: "is required"
      }
    });
  }

  return passport.authenticate(
    "local",
    { session: true },
    (err, passportUser, info) => {
      if (err) {
        console.log(err);
        return next(err);
      }

      if (passportUser) {
        const user = passportUser;

        return res.json({ user: user });
      }

      return res.status(400).json({
        errors: {
          login: "error occured"
        }
      });
    }
  )(req, res, next);
};

var updateUser = function(req, res, next) {
  User.findByIdAndUpdate(req.body._id, req.body, { new: true }, function(
    err,
    user
  ) {
    if (err) {
      next(err);
    } else {
      res.json(user);
    }
  });
};

var deleteUser = function(req, res, next) {
  req.user.remove(function(err) {
    if (err) {
      next(err);
    } else {
      res.json(req.user);
    }
  });
};

var getAllUsers = function(req, res, next) {
  User.find({}, "_id name email", function(err, users) {
    if (err) {
      next(err);
    } else {
      res.json(users);
    }
  });
};

var getOneUser = function(req, res) {
  res.json(req.user);
};

var getByIdUser = function(req, res, next, id) {
  User.findOne({ _id: id }, "_id name email", function(err, user) {
    if (err) {
      next(err);
    } else {
      req.user = user;
      next();
    }
  });
};

router.route("/").get(health);
router.route("/login").post(loginUser);

router
  .route("/users")
  .post(createUser)
  .get(getAllUsers);

router
  .route("/users/:userId")
  .get(getOneUser)
  .put(updateUser)
  .delete(deleteUser);

router.param("userId", getByIdUser);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/v1", router);

app.listen(3000);
console.log("App is listening on port 3000");
module.exports = app;
