const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  // Check if the user has a valid JWT token in the cookies (or session)
  const authToken = req.cookies.authToken; // Replace with your cookie name if different

  if (!authToken) {
    // If the token is not present, the user is not authenticated
    return res.redirect("/register"); // Redirect to the login page or handle unauthorized access
  }

  try {
    // Verify the JWT token
    const secretKey = "mysecret"; // Replace with your secret key
    const decodedToken = jwt.verify(authToken, secretKey);

    // If the token is valid, set the authenticated user information in the request object
    req.user = { _id: decodedToken._id };
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    // If the token is invalid or expired, handle unauthorized access
    res.redirect("/login"); // Redirect to the login page or handle unauthorized access
  }
}

module.exports = authMiddleware;
