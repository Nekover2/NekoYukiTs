import { Interaction, TextChannel, User } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import Member from "../base/NekoYuki/entities/Member";

export default class ManageMemberGeneralRoleRequest implements IMediatorRequest {
    name: string;
    data: ManageMemberGeneralRoleRequestOptions;
    constructor(ManageMemberGeneralRoleRequestOptions: ManageMemberGeneralRoleRequestOptions) {
        this.name = "ManageMemberGeneralRole";
        this.data = ManageMemberGeneralRoleRequestOptions;
    }
    fromInteraction(customClient: CustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented."); 
    }

}

class ManageMemberGeneralRoleRequestOptions {
    customClient: CustomClient;
    channel: TextChannel;
    author: User;
    authorMember: Member;
    targetUser: User;
    constructor(customClient: CustomClient, channel:TextChannel, author: User, authorMember: Member, targetUser: User) {
        this.customClient = customClient;
        this.channel = channel;
        this.author = author;
        this.authorMember = authorMember;
        this.targetUser = targetUser;
    }
}