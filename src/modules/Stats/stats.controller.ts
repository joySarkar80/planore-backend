import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatsService } from './stats.service';

const getDashboardStats = catchAsync(async (req, res) => {
    const userId = req.user?.id;

    const result = await StatsService.getDashboardStats(userId as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Dashboard stats retrieved successfully',
        data: result,
    });
});

export const StatsController = {
    getDashboardStats,
};