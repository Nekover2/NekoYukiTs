import ErrorCode from "../enums/ErrorCode";

export default interface IError {
    message: string;
    code: ErrorCode;
}