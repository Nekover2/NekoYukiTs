import { ChatInputCommandInteraction } from 'discord.js';
import Category from '../enums/Category';
import ICommand from '../interfaces/ICommand'
import CustomClient from './CustomClient';
import ICommandOptions from '../interfaces/ICommandOptions';
import Member from '../NekoYuki/entities/Member';

export default class Command implements ICommand {
    client: CustomClient;
    name: string;
    description: string;
    category: Category;
    options: object;
    defaultMemberPermissions: bigint;
    dmPermissions: boolean;
    cooldown: number;
    guildId: string;
    constructor(client: CustomClient, options: ICommandOptions) {
        this.client = client;
        this.name = options.name;
        this.description = options.description;
        this.category = options.category;
        this.options = options.options;
        this.defaultMemberPermissions = options.defaultMemberPermissions;
        this.dmPermissions = options.dmPermissions;
        this.cooldown = options.cooldown;
        this.guildId = options.guildId;
    }
    Execute(interaction: ChatInputCommandInteraction, authorMember?: Member): void {
        throw new Error('Method not implemented.');
    }
    AutoComplete(interaction: ChatInputCommandInteraction): void {
        throw new Error('Method not implemented.');
    }
}