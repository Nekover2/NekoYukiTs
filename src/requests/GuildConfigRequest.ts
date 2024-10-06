import { Interaction, TextChannel, User } from "discord.js";
import ICustomClient from "../base/interfaces/ICustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import CustomClient from "../base/classes/CustomClient";

export default class GuildConfigRequest implements IMediatorRequest {
    name: string;
    data: GuildConfigRequestOptions;

    constructor(options : GuildConfigRequestOptions) {
        this.name = "GuildConfig";
        this.data = options;
    }

    fromInteraction(customClient: ICustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented.");
    }
}

class GuildConfigRequestOptions {
    client: CustomClient;
    channel: TextChannel;
    author: User;

    constructor(client: CustomClient, channel: TextChannel, author: User) {
        this.client = client;
        this.channel = channel;
        this.author = author;
    }
}