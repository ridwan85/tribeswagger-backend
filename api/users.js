const mongoose = require("mongoose");
const passport = require("passport");
const express = require("express");
const router = express.Router();
const Users = mongoose.model("Users");

router.post("/login", (req, res, next) => {
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
});

router.post("/users", (req, res, next) => {
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
  var finalUser = new Users(req.body);
  finalUser.setPassword(userData.password);

  finalUser.save(function(err) {
    if (err) {
      next(err);
    } else {
      res.json(finalUser);
    }
  });
});

router.get("/users", (req, res, next) => {
  Users.find({}, "_id name email", function(err, users) {
    if (err) {
      next(err);
    } else {
      res.json(users);
    }
  });
});

router.get("/users/:id", (req, res, next) => {
  let id = req.params.id;

  Users.findOne({ _id: id }, "_id name email", function(err, user) {
    if (err) {
      console.log(err);
    } else {
      req.user = user;
      return res.json(user);
    }
  });
});

router.put("/users/:id", (req, res, next) => {
  console.log(req.body);
  Users.findByIdAndUpdate(req.params.id, req.body, { new: true }, function(
    err,
    user
  ) {
    if (err) {
      next(err);
    } else {
      res.json(user);
    }
  });
});

router.delete("/users/:id", (req, res, next) => {
  Users.findOneAndRemove(req.params.id, function(err, output) {
    if (err) {
      res.send(err);
    }
    return res.json({ message: "Data Deleted!" });
  });
});

module.exports = router;
