import { Interaction, TextChannel, User } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import Member from "../base/NekoYuki/entities/Member";

export default class CreateGeneralRoleRequest implements IMediatorRequest {
    name: string;
    data: CreateGeneralRoleRequestOptions;

    constructor(options: CreateGeneralRoleRequestOptions) {
        this.name = "CreateGeneralRole";
        this.data = options;
    }
    fromInteraction(customClient: CustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented.");
    }

}

class CreateGeneralRoleRequestOptions {
    customClient: CustomClient
    channel: TextChannel;
    author: User;
    authorMember: Member;

    constructor(customClient: CustomClient, channel: TextChannel, author: User, authorMember: Member) {
        this.customClient = customClient;
        this.channel = channel;
        this.author = author;
        this.authorMember = authorMember;
    }
}