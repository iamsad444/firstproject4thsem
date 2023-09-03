const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const authMiddleware = require("./middlewares/auth");
const User = require("./models/user");
const Course = require("./models/course");

const app = express();
const port = 8000;

mongoose.connect("mongodb://127.0.0.1:27017/project_sugam", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Use the cookie-parser and express-session middlewares
app.use(cookieParser());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 86400000, // 1 day in milliseconds
      secure: false, // Set to true when using production with HTTPS
    },
  })
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.urlencoded({ extended: true }));

app.use("/static", express.static("static"));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.get("/elearn", (req, res) => {
  res.status(200).render("elearn.pug", { currentPage: "home" });
});

app.get("/about", (req, res) => {
  res.status(200).render("about.pug", { currentPage: "about" });
});

app.get("/students", (req, res) => {
  res.status(200).render("students.pug", { currentPage: "students" });
});

app.get("/teachers", (req, res) => {
  res.status(200).render("teachers.pug", { currentPage: "teachers" });
});

app.get("/help", (req, res) => {
  res.status(200).render("help.pug", { currentPage: "help" });
});
app.post("/help", (req, res) => {
  const { Name, Email, Message } = req.body; // Extract data from req.body

  const myData2 = new MessageContainer({
    Name,
    Email,
    Message,
  });

  myData2
    .save()
    .then(() => {
      res.send("Your message has been received successfully.");
    })
    .catch((error) => {
      console.error("Error while saving message:", error);
      res.status(500).send("An error occurred while saving your message.");
    });
});

app.listen(port, () => {
  console.log(`The app started running at port ${port}`);
});

// Function to validate fullname complexity
function isValidFullname(fullname) {
  const alphabetRegex = /^[a-zA-Z ]+$/;
  return alphabetRegex.test(fullname);
}

// Function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Function to validate phone number format
function isValidPhoneNumber(phoneno) {
  const digitsOnly = phoneno.replace(/\D/g, "");
  return digitsOnly.length === 10;
}

// Function to validate password complexity
function isValidPassword(password) {
  const minLength = 8;
  if (password.length < minLength) {
    return false;
  }

  return (
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*()_+{}\[\]:;<>,.?~\\\/-]/.test(password)
  );
}

// Function to validate password and confirmation password
function isValidPasswordAndConfirmation(password, password1) {
  return isValidPassword(password) && password === password1;
}

// Function to check if email exists in the database
async function isEmailExists(email) {
  try {
    const existingUser = await User.findOne({ email });
    return !!existingUser;
  } catch (error) {
    console.error("Error while checking email existence:", error);
    return false;
  }
}

// Register Get/Post
app.get("/", authMiddleware, (req, res) => {
  res.status(200).render("elearn.pug", { currentPage: "/" });
});
app.get("/register", (req, res) => {
  res.status(200).render("register", { currentPage: "/" });
});

app.post("/register", async (req, res) => {
  try {
    const { fullname, phoneno, email, password, password1 } = req.body;
    const errors = {};

    if (!isValidFullname(fullname)) {
      errors.fullname = "Invalid Username";
    }

    if (!isValidEmail(email)) {
      errors.email = "Invalid email address.";
    }

    const emailExists = await isEmailExists(email);
    if (emailExists) {
      errors.email = "Email already exists. Please choose a different email address.";
    }

    if (!isValidPhoneNumber(phoneno)) {
      errors.phoneno = "Enter a 10-digit number.";
    }

    if (!isValidPassword(password)) {
      errors.password =
        "Password should have at least 8 characters, including one uppercase letter, one lowercase letter, one digit, and one special character.";
    }

    if (!isValidPasswordAndConfirmation(password, password1)) {
      errors.password1 = "Passwords do not match or do not meet the criteria.";
    }

    if (Object.keys(errors).length > 0) {
      return res.render("register", { errors, fullname, phoneno, email });
    }

    const user = new User({
      fullname,
      phoneno,
      email,
      password,
    });
    await user.save();
    res.status(200).render("login.pug", { currentPage: "login" });
  } catch (err) {
    console.error(err);
    res.status(400).send("Error Saving user Details.");
  }
});

app.get("/login", (req, res) => {
  res.status(200).render("login.pug", { currentPage: "login" });
});

app.post("/login", async (req, res) => {
  const { email, loginpassword } = req.body;
  const errors = {};

  if (!isValidEmail(email)) {
    errors.email = "Invalid email address.";
  }

  if (Object.keys(errors).length > 0) {
    return res.render("login", { errors, email });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      errors.loginpassword = "Invalid email or password.";
      return res.render("login", { errors, email });
    }

    const isPasswordValid = await user.comparePassword(loginpassword);
    if (!isPasswordValid) {
      errors.loginpassword = "Invalid email or password.";
      return res.render("login", { errors, email });
    }

    // Generate the JWT token for the user
    const secretKey = "mysecret"; // Replace with your secret key
    const token = jwt.sign({ _id: user._id.toString() }, secretKey);

    // Set the token in an HTTP-only cookie with a specific name (e.g., "authToken")
    res.cookie("authToken", token, {
      httpOnly: true,
      maxAge: 86400000, // 1 day in milliseconds
      secure: false, // Set to true when using production with HTTPS
    });

    res.redirect("/elearn");
  } catch (err) {
    console.error(err);
    res.status(400).send("Error during login.");
  }
});

