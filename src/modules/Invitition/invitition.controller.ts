import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { InvititionService } from './invitition.service';


const getMyInvitationsHandler = catchAsync(async (req, res) => {
  const userId = req.user?.id; // auth middleware থেকে আসবে
  const result = await InvititionService.getMyInvitations(userId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Invitations retrieved successfully',
    data: result,
  });
});

const respondToInvitationHandler = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params; // registrationId
  const { action } = req.body; // 'ACCEPT' | 'REJECT'

  const result = await InvititionService.respondToInvitation(userId as string, id as string, action);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Invitation ${action.toLowerCase()}ed successfully`,
    data: result,
  });
});

export const InvititionController = {
  getMyInvitationsHandler,
  respondToInvitationHandler,
};