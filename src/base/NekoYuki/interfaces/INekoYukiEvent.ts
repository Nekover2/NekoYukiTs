import ICustomClient from "../../interfaces/ICustomClient";

export default interface INekoYukiEvent {
    customClient: ICustomClient;
    Name: string;
    Description: string;
    Once: boolean;
    Execute(...args: any[]) : void;
}