const mongoose  = require("mongoose");

let dbConnect = async () => {
  try {
    let connect = await mongoose.connect(process.env.MONGO_URL);
    console.log(`DB connected Successfully ${connect.connection.host}`);
  } catch (error) {
    console.log(error.message);
    process.exit(1)
  }
}

module.exports = dbConnect;