const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  studentIdNumber: user.studentIdNumber,
  role: user.role,
  isVerified: user.isVerified,
  verificationStatus: user.verificationStatus,
  profileImageUrl: user.profileImageUrl,
  themePreference: user.themePreference,
  lastActiveAt: user.lastActiveAt,
  barcodeString: user.barcodeString,
});

module.exports = {
  serializeUser,
};
