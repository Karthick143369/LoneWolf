const userModel = require('../models/userModel');
const walletModel = require('../models/wallet');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

//to render user profile
const profilePage = async (req, res) => {

    try {
        if (req.session.isUser) {
            const user = req.session.isUser
            const userData = await userModel.findOne({ name: user });
            const userId = userData._id.toString();
            res.render('user/userProfile', { userData: userData, userId })
        } else {
            res.render('404error')
        }
    } catch (error) {
        console.log('profile :', error.message);
        // res.status(500).render('404error', { status: 500, message: 'Internal Server Error' });
    }
}


// // updating the user profile
// const profileUpdate = async (req, res) => {
//     try {
//         console.log('hello')
//         const user = req.session.isUser;
//         const userData = await userModel.findOne({ name: user });
//         if (!userData) {
//             return res.render('user/userProfile');
//         }

//         if (req.file) {
//             if (userData.profileImage) {
//                 const imagePath = path.join(__dirname, `../../public/images/userProfile/${userData.profileImage}`);
//                 fs.unlinkSync(imagePath);
//             }
//             userData.profileImage = req.file.filename;

//             console.log('Profile image updated:', userData.profileImage);
//         }

//         // Update other user profile fields
//         userData.name = req.body.name;
//         userData.email = req.body.email;
//         userData.mobileNumber = req.body.mobileNumber;
//         userData.gender = req.body.gender;
//         await userData.save();
//         req.session.isUser = userData.name;
//         req.flash('success', 'user profile edited successfully.');
//         res.redirect('/user/profile');
//     } catch (error) {
//         console.log('profile update:', error.message);
//         res.status(500).render('404error', { status: 500, message: 'Internal Server Error' });
//     }
// }


// //render changing password page
// const changePasswordPage = async (req, res) => {
//     try {

//         if (req.session.isUser) {
//             const userName = req.session.isUser;
//             const userData = await userModel.findOne({ name: userName });
//             const userId = userData._id.toString();
//             res.render('user/changePass', { userId, userData });
//         }
//     } catch (error) {
//         console.log('password Page:', error.message);
//         res.status(500).render('404error', { message: error.message });
//     }

// }

// //changing user password
// const changePass = async (req, res) => {
//     try {
//         const userId = req.params.id;
//         const userData = await userModel.findById(userId);

//         if (!userData) {
//             req.flash('error', 'user not found.');
//             return res.redirect('/user/password');
//         }

//         const oldePassword = userData.password;
//         const isPasswordMatch = await bcrypt.compare(req.body.password, oldePassword)

//         if (!isPasswordMatch) {
//             req.flash('error', 'Current password is incorrect.');
//             return res.redirect('/user/password');
//         }

//         const { newpassword, confirmPassword } = req.body;

//         if (newpassword !== confirmPassword) {
//             req.flash('error', 'New password and confirm password should be the same.');
//             return res.redirect('/user/password')
//         }

//         const hashPassword = await bcrypt.hash(newpassword, 10);
//         await userModel.findByIdAndUpdate(userId, {
//             password: hashPassword,
//         }, { new: true });

//         req.flash('success', 'Password changed successfully.');
//         res.redirect('/user/password');

//     } catch (error) {

//         console.log('password change error:', error.message);
//         req.flash('error', 'An error occurred while changing the password. Please try again.');
//         res.redirect('/user/password');
//     }
// }


// // rendering wallet page
// const walletPage = async (req, res) => {
//     try {

//         const userId = req.session.userId;
//         const userData = await userModel.findById(userId);
//         const wallet = await walletModel.find({userId:userId})
        
//         res.render('user/userWallet', { userData,wallet,currentWalletBalance: userData.wallet  })
//     } catch (error) {
//         console.log('error in showing wallet page:',error.message)
//     }
// }

// //add fund in wallet
// const addFund = async (req, res) => {
//     try {
//         const userId = req.body.userId;
//         const amount = req.body.amount;

//         if (!userId || !amount) {
//             return res.status(400).json({ error: 'User ID and amount are required' });
//         }

//         const user = await userModel.findById(userId);

//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         user.wallet += amount;
//         await user.save();

//         res.status(200).json({ success: 'Successfully added funds', amount: user.wallet });
      
//     } catch (error) {
//         console.log('Error occurred:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// };

module.exports = {
    profilePage,
    // profileUpdate,
    // changePasswordPage,
    // changePass,
    // walletPage,
    // addFund
}