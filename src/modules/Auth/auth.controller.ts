import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthServices } from './auth.service';

const loginUser = catchAsync(async (req, res) => {
    // console.log(req);
    const result = await AuthServices.loginUser(req.body);
    const { refreshToken, accessToken } = result;


    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,     
        sameSite: "lax",
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User is logged in successfully!',
        data: {
            accessToken,
            refreshToken,
        },
    });
});

const refreshToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.cookies;
    const result = await AuthServices.refreshToken(refreshToken);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Access token is retrieved successfully!',
        data: result,
    });
});

const registerUser = catchAsync(async (req, res) => {
    const result = await AuthServices.registerUser(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User registered successfully',
        data: result,
    });
});

export const AuthControllers = {
    loginUser,
    refreshToken,
    registerUser,
};