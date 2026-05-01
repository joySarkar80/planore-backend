import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserService } from './user.service';


const findUserByIdHandler = catchAsync(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user; 

    const result = await UserService.findUserById(id as string, currentUser);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User is retrieved successfully',
        data: result,
    });
});

const getAllUsersHandler = catchAsync(async (req, res) => {
    const result = await UserService.getAllUsers(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Users are retrieved succesfully',
        meta: result.meta,
        data: result.data,
    });
});

const updateUserByIdHandler = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await UserService.updateUserById(id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User is updated succesfully',
        data: result,
    });
});

const deleteUserByIdHandler = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await UserService.deleteUserById(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User is deleted succesfully',
        data: result && null,
    });
});

export const UserController = {
    findUserByIdHandler,
    getAllUsersHandler,
    updateUserByIdHandler,
    deleteUserByIdHandler,
};