import IMediatorHandle from "./IMediatorHandle";
import IMediatorRequest from "./IMediatorRequest";

export default interface IMediator {
    requests : Array<IMediatorRequest>;
    handles : Array<IMediatorHandle<IMediatorRequest>>;
    addRequest(request : IMediatorRequest | string) : void;
    addHandle(handle : IMediatorHandle<IMediatorRequest> | string) : void;
    send(request : IMediatorRequest) : Promise<any>;
}