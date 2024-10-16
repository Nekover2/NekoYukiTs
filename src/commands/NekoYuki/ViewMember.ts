import { ApplicationCommandOptionType, ChatInputCommandInteraction, Guild, Message, PermissionsBitField, TextChannel, User } from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import ViewMemberRequest from "../../requests/ViewMemberRequest";
import CustomError from "../../base/classes/CustomError";
import ErrorCode from "../../base/enums/ErrorCode";
import Member from "../../base/NekoYuki/entities/Member";

export default class ViewMember extends Command {
    constructor(client: CustomClient) {
        super(client, {
            name: "view-member",
            description: "View a member",
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
            const member = interaction.options.getUser("member");
            if(!member) throw new CustomError("Member not found", ErrorCode.BadRequest, "view-member");
            const request = new ViewMemberRequest(this.client, interaction.channel as TextChannel, interaction.user, authorMember, member);
            await this.client.mediator.send(request);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error when receiving interaction", ErrorCode.Forbidden, "view-member",error as Error);
        }
    }
}