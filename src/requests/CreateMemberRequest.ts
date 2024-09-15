import ICustomClient from "../base/interfaces/ICustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class CreateMemberRequest implements IMediatorRequest {
    client: ICustomClient;
    name: string;
    data: CreateMemberOptions;

    constructor(client: ICustomClient, discordId: string, gmail: string) {
        this.client = client;
        this.name = "CreateMember";
        this.data = new CreateMemberOptions(client, discordId, gmail);
    }
}

class CreateMemberOptions {
    client: ICustomClient;
    discordId: string;
    gmail: string;

    constructor(client: ICustomClient, discordId: string, gmail: string) {
        this.client = client;
        this.discordId = discordId;
        this.gmail = gmail;
    }
}