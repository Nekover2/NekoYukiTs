import ErrorCode from "../enums/ErrorCode";

export default class CustomError extends Error {
    errorCode: ErrorCode;
    origin : string;
    customMessage : string;
    constructor(message : string, code : ErrorCode, origin: string, trueError?: Error) {
        if(trueError) {
            super(trueError.message);
        }
        else {
            super(message);
        }
        this.customMessage = message;
        this.errorCode = code  
        this.origin = origin; 
    }
}