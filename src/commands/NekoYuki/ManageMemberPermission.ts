import { ActionRowBuilder, Application, ApplicationCommandOptionType, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, ModalBuilder, PermissionsBitField, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import CreateMemberRequest from "../../requests/CreateMemberRequest";
import CustomError from "../../base/classes/CustomError";
import ErrorCode from "../../base/enums/ErrorCode";
import ManageMemberPermissionRequest from "../../requests/ManageMemberPermissionRequest";
import Member from "../../base/NekoYuki/entities/Member";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export default class CreateMember extends Command {
    constructor(client: CustomClient) {
        super(client, {
            name: "manage-member-permission",
            description: "Change the permission of a member",
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

    async Execute(interaction: ChatInputCommandInteraction, authorMember : Member): Promise<void> {
        try {
            const member = interaction.options.getUser("member");
            if (!member) throw new CustomError("Member not found", ErrorCode.BadRequest, "manage-member-permission");
            //@ts-ignore
            const manageMemberPermissionRequest = new ManageMemberPermissionRequest(this.client, interaction.channel as TextChannel, interaction.user, authorMember, member);
            const result = await this.client.mediator.send(manageMemberPermissionRequest);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Manage Member Permission", error as Error);

        }

    }
}