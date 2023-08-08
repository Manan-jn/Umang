require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const TwitterStrategy = require("passport-twitter");
const _ = require("lodash");

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://manan:1234@mycluster.7utjixy.mongodb.net/userDatabase",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  twitterId: String,
});

const itemsSchema = {
  name: String,
};
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const Item = mongoose.model("Item", itemsSchema);
const User = new mongoose.model("User", userSchema);

const default1 = new Item({
  name: "Write your thoughts daily in a diary",
});
const default2 = new Item({
  name: "Exercise for atleast 1.5 hrs a day",
});
const default3 = new Item({
  name: "<-- Hit this checkbox to delete an item",
});
const defaultItems = [default1, default2, default3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
/////////////////////////GOOGLE STRATEGY///////////////////////////////
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/dashboard",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate(
        { username: profile.displayName, googleId: profile.id },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);
//////////////////////TWITTER STRATEGY//////////////////////
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_KEY,
      consumerSecret: process.env.TWITTER_SECRET,
      callbackURL: "http://localhost:3000/auth/twitter/dashboard",
    },
    function (token, tokenSecret, profile, cb) {
      User.findOrCreate({ twitterId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

/////////////////////FACEBOOK STRATEGY///will be added once hosted(privacy issue of http on FB)///

app.get("/", function (req, res) {
  res.render("homePage");
});

//////////////////GOOOGLE ROUTES/////////////////////
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/dashboard",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/dashboard");
  }
);

//////////////////TWITTER ROUTES///////////////////////
app.get("/auth/twitter", passport.authenticate("twitter"));

app.get(
  "/auth/twitter/dashboard",
  passport.authenticate("twitter", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/dashboard");
  }
);

app.get("/login", function (req, res) {
  res.render("loginSignup");
});

app.get("/register", function (req, res) {
  res.render("loginSignup");
});

app.get("/dashboard", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("mainDashboard");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/dashboard");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/dashboard");
      });
    }
  });
});

app.get("/journal", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log("Error");
        } else {
          console.log("Succesfully added");
        }
      });
      res.redirect("/journal");
    } else {
      res.render("list", {
        listTitle: "Mental health goals to achieve",
        newItems: foundItems,
      });
    }
  });
});

app.post("/journal", function (req, res) {
  let itemName = req.body.toDo;
  const listName = req.body.list;

  const userItem = new Item({
    name: itemName,
  });

  if (listName === "Mental health goals to achieve") {
    userItem.save();
    res.redirect("/journal");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(userItem);
      foundList.save();
      res.redirect("/journal" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  let checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Mental health goals to achieve") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log("Error removing the checked item");
      } else {
        console.log("Succesfully removed the checked item from the list");
        res.redirect("/journal");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/journal" + listName);
        }
      }
    );
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/journal" + customListName);
      } else {
        //show the existing lis
        res.render("list", {
          listTitle: foundList.name,
          newItems: foundList.items,
        });
      }
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server started on port 3000");
});
