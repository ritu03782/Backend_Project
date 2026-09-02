import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app=express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,
}));
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true , limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import;
import userRouter from './routes/user.routes.js'
import habitRouter from './routes/habit.routes.js'
import { errorHandler } from "./middlewares/error.middleware.js";

//routes declaration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/habits",habitRouter)

// error handler — must be registered AFTER all routes
app.use(errorHandler)

export default app;
