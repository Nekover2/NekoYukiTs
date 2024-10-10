import { ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import Member from "../../base/NekoYuki/entities/Member";
import CustomError from "../../base/classes/CustomError";
import ErrorCode from "../../base/enums/ErrorCode";
import GuildConfigRequest from "../../requests/GuildConfigRequest";
import ViewGeneralRoleRequest from "../../requests/ViewGeneralRoleRequest";
export default class ViewGeneralRole extends Command {
    constructor(client : CustomClient) {
        super(client, {
            name: "general-role",
            description: "View all general roles",
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
            const viewGeneralRoleRequest = new ViewGeneralRoleRequest({client: this.client, channel: interaction.channel, author: interaction.user, authorMember: authorMember});
            const result = await this.client.mediator.send(viewGeneralRoleRequest);
        } catch (error) {
            if(error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Guild Config", error as Error);
        }
    }
}