import { Interaction, TextChannel, User } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class CreateProjectRequest implements IMediatorRequest {
    name: string;
    data: CrateProjectRequestOptions;

    constructor(client: CustomClient, channel: TextChannel, author: User) {
        this.name = "CreateProject";
        this.data = new CrateProjectRequestOptions(client, channel, author);
    }
    fromInteraction(customClient: CustomClient, interaction: Interaction): IMediatorRequest {
        return new CreateProjectRequest(customClient, interaction.channel as TextChannel, interaction.user);
    }
}

class CrateProjectRequestOptions {
    client: CustomClient;
    channel: TextChannel;
    author: User;
    constructor(client: CustomClient, channel: TextChannel, author: User) {
        this.client = client;
        this.channel = channel;
        this.author = author;
    }
}