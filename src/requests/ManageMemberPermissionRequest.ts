import { GuildMember, Interaction, TextChannel, User } from "discord.js";
import ICustomClient from "../base/interfaces/ICustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class ManageMemberPermissionRequest implements IMediatorRequest {
    name: string;
    data: ManageMemberPermissionOptions;
    constructor(client: ICustomClient, channel: TextChannel, member: User, author: User) {
        this.name = "ManageMemberPermission";
        this.data = new ManageMemberPermissionOptions(client, channel, member, author);
    }
    fromInteraction(customClient: ICustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented.");
    }
}

class ManageMemberPermissionOptions  {
    client: ICustomClient;
    member: User;
    channel: TextChannel;
    author: User;
    constructor(client: ICustomClient, channel: TextChannel, member: User, author: User) {
        this.client = client;
        this.member = member;
        this.channel = channel;
        this.author = author;
    }
}