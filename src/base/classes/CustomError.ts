import ErrorCode from "../enums/ErrorCode";

export default class CustomError extends Error {
    errorCode: ErrorCode;
    origin : string;
    constructor(message : string, code : ErrorCode, origin: string) {
        super(message);
        this.errorCode = code  
        this.origin = origin; 
    }
}