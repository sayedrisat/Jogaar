import app from "./app/app.js";
import connectDB from "./config/db.js";
import config from "./config/config.js";
import userModel from "./model/user.model.js";

try {
  await connectDB();
  await userModel.init();
  const server = app.listen(config.PORT, () => {
    console.log("Jogaar API listening on port", server.address().port);
  });
  server.on("error", (error) => {
    console.error("Unable to listen", { code: error.code });
    process.exit(1);
  });
} catch (error) {
  console.error("Unable to start Jogaar API", { name: error.name });
  process.exit(1);
}
