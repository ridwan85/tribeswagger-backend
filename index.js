"use strict";

//mongoose file must be loaded before all other files in order to provide
// models to other modules
const express = require("express"),
  router = express.Router(),
  bodyParser = require("body-parser"),
  swaggerUi = require("swagger-ui-express"),
  swaggerDocument = require("./swagger.json"),
  passport = require("passport"),
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

var app = express();

//rest API requirements
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());

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
  const {
    body: { user }
  } = req;

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
    { session: false },
    (err, passportUser, info) => {
      if (err) {
        return next(err);
      }

      if (passportUser) {
        const user = passportUser;
        user.token = passportUser.generateJWT();

        return res.json({ user: user.toAuthJSON() });
      }

      return status(400).info;
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
