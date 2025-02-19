let axios = require('axios');
const UserModel  = require('../models/User');

let adminRoute = (req, res) => {
  res.render('admin/admin-login')
}

let adminData = {
  email: 'admin@gmail.com',
  password:'123'
}




let homePostRoute = (req, res) => {
  try {
    if (adminData.email == req.body.email && adminData.password == req.body.password) {
      req.session.user = req.body.email;
      let { email, password } = req.body;
      req.session.admin = {
        email,
        password
      }
    }
    else {
      return res.status(404).json({ message: 'Admin not found' });
    }
    return res.status(200).json({ message: "User login Success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "User login Success" });
  }
};


let dashboardRoute = async (req, res) => {
  try {
    const userData = await UserModel.find()
    // console.log(userData);
    res.render('admin/dashboard', { user: userData });
  } catch (error) {
    console.log(error);
  }
}



// const blockuser = async (req, res) => {
//   try {

//       const id = req.params.id;
//       const user = await UserModel.findById(id);
//       if (!user) {
//           return res.status(404).send({ error: 'user not found' });
//       }
//       user.isBlocked = true;
//     await user.save();
//     res.redirect('/admin/dashboard')
//     // res.send({ status: 'success', message: "user is blocked successfully." });

//   } catch (error) {
//       console.log("block user error:", error.message);
//   }
// }


const blockOrUnblockUser = async (req, res) => {
  try {
    const id = req.params.id;
    const googleId = req.params.googleId;
      const action = req.body.action; // "block" or "unblock"
    console.log(id, action);
    const user = await UserModel.findById(id);
    console.log(user);
      if (!user) {
          return res.status(404).send({ error: 'User not found' });
      }
    if (action == "block") {
      user.isBlocked =true
    }
    if (action == "unblock") {
      user.isBlocked =false
    } 
      await user.save();

      res.status(200).send({
          message: `User ${action}ed successfully.`,
          status: 'success',
      });
  } catch (error) {
      console.error("block/unblock user error:", error.message);
      res.status(500).send({
          message: 'An error occurred. Please try again.',
          status: 'error',
      });
  }
};


const blockuser = async (req, res) => {
  try {
      const id = req.params.id;
      const user = await UserModel.findById(id);
      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.isBlocked = true;
      await user.save();
    // res.redirect('/admin/dashboard')
      return res.status(200).json({ success: true, message: 'User has been blocked successfully.' });
  } catch (error) {
      console.log("block user error:", error.message);
      return res.status(500).json({ success: false, message: 'An error occurred while blocking the user.' });
  }
};




const unBlockuser = async (req, res) => {
  try {
      const id = req.params.id;
      const user = await UserModel.findById(id);
      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }
      user.isBlocked = false;
      await user.save();
    // res.redirect('/admin/dashboard')
      return res.status(200).json({ success: true, message: 'User has been Unblocked successfully.' });
  } catch (error) {
      console.log("unblock user error:", error.message);
      return res.status(500).json({ success: false, message: 'An error occurred while unblocking the user.' });
  }
};

module.exports = { adminRoute, homePostRoute, dashboardRoute, blockuser, unBlockuser, blockOrUnblockUser };



{/* <tbody>
<!-- Populate table rows dynamically from database -->
<% if (user && user.length > 0) { %>
  <% locals.user.forEach((row, index) => { %>
  <tr>
      <th scope="row"><%= index+1 %></th>
      <td><%= row.isBlocked %></td>
      <td>$<%= row.name %> </td>
      <td><span class="badge <%= row.isActive?'badge-success' : 'badge-danger' %>">
          <%= row.isBlocked? 'Active':'Blocked' %>
         </span>
      </td>
      <td>
          <a href="/admin/product/editProduct/<%= row._id %>" class="btn btn-info btn-sm custom-button" >EDIT</a>
          <!-- <button type="button" class="btn btn-danger btn-sm">Delete</button> -->
           <% if(row.isActive) { %>
          <a href="/admin/product/block/<%= row._id %>"><button class="btn btn-danger custom-button" >BLOCK</button></a>
          <% }else{ %>
          <a href="/admin/product/unblock/<%= row._id %>"><button class="btn btn-success custom-button">UNBLOCK</button></a>
      <% } %>
      </td>
    
  </tr>
  <!-- Add more rows for other products -->
  <% }) %>

</tbody>
<% }else{ %>
  <tr>
      <td colspan="3">no products found</td>
  </tr>
  <% } %> */}