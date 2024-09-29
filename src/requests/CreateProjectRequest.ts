import { Interaction, TextChannel, User } from "discord.js";
import ICustomClient from "../base/interfaces/ICustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class CreateProjectRequest implements IMediatorRequest {
    name: string;
    data: CrateProjectRequestOptions;

    constructor(client: ICustomClient, channel: TextChannel, author: User) {
        this.name = "CreateProject";
        this.data = new CrateProjectRequestOptions(client, channel, author);
    }
    fromInteraction(customClient: ICustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented.");
    }
}

class CrateProjectRequestOptions {
    client: ICustomClient;
    channel: TextChannel;
    author: User;
    constructor(client: ICustomClient, channel: TextChannel, author: User) {
        this.client = client;
        this.channel = channel;
        this.author = author;
    }
}