import { RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const correlationId: RequestHandler = (req, res, next) => {
  const id = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-Id', id);
  next();
};
