import ApiError from "../utils/apiError.js";


const handleJwrIvalidSignture = () => new ApiError('Invalid token, please login again...',401)
const handleJwrExpired = () => new ApiError('Expired token, please login agine...',401)

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        sendErrorForDev(err, res);
    } else{
        if(err.name === 'JsonWebTokenError') err =  handleJwrIvalidSignture();
        if(err.name === 'TokenExpiredError') err =  handleJwrExpired();
        sendErrorForprod(err, res);
    }
    
};


const sendErrorForDev = (err, res) => {
    return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

const sendErrorForprod = (err, res) => {
    return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    });
}

export default globalErrorHandler;