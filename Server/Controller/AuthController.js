const authModel = require('../Model/User');
const generateToken = require('../Util/generateToken');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const env = require("dotenv").config();
const crypto = require("crypto");
const emailService = require("../Services/emailService");
const Register = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        // Check if user exists
        const userExist = await authModel.findOne({ email });
        if (userExist) {
            return res.status(400).json({ status: false, message: "Email already exist" });
        }

        // If User doesnt exist, then hash the password of t he new user
        const hashPassword = await bcrypt.hash(password, 10);        
       
        // Save the data of the user to the database system
        const User = await authModel.create({
            fullName,
            email,
            password: hashPassword,
        });


        // Generate a token
        const token = generateToken(User);
        
        // Send a welcome email to the user
        const welcomeEmail = emailService.WelcomeEmail(email, fullName);  
        res.status(201).json({User: User, token});
        
    
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" , error: error.message});
    }
};

const Login = async(req, res) => {
    try {
        const { email, password } = req.body;
        // Check if email exists 
        const User = await authModel.findOne({ email });
        // console.log(User)

        if(!User){
            return res.status(400).json({ message: "Email not found" });
        }

        // Compare the password and the hashed password 
        const comparePassword = await bcrypt.compare(password, User.password);
        if(!comparePassword){
            return res.status(400).json({ message: "Password is incorrect" });
        }

        // Generate a token 
        const token = generateToken(User);
        
        // If they match then return the user details
        res.status(200).json({User, token});
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const User = await authModel.findOne({ email });
        if(!User){
            return res.status(400).json({ message: "Invalid email" });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        User.resetPasswordToken = hashedToken;
        User.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await User.save();

        await emailService.ForgotPasswordEmail(email, resetToken);
        res.status(200).json({ message: "Password reset link has been sent to your email" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}



const resetPassword = async (req, res) => {
    try {
        const { resetToken } = req.params; // Get the token from the URL parameters gotten from the email link
        const { newPassword } = req.body; // Get the new password from the request body

        console.log(req.params)
        console.log(req.body);

        const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // Hash the token from the URL to compare with the hashed token in the database
        const User = await authModel.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
        if (!User) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        User.password = await bcrypt.hash(newPassword, 10);
        User.resetPasswordToken = undefined;
        User.resetPasswordExpire = undefined;


        await User.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

module.exports = { Register, Login, forgotPassword, resetPassword };