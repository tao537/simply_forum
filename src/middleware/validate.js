export const validate = (schema) => (req, res, next) => {
  const body = req.body ?? {};
  const result = schema.safeParse(body);

  if (!result.success) {
    const errors = result.error.issues.map(i => ({
      path: i.path.join('.') || '(根)',
      message: i.message,
    }));
    const detailText = errors.map(e => `${e.path}: ${e.message}`).join('；');
    return res.status(400).json({
      message: `参数校验失败 → ${detailText}`,
      errors,
    });
  }

  req.body = result.data;
  next();
};
