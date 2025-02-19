const userModel = require('../models/User');
const Otp = require('../models/otp');
const bcrypt = require('bcrypt');
const passport = require('passport');
const mailer = require('./GoogleAuthController');



const otpPage = (req, res )=> {
    res.render('user/forgotOtp')
}

// forgot password, email sending page
const forgotPassword = async(req, res ) => {


    try {
        res.render('user/forgetPass')
    } catch (error) {
        conosle.log('error in render forgot password page:',error.message)
    }
}

//generate random otp
const randomOtp = async () => {
    return Math.floor(1000 + Math.random() * 9000);
}


// check emailand goes to otp page
const forgotPasswordEmail = async (req, res) => {
    try {
        const {email} = req.body;
        req.session.email = email;
        const isUser = await userModel.findOne({email:email})
        if(!isUser){
            console.log('user is not already exist');
           return res.status(400).json({message: 'user email is not found, please try again'});
        }
        if(isUser.isGoogleUser){
            console.log('google user cannot login directly ');
           return res.status(400).json({message: 'please signup using google Sign-In or signup to continue'});
        }
        const existingOtp = await Otp.findOneAndDelete({ email: email });

        //otp generate 
        const g_otp = (await randomOtp()).toString();
        const hashedOtp = await bcrypt.hash(g_otp, 10)
        const msg = '<p> Hi,your email: <b>' + email + '</b>, </br> <h4> has get one otp:' + g_otp + '</h4> </p>'

        //save otp in model
        const otpData = new Otp({
            email: email,
            otp: hashedOtp,
            Date: new Date()
        })
        const userOtp = await otpData.save();

        //send otp to user
        mailer.sendMail(email, 'Otp Verification', msg);
      
        // deleting the doc after 2 min
        setTimeout(async () => {
            try {
                await Otp.findOneAndDelete({ otp: userOtp.otp });
                // res.render('user/forgotOtp', { show: "Otp time out, resend otp.", isError: true })

            } catch (error) {
                console.log('2 minutes error:', error.message);
            }
        }, 120000);
        res.status(200).json({message : 'successful email validation'})
       
    } catch (error) {
        console.log('error in email sending:',error.message);
        res.status(400).json({message: 'user email is not found'});
    }
}

//verify otp and enter into homepage
const verifyOtp = async (req, res) => {
    try {
        const otpDigits = [
            req.body.otpDigit1,
            req.body.otpDigit2,
            req.body.otpDigit3,
            req.body.otpDigit4
        ]

        // Check if any OTP digit is missing or not a number
        const missingOrInvalidDigit = otpDigits.some(digit => !digit || isNaN(digit));
        if (missingOrInvalidDigit) {
            res.render('user/forgotOtp', { show: "Invalid otp.", isError: true })
            return;
        }
        const enteredOtp = otpDigits.join('');
        const email = req.session.email;

        //retrieve otp data from database
        const userValue = await Otp.findOne({ email })

        //if retrieve data from data base check otp and enter to home page
        if (userValue) {
            if (userValue.email === email) {
                const otpMatch = await bcrypt.compare(enteredOtp, userValue.otp);
                console.log(otpMatch)
                if (otpMatch) {
                    await Otp.findOneAndDelete({ otp: userValue.otp });

                   
                    res.render('user/forgetPassChange');
                } else {
                    res.render('user/forgotOtp', { show: "otp is not matching, please enter the correct otp.", isError: true })
                }
            } else {
                res.render('user/forgotOtp', { show: "Invalid otp.", isError: true })
            }
        } else {
            res.render('user/forgotOtp', { show: "Invalid otp.", isError: true })
        }
    } catch (error) {
        console.log("verify otp:", error.message)
    }
}

//resend otp 
const resendOtp = async (req, res) => {
    try {
            const email = req.session.email;
            
            //find and delete old otp data
            const existingOtp = await Otp.findOneAndDelete({ email: email });

            //generate otp
            const g_otp = (await randomOtp()).toString();
            const hashedOtp = await bcrypt.hash(g_otp, 10);
            const message = "Hello! Your email <b>" + email + "</b> has received an OTP: <b>" + g_otp + "</b>."
            //save otp in model
            const otpData = new Otp({
                email: email,
                otp: hashedOtp,
                Date: new Date()
            })
            const userOtp = await otpData.save();
            //send email containing otp
            mailer.sendMail(email, 'Otp Verification', message);
            res.render('user/forgotOtp', { show: "otp resend successfully.please check your email.", isError: false })
            // deleting the doc after 2 min
            setTimeout(async () => {
                try {
                    await Otp.findOneAndDelete({ otp: userOtp.otp });
                    //  res.render('user/otpPage',{show:"otp verifying timeout. resend otp.",isError:true}) 
                    console.log('otp deleted after 2 minutes');
                } catch (error) {
                    console.log('2 minutes error:', error.message);
                }
            }, 120000);
    } catch (error) {
        console.log("resend error: ", error.message)
    }
}


const changePassword = async(req, res) => {
    try {
        const { newpassword, confirmPassword } = req.body;
        const email = req.session.email;
        const user = await userModel.findOne({email});
        
        const hashedPassword = await bcrypt.hash(newpassword, 10);
        user.password = hashedPassword;
        await user.save();
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.render('user/login-page',{message: 'login again using new password'});
    } catch (error) {
        console.log('error in changing password',error.message);
    }
}

module.exports = {
    forgotPassword,
    forgotPasswordEmail,
    otpPage,
    verifyOtp,
    resendOtp,
    changePassword
}