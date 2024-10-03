import { Interaction, TextChannel, User } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import IProject from "../base/NekoYuki/interfaces/IProject";
import IMember from "../base/NekoYuki/interfaces/IMember";

export default class CreateChapterRequest implements IMediatorRequest{
    name: string;
    data: CreateChapterRequestOptions;

    constructor(client: CustomClient, channel: TextChannel, author: User, authorMember: IMember, project: IProject, targetUser?: User, targetMember?: IMember) {
        this.name = "CreateChapter";
        this.data = new CreateChapterRequestOptions(client, channel, author, authorMember, project, targetUser, targetMember);
    }
    fromInteraction(customClient: CustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("You cannot create this request from navigation.");
    }
}


class CreateChapterRequestOptions {
    client: CustomClient;
    channel: TextChannel;
    author: User;
    authorMember: IMember;
    targetUser? : User;
    targerMember?: IMember;
    project: IProject;

    constructor(client: CustomClient, channel: TextChannel, author: User, authorMember: IMember, project: IProject, targetUser?: User, targetMember?: IMember) {
        this.client = client;
        this.channel = channel;
        this.author = author;
        this.authorMember = authorMember;
        this.project = project;
    }
}