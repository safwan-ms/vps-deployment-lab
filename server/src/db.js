const mongoose = require("mongoose");

let isConnected = false;

async function connectDb(mongoUri) {
  if (!mongoUri) {
    console.warn("[db] MONGODB_URI is not defined.");
    return false;
  }

  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log("[db] Successfully connected to MongoDB Atlas");
    return true;
  } catch (err) {
    isConnected = false;
    console.error("[db] MongoDB Atlas connection failed:", err.message);
    console.warn(
      "[db] Tip: Ensure your current IP is whitelisted in MongoDB Atlas Network Access (https://cloud.mongodb.com/)."
    );
    return false;
  }
}

function dbStatus() {
  return mongoose.connection.readyState;
}

function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

// Background auto-reconnect attempt every 30 seconds if not connected
function initAutoReconnect(mongoUri) {
  setInterval(async () => {
    if (!isDbConnected() && mongoUri) {
      console.log("[db] Attempting to reconnect to MongoDB Atlas...");
      await connectDb(mongoUri);
    }
  }, 30000);
}

module.exports = { connectDb, dbStatus, isDbConnected, initAutoReconnect };
