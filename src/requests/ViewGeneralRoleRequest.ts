import { Interaction, TextChannel, User } from "discord.js";
import ICustomClient from "../base/interfaces/ICustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import CustomClient from "../base/classes/CustomClient";
import Member from "../base/NekoYuki/entities/Member";

export default class ViewGeneralRoleRequest implements IMediatorRequest {
    name: string;
    data: ViewGeneralRoleRequestOptions;

    constructor(data: ViewGeneralRoleRequestOptions) {
        this.name = "ViewGeneralRole";
        this.data = data;
    }
    fromInteraction(customClient: ICustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented.");
    }

}

class ViewGeneralRoleRequestOptions {
    client: CustomClient;
    channel: TextChannel;
    author: User;
    authorMember: Member;
    constructor(client: CustomClient, channel: TextChannel, author: User, authorMember: Member) {
        this.client = client;
        this.channel = channel;
        this.author = author;
        this.authorMember = authorMember;
    }
}