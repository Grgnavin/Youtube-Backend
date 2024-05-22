import dotenv from "dotenv";
import connectDB from "./db/connectDb.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 3000,() => {
        console.log(`Server listening on port : ${process.env.PORT}`);
    })
})
.catch((err) => console.log("Mongo connection Error: ", err))
