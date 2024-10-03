import { GuildMember, Interaction, TextChannel, User } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class ManageMemberPermissionRequest implements IMediatorRequest {
    name: string;
    data: ManageMemberPermissionOptions;
    constructor(client: CustomClient, channel: TextChannel, member: User, author: User) {
        this.name = "ManageMemberPermission";
        this.data = new ManageMemberPermissionOptions(client, channel, member, author);
    }
    fromInteraction(customClient: CustomClient, interaction: Interaction): IMediatorRequest {
        return new ManageMemberPermissionRequest(customClient, interaction.channel as TextChannel, interaction.member?.user as User, interaction.user);
    }
}

class ManageMemberPermissionOptions  {
    client: CustomClient;
    member: User;
    channel: TextChannel;
    author: User;
    constructor(client: CustomClient, channel: TextChannel, member: User, author: User) {
        this.client = client;
        this.member = member;
        this.channel = channel;
        this.author = author;
    }
}