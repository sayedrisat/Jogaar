import config from "./config.js";
import mongoose from "mongoose";

export default async function connectDB() {
  await mongoose.connect(config.MONGO_URI);
}
