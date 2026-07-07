import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import dbConnction from './src/config/dbConnection.js'
import userRoute from './src/routes/userRoutes.js';
import propertyRoute from './src/routes/propertyRoutes.js';
import unitRoute from './src/routes/unitRoute.js';
import tenant from './src/routes/tenantRoute.js'
import contractRoute from './src/routes/contractRoute.js'

import globalErrorHandler from "./src/middleware/errorMiddleware.js";
import cors from 'cors';




const app = express();
dbConnction();
app.use(cors({
    origin: "*"
}));


app.use(express.json());


app.get("/",(req,res)=> res.send("Hello World55"));

app.use("/api/v1/users",userRoute);
app.use("/api/v1/properties",propertyRoute);
app.use("/api/v1/units",unitRoute);
app.use("/api/v1/tenants",tenant);
app.use("/api/v1/contracts",contractRoute);

app.use(globalErrorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});