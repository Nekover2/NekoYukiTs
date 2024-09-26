import { TextChannel, User } from "discord.js";
import ICustomClient from "../base/interfaces/ICustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class ViewProjectRequest implements IMediatorRequest {
    name: string;
    data: ViewProjectRequestOptions;

    constructor(client: ICustomClient, channel: TextChannel, author: User ) {
        this.name = "ViewProject";
        this.data = new ViewProjectRequestOptions(client,channel, author);
    }
}


class ViewProjectRequestOptions {
    client: ICustomClient;
    author: User;
    channel: TextChannel;

    constructor(client: ICustomClient,channel: TextChannel, author: User) {
        this.client = client;
        this.author = author;
        this. channel = channel;
    }
}