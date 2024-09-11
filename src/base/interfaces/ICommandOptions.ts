import { ChatInputCommandInteraction } from "discord.js";
import CustomClient from "../classes/CustomClient";
import Category from "../enums/Category";

export default interface ICommandOptions {
    name: string;
    description: string;
    category: Category;
    options: object;
    defaultMemberPermissions: bigint;
    dmPermissions: boolean;
    cooldown: number;
    guildId: string;
}