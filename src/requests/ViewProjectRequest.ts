import { Interaction, TextChannel, User } from "discord.js";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import CustomClient from "../base/classes/CustomClient";

export default class ViewProjectRequest implements IMediatorRequest {
    name: string;
    data: ViewProjectRequestOptions;

    constructor(client: CustomClient, channel: TextChannel, author: User, projectId?: string) {
        this.name = "ViewProject";
        this.data = new ViewProjectRequestOptions(client,channel,author, projectId);
    }
    fromInteraction(customClient: CustomClient, interaction: Interaction): IMediatorRequest {
        return new ViewProjectRequest(customClient, interaction.channel as TextChannel, interaction.user);
    }
}


class ViewProjectRequestOptions {
    client: CustomClient;
    author: User;
    channel: TextChannel;
    projectId?: string;
    constructor(client: CustomClient,channel: TextChannel, author: User, projectId?: string) {
        this.client = client;
        this.author = author;
        this.channel = channel;
        this.projectId = projectId;
    }
}