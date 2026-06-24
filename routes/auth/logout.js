export default function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: req.t('auth.logout.success'),
    data: null
  });
}
