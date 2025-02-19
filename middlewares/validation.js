const UserModel = require("../models/User");


function isValid(req, res, next) {
  if(req.session  && req.session.isUser){
    res.locals.user = req.session.isUser;
    console.log(req.session.isUser);
    res.redirect('/');
  } else {
    next()
  }
}


function isAdminValid(req,res,next) {
  if (req.session.admin) {
    console.log(req.session.otpUser);
    res.redirect('admin/dashboard');
  } else {
    next();
  }
}



function isNotAdminValid(req,res,next) {
  if (req.session.admin) {
    next();
  } else {
    res.redirect('/admin')
  }
}


function isNotVaid() {
  if (req.session.otpUser) {
    res.redirect('/login-page');
  } else {
    next();
  }
}



const isAdmin = async(req,res,next)=>{
  try {
      if(req.session.admin){
        return next()
      }
     return res.redirect("/admin/dashboard")
  } catch (error) {
      console.log(error.messasge)
  }
}

const isBlock = async (req, res, next) => {
  const exitUser = await UserModel.findById(req.session.userId);
  if (exitUser?.isBlocked == true ) {
    return res.render("user/userBlockPage");
  } else {
    next();
  }
};


const isLogout = async(req,res,next)=>{
  try {
      if(!req.session.isUser){
        return res.redirect('/')
      }
      const userId = req.session.userId;
      const userCheck = await UserModel.findOne({ _id: userId, isActive: true });

      if (!userCheck) {
          return res.redirect('/');
      }
    
      next()
  } catch (error) {
      console.log(error.messasge)
  }
}

module.exports = {
  isNotVaid,
  isValid,
  isAdminValid,
  isNotAdminValid,
  isAdmin,
  isLogout,
  isBlock
};