import { Message, User, EmbedBuilder, UserSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction, ComponentType, TextChannel } from "discord.js";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import ViewMemberRequest from "../requests/ViewMemberRequest";
import ErrorCode from "../base/enums/ErrorCode";
import CustomError from "../base/classes/CustomError";
import Member from "../base/NekoYuki/entities/Member";
import { PermissionHelper } from "../base/NekoYuki/enums/Permission";
import ViewMemberProjectRequest from "../requests/ViewMemberProjectRequest";
import NavigationButton from "../utils/NavigationButton";
import CustomClient from "../base/classes/CustomClient";

export default class ViewMemberHandler implements IMediatorHandle<ViewMemberRequest> {
    name: string;
    ableToNavigate: boolean;
    constructor() {
        this.name = "ViewMember";
        this.ableToNavigate = true;
    }

    async handle(value: ViewMemberRequest): Promise<any> {
        let sentMsg: Array<Message> = [];
        try {
            if (!value.data.targetUser) {
                value.data.targetUser = await ViewMemberHandler.chooseMember(value.data.channel, value.data.author);
            }
            if (!value.data.targetUser) {
                return;
            }
            await this.clearAllMessages(sentMsg);
            await this.viewMember(value, value.data.targetUser, sentMsg);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error when receiving interaction", ErrorCode.Forbidden, "view-member", error as Error);
        } finally {
            sentMsg.forEach(async msg => {
                if (msg.deletable) {
                    await msg.delete();
                }
            });
        }
    }

    async clearAllMessages(sentMsg: Array<Message>): Promise<void> {
        sentMsg.forEach(async msg => {
            if (msg.deletable) {
                await msg.delete();
            }
        });
    }

    static async chooseMember(channel: TextChannel, author: User): Promise<User | undefined> {
        try {
            const chooseMemberEmbed = new EmbedBuilder()
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setColor("Blue")
                .setDescription("Choose a member")
                .setFooter({ text: "Powered by NekoYuki" })
                .setTimestamp();
            const memberSelect = new UserSelectMenuBuilder()
                .setCustomId("memberSelect")
                .setPlaceholder("Select a member")
                .setMinValues(1)
                .setMaxValues(1);

            const cancelBtn = new ButtonBuilder()
                .setCustomId("cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger);
            const actionRow = new ActionRowBuilder().addComponents(cancelBtn);
            const memberSelectRow = new ActionRowBuilder().addComponents(memberSelect);
            //@ts-ignore
            const memberSelectMessage = await value.data.channel.send({ embeds: [chooseMemberEmbed], components: [memberSelectRow, actionRow] });
            try {
                const filter = (interaction: Interaction) => interaction.user.id === author.id;
                const memberSelectInteraction = await channel.awaitMessageComponent({ filter, time: 60000 });
                if (memberSelectInteraction.customId === "cancel") {
                    return undefined;
                }
                if (memberSelectInteraction.isUserSelectMenu()) {
                    return memberSelectInteraction.users.first() as User;
                }
            } catch (error) {
                if (error instanceof CustomError) {
                    throw error;
                }
                throw new CustomError("Time out", ErrorCode.TimeOut, "view-member", error as Error);
            }

            return undefined;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error when receiving interaction", ErrorCode.Forbidden, "view-member", error as Error);
        }
    }

    async viewMember(value: ViewMemberRequest, member: User, sentMsg: Array<Message>): Promise<void> {
        try {
            const yukiMember = await value.data.client.dataSources.getRepository(Member).createQueryBuilder("member")
                .where("member.discordId = :discordId", { discordId: member.id })
                .leftJoin('member.joinedProjects', 'project')
                .leftJoinAndSelect('member.generalRoles', 'generalRole')
                .loadRelationCountAndMap("member.joinedProjectCount", "member.joinedProjects")
                .getOne();
            if (!yukiMember) {
                throw new CustomError("Member is not registered", ErrorCode.UserCannotBeFound, "view-member");
            }
            const memberEmbed = new EmbedBuilder()
                .setAuthor({ name: member.username, iconURL: member.displayAvatarURL() })
                .setColor("Blue")
                .setTitle(`Member ${member.username} information`)
                .setDescription(`This is the information of member ${member.username}, you can see the projects they have joined, their roles, permissions, etc. If you have permission, you can edit this information.`)
                .setThumbnail(member.displayAvatarURL())
                .setFields([
                    { name: "Projects", value: yukiMember.joinedProjectCount.toString(), inline: true },
                    { name: "Join date", value: yukiMember.joinDate.toDateString(), inline: true },
                    { name: "Gmail", value: yukiMember.gmail, inline: false },
                    { name: "Positions", value: yukiMember.allRoleString(), inline: false },
                    { name: "Permissions", value: PermissionHelper.getPermissionString(yukiMember.getAllPermissions()), inline: false },
                ])
                .setFooter({ text: "Powered by NekoYuki" })
                .setTimestamp();

            // TODO: add navigation buttons
            const viewProjectStatisticBtn = new ButtonBuilder()
                .setCustomId("viewProjectStatistic")
                .setLabel("View project statistic")
                .setStyle(ButtonStyle.Primary);
            const returnBtn = NavigationButton.getReturnButton();
            const editMemberBtn = new ButtonBuilder()
                .setCustomId("editMember")
                .setLabel("Edit member")
                .setStyle(ButtonStyle.Primary);
            const actionRow = new ActionRowBuilder()
                .addComponents(viewProjectStatisticBtn, returnBtn);

            // @ts-ignore
            const memberEmbedMessage = await value.data.channel.send({ embeds: [memberEmbed], components: [actionRow] });

            let userReacion = "-1";
            try {
                const filter = (interaction: Interaction) => interaction.user.id === value.data.author.id;
                const memberInteraction = await value.data.channel.awaitMessageComponent({ filter, time: 60000, componentType: ComponentType.Button });
                memberEmbedMessage.delete();
                userReacion = memberInteraction.customId;
            } catch (error) {
                memberEmbedMessage.edit({ components: [] });
            }
            switch (userReacion) {
                case "viewProjectStatistic":
                    const viewMemberProjectRequest = new ViewMemberProjectRequest(value.data.client, value.data.channel, value.data.author, yukiMember, member);
                    await value.data.client.mediator.send(viewMemberProjectRequest);
                    break;
                case "editMember":
                    break;
                default:
                    break;
            }
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error when receiving interaction", ErrorCode.Forbidden, "view-member");
        }
    }
    async editMember(client: CustomClient, channel : TextChannel, author: User, authorMember: Member, targetMember: Member): Promise<void> {

    }
}