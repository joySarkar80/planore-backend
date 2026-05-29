import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { hostBanService } from './hostBan.service';

const banUser = catchAsync(async (req: Request, res: Response) => {
    const hostId = req.user?.id;
    const result = await hostBanService.banUser(hostId as string, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User banned successfully',
        data: result,
    });
});

const unbanUser = catchAsync(async (req: Request, res: Response) => {
    const hostId = req.user?.id;
    const { userId } = req.params;
    const result = await hostBanService.unbanUser(hostId as string, userId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User unbanned successfully',
        data: result,
    });
});

const getBannedUsers = catchAsync(async (req: Request, res: Response) => {
    const hostId = req.user?.id;
    const result = await hostBanService.getBannedUsers(hostId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Banned users fetched successfully',
        data: result,
    });
});

export const hostBanController = {
    banUser,
    unbanUser,
    getBannedUsers,
};