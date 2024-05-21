import mongoose, { connect } from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try {
        const mongoUrl = `${process.env.MONGO_URL}/${DB_NAME} `
        const connection = await mongoose.connect(mongoUrl);
        console.log(`MongoDb Connected!! DB HOST:${connection.connection.host}`);
    } catch (error) {
        console.log("MONGODB CONNECTION FAILED: ", error);
        process.exit(1);
    }
}

export default connectDB;



// ;(async ()=> {
//     try {
//         const mongoUrl = `${process.env.MONGO_URL}/${DB_NAME}`;
//         await mongoose.connect(mongoUrl);
//         console.log("Connect to db sucessfully");
//             app.on("error", (error) => {
//                 console.log("Error: ", error);
//                 throw error
//             })

//             app.listen(process.env.PORT, () => {
//                 console.log(`App is listening on port ${process.env.PORT}`);
//             })

//     } catch (error) {
//         console.log("Error: ", error);
//         throw error
//     }
// } )()