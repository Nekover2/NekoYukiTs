import { GuildMember, Interaction, TextChannel, User } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class CreateMemberRequest implements IMediatorRequest {
    name: string;
    data: CreateMemberOptions;

    constructor(client: CustomClient, channel: TextChannel, member: User, author: User) {
        this.name = "CreateMember";
        this.data = new CreateMemberOptions(client, channel, member, author);
    }
    fromInteraction(customClient: CustomClient, interaction: Interaction): IMediatorRequest {
        return new CreateMemberRequest(customClient, interaction.channel as TextChannel, interaction.member?.user as User, interaction.user);
    }
}

class CreateMemberOptions {
    client: CustomClient;
    channel: TextChannel;
    member: User;
    author: User
    constructor(client: CustomClient, channel: TextChannel, member: User, author: User) {
        this.client = client;
        this.channel = channel;
        this.member = member;
        this.author = author;
    }
}