import { Interaction, TextChannel, User } from "discord.js";
import ICustomClient from "../base/interfaces/ICustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class ManageMemberPositionRequest implements IMediatorRequest {
    name: string;
    data: ManageMemberPositionOptions;

    constructor(client: ICustomClient, channel: TextChannel, member: User, author: User) {
        this.name ="ManageMemberRole"
        this.data = new ManageMemberPositionOptions(client, channel, member, author);
    }
    fromInteraction(customClient: ICustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented.");
    }
}

class ManageMemberPositionOptions {
    client: ICustomClient;
    channel: TextChannel;
    member: User;
    author: User;

    constructor(client: ICustomClient, channel: TextChannel, member: User, author: User) {
        this.client = client;
        this.channel = channel;
        this.member = member;
        this.author = author;
    }
}