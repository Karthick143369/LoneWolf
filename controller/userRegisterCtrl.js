const UserModel = require("../models/User");
let bcrypt =  require('bcryptjs');
// const generateToken = require("../utils/generateToken");
let asycHandler = require('express-async-handler');
const mailer = require("./GoogleAuthController");
const Otp = require("../models/otp");
const product = require('../models/product');
const userModel = require('../models/User');
let {validationResult} = require('express-validator');
const productOfferModel = require('../models/productOffer');
const categoryOfferModel = require('../models/categoryOffer');




// @desc Register User
// @route  api/v1/users/register
// @access private/admin

let userRegistercntrl = asycHandler(async (req, res) => {
  let { name, email, password } = req.body;
  console.log(req.body);
  try {
    let userExits = await UserModel.findOne({ email });
  console.log(userExits);
  if (userExits) {
    // throw new Error('User Already Exits');
    return res.status(400).json({
      message: 'User already exits'
    });
  }
  let saltRounds = await bcrypt.genSalt(10);
  let hashedPassword = await bcrypt.hash(password, saltRounds);
  req.session.otpUser = {
    name:name,
    email,
    hashedPassword
  }
    //otp send 
    //session email
    //sussfullfully send after redirect otp page
    
  let newUser = await UserModel.create({
    name:name,
    email,
    password: hashedPassword
  });

  return res.status(200).json({
    status: 'Success',
    message: 'User Created Successfully',
    data: newUser
  });
  } catch (error) {
    // console.log(error);
  }
  //checks user exits
  
});


const homeRoute = async (req, res) => {
  try {
    const user = req.session.isUser;
    const userId = req.session.userId
    const page = parseInt(req.query.page) || 1; // Current page number (default 1)
    const limit = parseInt(req.query.limit) || 4; // Items per page (default 10)
    const skip = (page - 1) * limit; // Number of items to skip
    const totalProducts = await product.countDocuments(); // Total number of products
    const totalPages = Math.ceil(totalProducts / limit); // Total pages

    // Fetch products with pagination
    const products = await product.find({ isActive: true, })
      .populate('brand', 'name') // Assuming brand schema has 'name'
      .populate('category', 'name') // Assuming category schema has 'name'
      .skip(skip)
      .limit(limit);
    // const currentDate = new Date();
    let categoryOffers = []; 
    let productOffers = [];
    const currentDate = new Date(); 
    productOffers = await productOfferModel.find({startDate: { $lte: currentDate }}).populate('products');
    categoryOffers = await categoryOfferModel.find({startDate: { $lte: currentDate }}).populate('categories');

    if (user) {
      const usercheck = await UserModel.findOne({ _id: userId, isBlocked: false }); 
      if (usercheck) {
        res.render('user/homePage', { No_icons: false, products, user: user, currentPage: page, totalPages, limit,categoryOffers,productOffers  });
      }else {
        res.render('user/homePage', { No_icons: true,products: products,currentPage:page,categoryOffers,productOffers });
        // res.render('user/login-page')
      }
    } else {
      // res.render('user/homePage', { No_icons: true,products,currentPage:page,totalPages, limit, });
      res.render('user/login-page')


    }

  } catch (error) {
    console.log('homePage:', error.message)
    
  }
}



//login user
const loginAction = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const check = await UserModel.findOne({ email: email });
    // console.log('userLogin');
    if (check) {
        if (check.isBlocked == false) {
          if (check.isGoogleUser == false) {
            const passwordMatch = await bcrypt.compare(password, check?.password);
                  if (passwordMatch) {
                      req.session.userId = check._id
                      req.session.isUser = check.name;
                      res.redirect('/')
                  } else {
                    return res.status(400).json({ message: "password not matching.", No_icons: true })
                  }
              } else {
                return res.status(400).json({ message: "please signin through google,or signup and try again.", No_icons: true })
              }
          } else {
             return res.status(400).json({ message: "user is blocked by the admin for malpractice.", No_icons: true })
          }
      } else {
        return res.status(400).json({ message: "User not exist. Please signup", No_icons: true })
      }

  } catch (error) {
      console.log('login action:', error.message)
      return res.status(400).json({
          success: false,
          loginMessage: error.message
      })

  }
}


const otpPage = (req, res) => {
  res.render('user/otpUser')
}

//generate random otp
const randomOtp = async () => {
  return Math.floor(1000 + Math.random() * 9000);
}


