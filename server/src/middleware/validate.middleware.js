export const validateJoinInput = (req, res, next) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Full Name is required to join the classroom.',
    });
  }

  const sanitized = name.trim().replace(/[<>]/g, '');
  if (sanitized.length < 2 || sanitized.length > 50) {
    return res.status(400).json({
      success: false,
      message: 'Full Name must be between 2 and 50 characters long.',
    });
  }

  req.body.sanitizedName = sanitized;
  next();
};

export const validateLoginInput = (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required.',
    });
  }
  next();
};
