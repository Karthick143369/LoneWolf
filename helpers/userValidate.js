const {check, body, validationResult } = require('express-validator')

exports.signupValidator = [
    check('name','Name is required').not().isEmpty(),
    check('email','Please include a valid email').isEmail().normalizeEmail({
        gmail_remove_dots:true,
        gmail_lowercase:true,
        

    }),
    check('password','Please include a strong password').isStrongPassword({
        minLength:6,
        minLowercase:1,
        minUppercase:1,
        minNumbers:1,
        minSymbols:1,

    }),
    // check('image').custom((value, {req})=>{
    //     if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' ||file.mimetype === 'image/jpg'){
    //     return true;
    //     }else{
    //         return false;
    //     }
    // }).withMessage('Please upload a jpeg or png image')

]

exports.otpMailValidator = [
  check('email','Please include a valid email').isEmail().normalizeEmail({
    gmail_remove_dots:true
  })
]
