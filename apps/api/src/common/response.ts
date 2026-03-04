import { Response } from 'express';

export interface CursorMeta {
  cursor: string | null;
  hasMore: boolean;
  total?: number;
}

export function success<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ data });
}

export function successPaginated<T>(res: Response, data: T[], meta: CursorMeta) {
  return res.status(200).json({ data, meta });
}

export function created<T>(res: Response, data: T) {
  return res.status(201).json({ data });
}

export function noContent(res: Response) {
  return res.status(204).send();
}

export function errorResponse(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return res.status(statusCode).json({
    error: {
      status: statusCode,
      code,
      message,
      ...(details && { details }),
    },
  });
}
