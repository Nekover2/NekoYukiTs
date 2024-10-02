import { ChatInputCommandInteraction, PermissionsBitField, TextChannel } from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import CustomError from "../../base/classes/CustomError";
import ErrorCode from "../../base/enums/ErrorCode";
import ViewProjectRequest from "../../requests/ViewProjectRequest";

export default class ViewProject extends Command {

    constructor(client: CustomClient) {
        super(client, {
            name: "view-project",
            description: "View a project",
            category: Category.NekoYuki,
            options: [],
            defaultMemberPermissions: PermissionsBitField.Flags.UseApplicationCommands,
            dmPermissions: false,
            cooldown: 0,
            guildId: "-1"
        });
    }
    async Execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            const author = interaction.user;
            await this.client.mediator.send(new ViewProjectRequest(this.client, interaction.channel as TextChannel, author));
        } catch (error) {
            if(error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "View Project", error as Error);
        }
    }
}