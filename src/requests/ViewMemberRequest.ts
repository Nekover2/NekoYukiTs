import { Guild, TextChannel, User } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class ViewMemberRequest implements IMediatorRequest{
    name: string;
    data: ViewMemberRequestOptions;

    constructor(client: CustomClient, Guild: Guild, channel : TextChannel, author: User, member?: User) {
        this.name = "ViewMember";
        this.data = new ViewMemberRequestOptions(client, Guild, channel, author, member);
    }
}

class ViewMemberRequestOptions {
    client : CustomClient;
    guild : Guild;
    channel : TextChannel;
    author : User;
    member? : User;

    constructor(client: CustomClient, Guild: Guild, channel : TextChannel, author: User, member?: User) {
        this.client = client;
        this.guild = Guild;
        this.author = author;
        this.member = member;
        this.channel = channel;
    }
}
