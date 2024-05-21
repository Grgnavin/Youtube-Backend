import dotenv from "dotenv";
import connectDB from "./db/connectDb.js";

dotenv.config({
    path: './env'
})

connectDB();