// Add a new route for logout
app.post("/logout", authMiddleware, (req, res) => {
  // Clear the session and log the user out
  req.session.destroy((err) => {
    if (err) {
      console.error("Error while destroying session:", err);
      res.status(500).send("An error occurred during logout.");
    } else {
      // Clear the HTTP-only "authToken" cookie to log the user out
      res.clearCookie("authToken");
      res.redirect("login"); // Respond with success status
    }
  });
});

// Route for creating a new course
app.post("/courses", authMiddleware, async (req, res) => {
  const { title, description, duration } = req.body;
  const studentId = req.user._id;
  const ds = +duration;

  try {
    // Create a new course object using the Course model
    const newCourse = new Course({
      title,
      description,
      duration: ds,
      instructor: studentId,
    });

    // Save the new course to the database
    await newCourse.save();
    res.redirect("/courses");
  } catch (err) {
    console.error("Error creating a new course:", err);
    res.status(500).json({ error: "An error occurred while creating the course." });
  }
});
// Route to get all courses
app.get("/courses", authMiddleware, async (req, res) => {
  const userId = req.user._id;
  try {
    const courses = await Course.find().populate("instructor").populate("enrolledStudents");
    // res.send({ courses, userId });
    res.render("course", { courses: courses, userId: userId });
  } catch (err) {
    console.error("Error fetching all courses:", err);
    res.status(500).json({ error: "An error occurred while fetching courses." });
  }
});

app.get("/courses/edit/:id", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user._id;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).send("Course not found");
    }

    res.render("edit", { courseId, userId, course });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("An error occurred while retrieving the course for editing");
  }
});

// Route to update a specific course by ID
app.post("/courses/edit/:id", authMiddleware, async (req, res) => {
  const courseId = req.params.id;
  const { title, description, duration } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid course ID." });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { $set: { title, description, duration } },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ error: "Course not found." });
    }

    res.redirect("/courses");
  } catch (err) {
    console.error("Error updating the course:", err);
    res.status(500).json({ error: "An error occurred while updating the course." });
  }
});
app.get("/courses/:id", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId).populate("instructor").populate("enrolledStudents");

    if (!course) {
      return res.status(404).send("Course not found");
    }

    res.render("singlecourse", { course: course });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("An error occurred while retrieving the course");
  }
});

// Route to delete a specific course by ID
app.get("/courses/delete/:id", authMiddleware, async (req, res) => {
  const courseId = req.params.id;

  try {
    const deletedCourse = await Course.deleteOne({ _id: courseId });
    if (!deletedCourse) {
      return res.status(404).json({ error: "Course not found." });
    }
    res.redirect("/courses");
  } catch (err) {
    console.error("Error deleting the course:", err);
    res.status(500).json({ error: "An error occurred while deleting the course." });
  }
});

// Route for enrolling a student in a course
app.get("/enroll/:courseId", authMiddleware, async (req, res) => {
  const courseId = req.params.courseId;
  const studentId = req.user._id;

  try {
    const course = await Course.findById(courseId);
    const student = await User.findById(studentId);

    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }

    if (course.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ error: "Student is already enrolled in the course." });
    }

    course.enrolledStudents.push(studentId);
    student.enrolledCourses.push(courseId);

    await course.save();
    await student.save();

    res.redirect("/courses");
  } catch (err) {
    console.error("Error enrolling the student:", err);
    res.status(500).json({ error: "An error occurred while enrolling the student." });
  }
});

// Route for unenrolling a student from a course
app.get("/unenroll/:courseId", authMiddleware, async (req, res) => {
  const courseId = req.params.courseId;
  const studentId = req.user._id;

  try {
    const course = await Course.findById(courseId);
    const student = await User.findById(studentId);

    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }

    // Check if the student is enrolled in the course
    if (!course.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ error: "Student is not enrolled in the course." });
    }

    // Remove the student ID from the enrolledStudents array to unenroll the student
    course.enrolledStudents = course.enrolledStudents.filter((id) => id.toString() !== studentId.toString());
    student.enrolledCourses = student.enrolledCourses.filter((course) => course.toString() !== courseId.toString());

    await course.save();
    await student.save();

    res.redirect("/courses");
  } catch (err) {
    console.error("Error unenrolling the student:", err);
    res.status(500).json({ error: "An error occurred while unenrolling the student." });
  }
});