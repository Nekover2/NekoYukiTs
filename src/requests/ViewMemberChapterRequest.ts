import { Interaction, TextChannel, User } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import Member from "../base/NekoYuki/entities/Member";
import ICustomClient from "../base/interfaces/ICustomClient";

export default class ViewMemberChapterRequest implements IMediatorRequest {
    name: string = "ViewMemberChapter";
    data: ViewMemberChapterRequestOptions;
    constructor(data: ViewMemberChapterRequestOptions) {
        this.data = data;
    }
    fromInteraction(customClient: ICustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented.");
    }
}


class ViewMemberChapterRequestOptions {
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