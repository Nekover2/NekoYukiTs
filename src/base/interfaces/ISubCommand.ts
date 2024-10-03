import { ChatInputCommandInteraction } from "discord.js";
import CustomClient from "../classes/CustomClient";
import Member from "../NekoYuki/entities/Member";

export default interface ISubCommand {
    client : CustomClient;
    name : string;

    Execute(interaction : ChatInputCommandInteraction, authorMember?: Member) : void;
}