const signupAction = async (req, res) => {

  try {

    //check errors in express validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('user/signup-page', { errors: errors.array() });
    } else {
      const { email, name, password, passwordConfirm } = req.body;
      req.session.email = email;

      //checking if user is already exist or not
      const userExist = await UserModel.findOne({ email: email })
      if (userExist) {
        res.render('user/signup-page', { message: "user already exist" })
      } else {
        if (password !== passwordConfirm) {
          res.render('user/signup-page', { message: "Password is not matching." })
        } else {
          const hashedPassword = await bcrypt.hash(password, 10)
          req.body.password = hashedPassword

          // Storing the details in session
          req.session.userDetails = {
            email: req.body.email,
            name: req.body.name,
            password: req.body.password,
          };

          const existingOtp = await Otp.findOneAndDelete({ email: email });
          //otp generate 
          const g_otp = (await randomOtp()).toString();
          const hashedOtp = await bcrypt.hash(g_otp, 10)
          const msg = '<p> Hi <b>' + name + '</b>, </br> <h4>' + g_otp + '</h4> </p>'

          //save otp in model
          const otpData = new Otp({
            email: email,
            otp: hashedOtp,
            Date: new Date()
          })
          const userOtp = await otpData.save();

          //send otp to user
          mailer.sendMail(email, `LoneWolf's Otp Verification`, msg);
          res.render('user/otpUser', { show: "otp send successfully.please check your email.", isError: false })

          // deleting the doc after 2 min
          setTimeout(async () => {
            try {
              await Otp.findOneAndDelete({ otp: userOtp.otp });
              res.render('user/otpPage', { show: "Otp time out, resend otp.", isError: true })

            } catch (error) {
              console.log('2 minutes error:', error.message);
            }
          }, 120000);
          console.log('otp send successfully')
        }
      }
    }
  }
  catch (error) {
    console.log('singup error:', error.message)
  }
}


const MAX_RESEND_ATTEMPTS = 3; 
let resendAttempts = {}; 

const resendOtp = async (req, res) => {

  try {
      if (req.session.userDetails) {
          const { email, name } = req.session.userDetails;

          // Check if there are already resend attempts for this email
          if (!resendAttempts[email]) {
              resendAttempts[email] = {
                  count: 1,
                  lastAttempt: Date.now()
              };
          } else {
              // Check if maximum resend attempts have been reached
              const { count } = resendAttempts[email];
              if (count >= MAX_RESEND_ATTEMPTS) {
                  console.log('time expired')
                  // res.status(200).json({ success: 'redirect to signup' });
                 return res.status(200).json({ message: 'redirect to signup' });
              } else {
                  resendAttempts[email].count++;
              }
          }

          // Find and delete old OTP data
          const existingOtp = await Otp.findOneAndDelete({ email: email });

          const g_otp = (await randomOtp()).toString();
          const hashedOtp = await bcrypt.hash(g_otp, 10);
          const message = `<p> Hi <b>${name}</b>, </br> <h4>${g_otp}</h4> </p>`;

          const otpData = new Otp({
              email: email,
              otp: hashedOtp,
              Date: new Date()
          });
          const userOtp = await otpData.save();

          // Send email containing OTP
          mailer.sendMail(email, 'OTP Verification', message);
          // res.render('user/otpPage', { show: "OTP resent successfully. Please check your email.", isError: false });
          res.status(200).json({success:'resend otp successfully'})
          
          setTimeout(async () => {
              try {
                  await Otp.findOneAndDelete({ otp: userOtp.otp });
                  // console.log('OTP deleted after 2 minutes');
              } catch (error) {
                  console.log('2 minutes error:', error.message);
              }
          }, 120000);
          console.log('otp resend successfully')
      } else {
          res.status(500).json({ error: 'Internal server error' });
      }
  } catch (error) {
      console.log("Resend error:", error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
};

//verify otp and enter into homepage
const verifyOtp = async (req, res) => {
  try {
      const otpDigits = [
          req.body.otpDigit1,
          req.body.otpDigit2,
          req.body.otpDigit3,
          req.body.otpDigit4
      ]
    console.log(otpDigits);
      // Check if any OTP digit is missing or not a number
      const missingOrInvalidDigit = otpDigits.some(digit => !digit || isNaN(digit));
      if (missingOrInvalidDigit) {
          console.log("Invalid OTP digits:", otpDigits);
          return res.status(400).json({error:"Invalid otp." })
      }
      const enteredOtp = otpDigits.join('');
      const email = req.session.email;

      //retrieve otp data from database
      const userValue = await Otp.findOne({ email })

      if (userValue) {
          if (userValue.email === email) {
              const otpMatch = await bcrypt.compare(enteredOtp, userValue.otp);
              console.log(otpMatch)
              if (otpMatch) {
                  await Otp.findOneAndDelete({ otp: userValue.otp });

                  //retrieve data from session
                  const userDetailsData = req.session.userDetails;
                  console.log("userdetails data in session:", userDetailsData.name)
               
                  const userDetails = new UserModel(userDetailsData);
                  
                  userDetails.save()
                      .then(savedUser => {
                          console.log('user saved successfully:', savedUser)

                          return savedUser.save();
                      })
                      .catch(error => {
                          console.log("error in saving data", error)
                      })
        
                  req.session.userId = userDetails._id;
                  req.session.isUser = userDetailsData.name;

                  res.status(200).json({success:'successful'})
              } else {
                  console.log("otp not match");
                  res.status(400).json({error:"Invalid otp." })
              }
          } else {
              res.status(400).json({error:"Invalid otp." })
          }
      } else {
          res.status(400).json({error:"Invalid otp." })
      }
  } catch (error) {
      console.log("verify otp:", error.message)
      res.status(400).json({error:"error in verify otp." })
  }
}


//user logout action
const logout = (req, res) => {
  req.session.destroy();
  res.clearCookie('connect.sid')
  res.redirect('/')
}

module.exports = {
  userRegistercntrl,
  homeRoute,
  loginAction,
  otpPage,
  signupAction,
  verifyOtp,
  resendOtp,
  logout
};
