import { GuildMember, TextChannel } from "discord.js";
import ICustomClient from "../base/interfaces/ICustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class CreateMemberRequest implements IMediatorRequest {
    name: string;
    data: CreateMemberOptions;

    constructor(client: ICustomClient, channel: TextChannel, member: GuildMember, author: GuildMember) {
        this.name = "CreateMember";
        this.data = new CreateMemberOptions(client, channel, member, author);
    }
}

class CreateMemberOptions {
    client: ICustomClient;
    channel: TextChannel;
    member: GuildMember;
    author: GuildMember
    constructor(client: ICustomClient, channel: TextChannel, member: GuildMember, author: GuildMember) {
        this.client = client;
        this.channel = channel;
        this.member = member;
        this.author = author;
    }
}