import { GuildMember, Interaction, TextChannel, User } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import Member from "../base/NekoYuki/entities/Member";

export default class ManageMemberPermissionRequest implements IMediatorRequest {
    name: string;
    data: ManageMemberPermissionOptions;
    constructor(client: CustomClient, channel: TextChannel, author: User, authorMember: Member, targetUser?: User) {
        this.name = "ManageMemberPermission";
        this.data = new ManageMemberPermissionOptions(client, channel, author, authorMember, targetUser);
    }
    fromInteraction(customClient: CustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented.");
    }
}

class ManageMemberPermissionOptions  {
    client: CustomClient;
    channel: TextChannel;
    author: User;
    authorMember: Member;
    targetUser?: User;
    constructor(client: CustomClient, channel: TextChannel, author: User, authorMember: Member, targetUser?: User) {
        this.client = client;
        this.channel = channel;
        this.author = author;
        this.authorMember = authorMember;
        this.targetUser = targetUser;
    }
}