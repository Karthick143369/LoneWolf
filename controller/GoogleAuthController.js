let nodemailer = require('nodemailer');
const UserModel = require('../models/User');
const product = require('../models/product');

//Sending Email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  requireTLS: true,
  auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD
  },
  timeout: 10000  // 10 seconds
})

const sendMail = async (email, subject, content) => {
    
  try {
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
          throw new Error('Invalid or empty recipient email address.');
      }

      var mailOptions = {
          from: process.env.SMTP_MAIL,
          to: email,
          subject: subject,
          html: content
      };
      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.log(error)
          }
          if (info && info.messageId) {
              console.log('Email sent:', info.messageId);
          } else {
              console.log('Email sent successfully.'); // You can log a success message if info.messageId is not available
          }
      });

  } catch (error) {
      console.log('send mail:', error.message)
  }
}


//google singup
const successGoogleLogin = async (req, res) => {
  try {
      if (req.user) {
        const check = await UserModel.findOne({ email: req.user.emails[0].value });
        // console.log(`---user----`);
        // console.log(req.user.emails[0].value );
        // console.log(`---mail----`);
        // // console.log(emails[0].value);
        // console.log(req.user.email);
        // console.log('-----------------------');
        // const emailFromEmails = req.body.emails[0].value;
        // console.log(emailFromEmails); // Output: karthikeyan37705@gmail.com
        // console.log('-----------------------');

        // const email = getEmail(profile);
        // console.log(email); // Output: karthikeyan37705@gmail.com
        
        // console.log(`--check-----`);
        console.log(check);
          if (!check) {
              let googleUser = req.user
              const name = googleUser.name.givenName + ' ' + googleUser.name.familyName
              const newUser = new UserModel({
                  name: name,
                  email: googleUser.emails[0].value,
                  profileImage: googleUser.picture || 'default_image_url',
                  googleId: googleUser.id,
                  isGoogleUser :true
              })
              const users = await newUser.save();
              req.session.isUser = name;
              req.session.userId = users._id;
              const user = req.session.isUser;
              const userId = req.session.userId
             
              // const products = await product.find({ isActive: true })

              if (user) {
                const usercheck = await UserModel.findOne({ _id: userId, isBlocked: false });
                console.log(`usercheck 1 working`);
                  // const wishList = await wishlistModel.find();
                  // const currentDate = new Date();
                  if (usercheck) {
                      res.redirect('/')
                  } else {
                    res.redirect('/')
                  }
      
              } else {
                  res.redirect('/', { No_icons: true, });
              }
          } else {
              // const userName = check.name;
              req.session.isUser = check.name;
              req.session.userId = check._id;
              const page = parseInt(req.query.page) || 1; // Current page number (default 1)
              const limit = parseInt(req.query.limit) || 3; // Items per page (default 10)
              const skip = (page - 1) * limit; // Number of items to skip
              const totalProducts = await product.countDocuments(); // Total number of products
               const totalPages = Math.ceil(totalProducts / limit); // Total pages

              // Fetch products with pagination
              const products = await product.find({ isActive: true, }).skip(skip).limit(limit);
            
              const user = req.session.isUser;
              const userId = req.session.userId
              
          
              if (user) {
                const usercheck = await UserModel.findOne({ _id: userId, isBlocked: true });
                console.log(`usercheck 2 working`);
                  if (usercheck) {
                    // res.redirect('/', response);
                    const response  = {
                      No_icons: true,
                      // products: [...products],
                      currentPage: 1,
                      totalPages: 1,
                      limit: 3,
                    }
                    res.render('user/signup-page',{ message: "user Blocked by admin" });
                    
                  } else {
                  res.redirect('/')
                }
      
              } else {
                  res.redirect('/', { No_icons: true, });
              }
          } 

      } else {
          res.redirect('/failure');
      }
  } catch (error) {
      console.log("success Google:", error.message)
  }
}


const failureGoogleLogin = (req, res) => {
  res.redirect('/sign-up');
}

module.exports = {
  sendMail,
  successGoogleLogin,
  failureGoogleLogin
}