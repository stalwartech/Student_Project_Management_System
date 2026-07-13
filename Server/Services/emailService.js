// Verification Email *** I dont think there shoukd be any need for this 
// Annoucement Email 
// Welcome Email 
// Forgot Password Email 
// Reminder Email (for assignments, quizzes, etc)

const  transporter = require("../Config/emailTransporter")


const AnnouncementEmail = (email, announcement) => {
    return {
        from: process.env.EMAIL_USER,
        subject: "Welcome to Inlcusion Agenda Academy",
        to: email,
        subject: 'New Announcement',
        html: `
            <h1>New Announcement</h1>
            <p>${announcement}</p>
        `
    }
}

const WelcomeEmail = async (email, name) => {
    await transporter.sendMail( {
        subject: "Welcome to Inlcusion Agenda Academy",
        from: process.env.EMAIL_USER,
        to: email,
        sender: "Inclusion Agenda Academy",
        html: `
            <h1>Welcome to LMS</h1>
            <p> Dear ${name},</p>
            <p>We are delighted to have you join our learning community. Your account has been successfully created, and you now have access to a platform designed to support your educational and professional growth.

                At Inclusion Agenda Academy, we are committed to providing quality learning experiences through engaging courses, practical resources, and a supportive environment that empowers learners to achieve their goals.

                What you can do next: <br>
                <ul>
                    <li> Log in to your account </li> 
                    <li> Complete your profile </li> 
                    <li> Explore available courses and learning resources </li>
                    <li> Begin your learning journey </li>
                </ul>



                We are excited to be part of your development and look forward to supporting your success every step of the way. <br>

                If you have any questions or require assistance, our support team is available to help. <br>

                Thank you for choosing Inclusion Agenda Academy. <br>

                Kind regards, <br>

                The Inclusion Agenda Academy Team <br>

                Email: support@inclusionagendaacademy.com <br>
                Website: www.inclusionagendaacademy.com <br>

                <span>© </span> 2026 Inclusion Agenda Academy. All rights reserved.</p>

        `
    })
}

const ForgotPasswordEmail = async (email, token) => {
    await transporter.sendMail( {
        subject: "Password Reset",
        from: process.env.EMAIL_USER,
        to: email,
        sender: "Inclusion Agenda Academy",
        html: `
            <h1>Password Reset</h1>
            <p>Click the link below to reset your password!</p>
            <button style="background-color: #4CAF50; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer;"><a href="${process.env.CLIENT_URL}/auth/reset-password/${token}">Reset Password</a></button>
        `
    })
}

const ReminderEmail = (email, reminder) => {
    return {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reminder',
        html: `
            <h1>Reminder</h1>
            <p>${reminder}</p>
        `
    }
}

module.exports = {
    // VerifyEmail,
    AnnouncementEmail,
    WelcomeEmail,
    ForgotPasswordEmail,
    ReminderEmail
}