import { Interaction, TextChannel, User } from "discord.js";
import ICustomClient from "../base/interfaces/ICustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class ViewProjectRequest implements IMediatorRequest {
    name: string;
    data: ViewProjectRequestOptions;

    constructor(client: ICustomClient, channel: TextChannel, author: User, projectId?: string) {
        this.name = "ViewProject";
        this.data = new ViewProjectRequestOptions(client,channel,author, projectId);
    }
    fromInteraction(customClient: ICustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented.");
    }
}


class ViewProjectRequestOptions {
    client: ICustomClient;
    author: User;
    channel: TextChannel;
    projectId?: string;
    constructor(client: ICustomClient,channel: TextChannel, author: User, projectId?: string) {
        this.client = client;
        this.author = author;
        this.channel = channel;
        this.projectId = projectId;
    }
}