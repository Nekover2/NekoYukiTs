import { Interaction, TextChannel, User } from "discord.js";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import CustomClient from "../base/classes/CustomClient";
import Member from "../base/NekoYuki/entities/Member";

export default class ViewProjectRequest implements IMediatorRequest {
    name: string;
    data: ViewProjectRequestOptions;

    constructor(client: CustomClient, channel: TextChannel, author: User, authorMember: Member, projectId?: string) {
        this.name = "ViewProject";
        this.data = new ViewProjectRequestOptions(client, channel, author, authorMember, projectId);
    }
    fromInteraction(customClient: CustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented.");
    }
}


class ViewProjectRequestOptions {
    client: CustomClient;
    channel: TextChannel;
    author: User;
    authorMember: Member;
    projectId?: string;
    constructor(client: CustomClient, channel: TextChannel, author: User, authorMember: Member, projectId?: string) {
        this.client = client;
        this.channel = channel;
        this.author = author;
        this.authorMember = authorMember;
        this.projectId = projectId;
    }
}