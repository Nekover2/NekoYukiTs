import { TextChannel, User } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import Member from "../base/NekoYuki/entities/Member";

export default class ViewMemberProjectRequest implements IMediatorRequest {
    name: string;
    data: ViewMemberProjectRequestOptions;
    constructor(client: CustomClient, channel: TextChannel, author: User, authorMember: Member, targetUser?: User) {
        this.name = "ViewMemberProject";
        this.data = new ViewMemberProjectRequestOptions(client, channel, author, authorMember, targetUser);
    }
    fromInteraction(customClient: any, interaction: any): IMediatorRequest {
        throw new Error("Method not implemented.");
    }
}

class ViewMemberProjectRequestOptions {
    client: CustomClient;
    channel: TextChannel;
    author: User;
    authorMember: Member;
    targetUser? : User;
    constructor(client: CustomClient, channel: TextChannel, author: User, authorMember: Member, targetUser?: User) {
        this.client = client;
        this.channel = channel;
        this.author = author;
        this.authorMember = authorMember;
        this.targetUser = targetUser;
    }
}