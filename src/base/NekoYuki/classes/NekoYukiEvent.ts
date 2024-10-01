import ICustomClient from "../../interfaces/ICustomClient";
import INekoYukiEventOptions from "../interfaces/INekoYukiEventOptions";
import INekoYukiEvent from "../interfaces/INekoYukiEvent";

export default class NekoYukiEvent implements INekoYukiEvent {
    customClient: ICustomClient;
    Name: string;
    Description: string;
    Once: boolean;

    constructor(client: ICustomClient, options: INekoYukiEventOptions) {
        this.customClient = client;
        this.Name = options.Name;
        this.Description = options.Description;
        this.Once = options.Once;
    }
    Execute(...args: any[]): void {
        
    }

}