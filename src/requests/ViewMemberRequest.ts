import { Guild, Interaction, TextChannel, User } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import Member from "../base/NekoYuki/entities/Member";

export default class ViewMemberRequest implements IMediatorRequest{
    name: string;
    data: ViewMemberRequestOptions;

    constructor(client: CustomClient,  channel: TextChannel, author: User, authorMember: Member, targetUser?: User) {
        this.name = "ViewMember";
        this.data = new ViewMemberRequestOptions(client, channel, author, authorMember, targetUser);
    }
    fromInteraction(customClient: CustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented.");
    }
}

class ViewMemberRequestOptions {
    client : CustomClient;
    channel : TextChannel;
    author : User;
    authorMember : Member;
    targetUser? : User;
    constructor(client: CustomClient, channel: TextChannel, author: User, authorMember: Member, targetUser?: User) {
        this.client = client;
        this.channel = channel;
        this.author = author;
        this.authorMember = authorMember;
        this.targetUser = targetUser;
    }
}
