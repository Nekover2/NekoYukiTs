import { ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import Member from "../../base/NekoYuki/entities/Member";
import CustomError from "../../base/classes/CustomError";
import ErrorCode from "../../base/enums/ErrorCode";

export default class GuildConfig extends Command {
    constructor(client : CustomClient) {
        super(client, {
            name: "guild-config",
            description: "Change the guild configuration",
            category: Category.NekoYuki,
            options: [],
            defaultMemberPermissions: PermissionsBitField.Flags.Administrator,
            dmPermissions: false,
            cooldown: 0,
            guildId: "-1"
        });
    }

    async Execute(interaction: ChatInputCommandInteraction, authorMember?: Member): Promise<void> {
        try {
            //@ts-ignore
            const guildConfigRequest = new GuildConfigRequest(this.client, interaction.channel, interaction.user);
            const result = await this.client.mediator.send(guildConfigRequest);
        } catch (error) {
            if(error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Guild Config", error as Error);
        }
    }
}