enum ErrorCode {
    InternalServerError = "INTERNAL_SERVER_ERROR",
    BadRequest = "BAD_REQUEST",
    Unauthorized = "UNAUTHORIZED",
    Forbidden = "FORBIDDEN",
    UserCannotBeFound = "USER_CANNOT_BE_FOUND",
    UserAlreadyExists = "USER_ALREADY_EXISTS",
    UserCancelled = "USER_CANCELLED",
    InvalidCredentials = "INVALID_CREDENTIALS",
    TimeOut = "TIME_OUT",
}

export default ErrorCode;
