import { ActionRowBuilder, Application, ApplicationCommandOptionType, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, ModalBuilder, PermissionsBitField, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import CustomError from "../../base/classes/CustomError";
import ErrorCode from "../../base/enums/ErrorCode";
import ManageMemberGeneralRoleRequest from "../../requests/ManageMemberGeneralRoleRequest";
import Member from "../../base/NekoYuki/entities/Member";


export default class CreateMember extends Command {
    constructor(client: CustomClient) {
        super(client, {
            name: "manage-member-general-role",
            description: "Update general role of a member",
            category: Category.NekoYuki,
            options: [{
                name: "member",
                description: "The member you want to manage",
                type: ApplicationCommandOptionType.User,
                required: true
            }],
            defaultMemberPermissions: PermissionsBitField.Flags.UseApplicationCommands,
            dmPermissions: false,
            cooldown: 0,
            guildId: "-1"
        });
    }

    async Execute(interaction: ChatInputCommandInteraction, authorMember: Member): Promise<void> {
        try {
            const member = interaction.options.getUser("member");
            if (!member) throw new CustomError("Member not found", ErrorCode.BadRequest, "manage-member-general-role");
            //@ts-ignore
            const result = await this.client.mediator.send(new ManageMemberGeneralRoleRequest({
                customClient: this.client,
                channel: interaction.channel as TextChannel,
                author: interaction.user,
                authorMember: authorMember,
                targetUser: member
            }));
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Manage Member Role", error as Error);

        }

    }
}