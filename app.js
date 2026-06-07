const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const RateLimit = require("express-rate-limit");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const catalogRouter = require("./routes/catalog"); // Import routes for "catalog" area of site

const compression = require("compression");
const helmet = require("helmet");

const app = express();

// Set up rate limiter: maximum of twenty requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 10 seconds
  max: 60,
});
// Apply rate limiter to all requests
app.use(limiter);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'", "cdn.jsdelivr.net"],
      "img-src": ["'self'", "data:", "images.unsplash.com"],
    },
  })
);

app.use(compression()); // Compress all routes

app.use(express.static(path.join(__dirname, "backend", "public")));

// API and HTML Page Routes mapping from ecommerce backend
const authRoutes = require("./backend/src/routes/authRoutes");
const productRoutes = require("./backend/src/routes/productRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "backend", "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "backend", "public", "register.html"));
});

app.get("/account", (req, res) => {
  res.sendFile(path.join(__dirname, "backend", "public", "profile.html"));
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "backend", "public", "profile.html"));
});

app.get("/products", (req, res) => {
  res.sendFile(path.join(__dirname, "backend", "public", "products.html"));
});

app.get("/category", (req, res) => {
  res.sendFile(path.join(__dirname, "backend", "public", "category.html"));
});

app.get("/product", (req, res) => {
  res.sendFile(path.join(__dirname, "backend", "public", "product.html"));
});

app.get("/cart", (req, res) => {
  res.sendFile(path.join(__dirname, "backend", "public", "cart.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "backend", "public", "admin.html"));
});

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/catalog", catalogRouter); // Add catalog routes to middleware chain.

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
