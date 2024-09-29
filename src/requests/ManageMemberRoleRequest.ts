import { Interaction, TextChannel, User } from "discord.js";
import ICustomClient from "../base/interfaces/ICustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class ManageMemberRoleRequest implements IMediatorRequest {
    name: string;
    data: ManageMemberRoleOptions;

    constructor(client: ICustomClient, channel: TextChannel, member: User, author: User) {
        this.name ="ManageMemberRole"
        this.data = new ManageMemberRoleOptions(client, channel, member, author);
    }
    fromInteraction(customClient: ICustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented.");
    }
}

class ManageMemberRoleOptions {
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