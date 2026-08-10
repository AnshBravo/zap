import dotenv from "dotenv"; // Import dotenv module to access Environment variables
dotenv.config(); // .config() will allow us to access .env file from the process object

import app from "./app.js"; // Import our app

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`👌✅ Server running on http://localhost:${PORT}`);
});
