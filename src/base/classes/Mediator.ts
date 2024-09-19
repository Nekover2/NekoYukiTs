import { glob } from "glob";
import IMediator from "../interfaces/IMediator";
import IMediatorHandle from "../interfaces/IMediatorHandle";
import IMediatorRequest from "../interfaces/IMediatorRequest";
import path from "path";
import CustomError from "./CustomError";
import ErrorCode from "../enums/ErrorCode";

export default class Mediator implements IMediator {
    requests: IMediatorRequest[];
    handles: IMediatorHandle<IMediatorRequest>[];

    constructor() {
        this.requests = [];
        this.handles = [];
    }

    async LoadHandles(handlerFolder: string): Promise<void> {
        const files = (await glob(handlerFolder)).map((file) => path.resolve(file));
        files.map(async (file: string) => {
            const handle: IMediatorHandle<IMediatorRequest> = new (await import(file)).default();
            if (!handle.name)
                return delete require.cache[require.resolve(file)] && console.log(`Handle ${file} does not have a name property`);
            this.handles.push(handle);
            console.log(`[Mediator] Loaded handle ${handle.name}`);
            return delete require.cache[require.resolve(file)];
        });
    }

    async LoadRequests(requestFolder: string): Promise<void> {
        const files = (await glob(requestFolder)).map((file) => path.resolve(file));
        files.map(async (file: string) => {
            const request: IMediatorRequest = new (await import(file)).default();
            if (!request.name)
                return delete require.cache[require.resolve(file)] && console.log(`Request ${file} does not have a name property`);
            this.requests.push(request);
            console.log(`[Mediator] Loaded request ${request.name}`);
            return delete require.cache[require.resolve(file)];
        });
    }

    async LoadMediator(requestFolder: string, handlerFolder: string): Promise<void> {
        await this.LoadRequests(requestFolder);
        await this.LoadHandles(handlerFolder);
    }

    addRequest(request: IMediatorRequest | string): void {
        if (typeof request === "string") {
            const req = this.requests.find((r) => r.name === request);
            if (req) {
                this.requests.push(req);
            }
        } else {
            this.requests.push(request);
        }
    }
    addHandle(handle: IMediatorHandle<IMediatorRequest> | string): void {
        if (typeof handle === "string") {
            const han = this.handles.find((h) => h.name === handle);
            if (han) {
                this.handles.push(han);
            }
        } else {
            this.handles.push(handle);
        }
    }
    send(request: IMediatorRequest): Promise<any> {
        try {
            const handle = this.handles.find((h) => h.name === request.name);
            if (handle) {
                return handle.handle(request);
            }
            throw new CustomError(`Handle ${request.name} not found`, ErrorCode.BadRequest, "Mediator");
        } catch (error) {
            console.log("Error catched ");
            
            if (error instanceof CustomError) {
                throw new CustomError(error.message, error.errorCode, "Mediator");
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Mediator");
        }

    }

}