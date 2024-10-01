import { ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import Command from "../../base/classes/Command";
import Category from "../../base/enums/Category";
import CustomClient from "../../base/classes/CustomClient";
import CustomError from "../../base/classes/CustomError";
import ErrorCode from "../../base/enums/ErrorCode";
import CreateGeneralRoleRequest from "../../requests/CreateGeneralRoleRequest";

export default class CreateGeneralRole extends Command {
    constructor(client: CustomClient) {
        super(client, {
            name: "create-general-role",
            description: "Create a general role",
            category: Category.NekoYuki,
            options: [],
            defaultMemberPermissions: PermissionsBitField.Flags.UseApplicationCommands,
            dmPermissions: false,
            cooldown: 0,
            guildId: "-1"
        });
    }

    async Execute(interaction: ChatInputCommandInteraction ): Promise<void> {
        try {
            await interaction.deferReply({ephemeral: true});
            await interaction.deleteReply();
            const request = new CreateGeneralRoleRequest({customClient: this.client, interaction: interaction});
            const result = await this.client.mediator.send(request);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Create General Role", error as Error);
        }
    }
}