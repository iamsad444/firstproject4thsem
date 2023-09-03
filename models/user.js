const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  phoneno: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  enrolledCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
});

// Hash the password before saving the user to the database
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    const saltRounds = 10;
    user.password = await bcrypt.hash(user.password, saltRounds);
  }
  next();
});

// Compare hashed passwords during login
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};
const User = mongoose.model("User", userSchema);
module.exports = User;
