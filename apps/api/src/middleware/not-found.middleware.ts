import { RequestHandler } from 'express';

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      status: 404,
      code: 'SYS-003',
      message: `Route not found: ${req.method} ${req.path}`,
    },
  });
};
