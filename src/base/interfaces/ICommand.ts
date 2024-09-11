import { ChatInputCommandInteraction } from "discord.js";
import CustomClient from "../classes/CustomClient";
import Category from "../enums/Category";

export default interface ICommand {
    client: CustomClient;
    name: string;
    description: string;
    category: Category;
    options: object;
    defaultMemberPermissions: bigint;
    dmPermissions: boolean;
    cooldown: number;
    guildId: string;

    Execute(interaction : ChatInputCommandInteraction) : void;
    AutoComplete(interaction : ChatInputCommandInteraction) : void;
}