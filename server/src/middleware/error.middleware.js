import { HttpError } from "../utils/http-error.js";

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = 500;
  let message = "An unexpected error occurred";
  let code = "INTERNAL_ERROR";
  let errors;

  if (error instanceof HttpError) {
    ({ status, message, code, errors } = error);
  } else if (error.code === 11000) {
    status = 409; message = "An account already exists with this email"; code = "EMAIL_EXISTS";
  } else if (error.name === "ValidationError") {
    status = 400; message = "Invalid request"; code = "VALIDATION_ERROR";
  } else if (error.type === "entity.parse.failed") {
    status = 400; message = "Request body must be valid JSON"; code = "INVALID_JSON";
  } else if (error.type === "entity.too.large") {
    status = 413; message = "Request body is too large"; code = "PAYLOAD_TOO_LARGE";
  } else if (error.type === "encoding.unsupported" || error.type === "charset.unsupported") {
    status = 415; message = "Unsupported request encoding"; code = "UNSUPPORTED_ENCODING";
  } else if (["MongoServerSelectionError", "MongooseServerSelectionError", "MongoNetworkError", "MongoNotConnectedError"].includes(error.name)) {
    status = 503; message = "Database is temporarily unavailable"; code = "DATABASE_UNAVAILABLE";
  }

  if (status >= 500) console.error("Request failed", { name: error.name, code });
  return res.status(status).json({ message, code, ...(errors ? { errors } : {}) });
}
