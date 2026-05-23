import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserService } from './user.service';


const adminGetAllUsersHandler = catchAsync(async (req, res) => {
    const currentAdminId = (req as any).user.id;
    const result = await UserService.adminGetAllUsers(currentAdminId, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Users fetched successfully',
        data: result,
    });
});

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

// update users profile
const updateUserByIdHandler = catchAsync(async (req, res) => {
    const id = req.user?.id;
    const result = await UserService.updateUserById(id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User is updated succesfully',
        data: result,
    });
});

const updateUserStatusHandler = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;
    const result = await UserService.updateUserStatus(userId as string, status as any);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User status updated',
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
    adminGetAllUsersHandler,
    findUserByIdHandler,
    updateUserByIdHandler,
    updateUserStatusHandler,
    deleteUserByIdHandler,
};