const jwt = require("jsonwebtoken");

const generateToken = async (User) => {
    const token = jwt.sign({id: User._id, premium: User.isPremium, role: User.role }, process.env.SECRET_KEY, { expiresIn: "30d" });
    return token;
}

module.exports = generateToken