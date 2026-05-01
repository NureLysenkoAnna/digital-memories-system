module.exports = {
  email: {
    inviteSubject: (group) => `Invitation to the group "${group}"`,
    inviteHeader: 'You have been invited to a group in Starlace Memories!',
    inviteBody: (group, roleText) => `You have received an invitation to join the group <b>"${group}"</b> as a ${roleText}`,
    roleMember: '<i>Member</i>. You will be able to add, view memories and share your impressions!',
    roleViewer: '<i>Viewer</i>. You will be able to view memories and share your impressions!',
    inviteAction: 'Click the button below to accept the invitation:',
    btnJoin: 'Join',
    inviteValidity: 'This link is valid for 48 hours.',

    resetSubject: 'Password Reset for Starlace Memories',
    resetGreeting: (name) => `Hello, ${name}!`,
    resetReqText: 'We received a password reset request for your <b>Starlace Memories</b> account.',
    resetInstruction: 'To create a new password and regain access to your groups and memories, please click the button below:',
    btnReset: 'Create a new password',
    resetAltLink: 'If the button does not work, use this link:',
    resetValidity: 'This link is valid for <b>1 hour</b> only.',
    resetIgnore: 'If you did not request this, please ignore this email.'
  }
};