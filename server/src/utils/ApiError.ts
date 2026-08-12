export class ApiError extends Error {
  public statusCode: number;
  public isApiError: boolean;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.isApiError = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string): ApiError {
    return new ApiError(400, message);
  }

  static unauthorized(message: string = "Unauthorized access"): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = "Forbidden request"): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = "Resource not found"): ApiError {
    return new ApiError(404, message);
  }

  static conflict(msg: string = "Conflict Occurred"): ApiError {
    return new ApiError(409, msg);
  }
}
