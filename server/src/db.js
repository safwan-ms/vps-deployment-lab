const mongoose = require("mongoose");

async function connectDb(mongoUri) {
  if (!mongoUri) throw new Error("MONGODB_URI is missing");

  await mongoose.connect(mongoUri);

  console.log("[db] connected");
}

function dbStatus() {
  return mongoose.connection.readyState;
}

module.exports = { connectDb, dbStatus };
