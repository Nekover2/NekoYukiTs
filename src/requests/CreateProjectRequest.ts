import { Interaction, TextChannel, User } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import Member from "../base/NekoYuki/entities/Member";

export default class CreateProjectRequest implements IMediatorRequest {
    name: string;
    data: CrateProjectRequestOptions;

    constructor(client: CustomClient, channel: TextChannel, author: User, authorMember: Member) {
        this.name = "CreateProject";
        this.data = new CrateProjectRequestOptions(client, channel, author, authorMember);
    }
    fromInteraction(customClient: CustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented.");
    }
}

class CrateProjectRequestOptions {
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