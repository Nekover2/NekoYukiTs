import { ChatInputCommandInteraction, PermissionsBitField, TextChannel } from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import CustomError from "../../base/classes/CustomError";
import ErrorCode from "../../base/enums/ErrorCode";
import CreateProjectRequest from "../../requests/CreateProjectRequest";
import Member from "../../base/NekoYuki/entities/Member";
export default class CreateProject extends Command {
    constructor(client : CustomClient) {
        super(client, {
            name: "create-project",
            description: "Create a project",
            category: Category.NekoYuki,
            options: [],
            defaultMemberPermissions: PermissionsBitField.Flags.UseApplicationCommands,
            dmPermissions: false,
            cooldown: 0,
            guildId: "-1"
        });
    }

    async Execute(interaction: ChatInputCommandInteraction, authorMember : Member): Promise<void> {
        try {
            //@ts-ignore
            const createProjectRequest = new CreateProjectRequest(this.client, interaction.channel as TextChannel, interaction.user, authorMember);
            const result = await this.client.mediator.send(createProjectRequest);
        } catch (error) {
            if(error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Create Project", error as Error);
        }
    }
}