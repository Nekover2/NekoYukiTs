import ErrorCode from "../enums/ErrorCode";
import IError from "../interfaces/IError";

export default class Error implements IError {
    message: string;
    code: ErrorCode;
    constructor(message: string, code: ErrorCode) {
        this.message = message;
        this.code = code;
    }
}