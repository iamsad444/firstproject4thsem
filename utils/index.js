// Function to validate fullname complexity
module.exports = function isValidFullname(fullname) {
  const alphabetRegex = /^[a-zA-Z ]+$/;
  return alphabetRegex.test(fullname);
};

// Function to validate email format
module.exports = function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Function to validate phone number format
module.exports = function isValidPhoneNumber(phoneno) {
  const digitsOnly = phoneno.replace(/\D/g, "");
  return digitsOnly.length === 10;
};

// Function to validate password complexity
module.exports = function isValidPassword(password) {
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
};

// Function to validate password and confirmation password
module.exports = function isValidPasswordAndConfirmation(password, password1) {
  return isValidPassword(password) && password === password1;
};

// Function to check if email exists in the database
module.exports = async function isEmailExists(email) {
  try {
    const existingUser = await User.findOne({ email });
    return !!existingUser;
  } catch (error) {
    console.error("Error while checking email existence:", error);
    return false;
  }
};
