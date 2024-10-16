import { ActionRowBuilder, Application, ApplicationCommandOptionType, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, ModalBuilder, PermissionsBitField, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import CreateMemberRequest from "../../requests/CreateMemberRequest";
import CustomError from "../../base/classes/CustomError";
import ErrorCode from "../../base/enums/ErrorCode";
import Member from "../../base/NekoYuki/entities/Member";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export default class CreateMember extends Command {
    constructor(client: CustomClient) {
        super(client, {
            name: "register-member",
            description: "Register a member to the database",
            category: Category.NekoYuki,
            options: [{
                name: "member",
                description: "The member to register",
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
            //@ts-ignore
            const createMemberRequest = new CreateMemberRequest({client: this.client, channel: interaction.channel as TextChannel, author: interaction.user, authorMember: authorMember, targetUser: interaction.options.getUser("member")});
            const result = await this.client.mediator.send(createMemberRequest);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Create Member", error as Error);
        }
    }
}