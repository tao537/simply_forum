export function notFound(req, res) {
  res.status(404).json({ message: `路由不存在: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.code, err.message);

  const code = err.code || '';
  const msg  = err.message || '';

  if (
    code === 'SQLITE_CONSTRAINT_UNIQUE' ||
    code === 'SQLITE_CONSTRAINT' ||
    msg.includes('UNIQUE constraint failed')
  ) {
    return res.status(409).json({ message: '数据已存在（唯一约束冲突）' });
  }
  if (code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || msg.includes('FOREIGN KEY')) {
    return res.status(409).json({ message: '外键约束冲突' });
  }

  res.status(err.status || 500).json({
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
