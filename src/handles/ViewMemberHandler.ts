import { Message, User, EmbedBuilder, UserSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction } from "discord.js";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import ViewMemberRequest from "../requests/ViewMemberRequest";
import ErrorCode from "../base/enums/ErrorCode";
import CustomError from "../base/classes/CustomError";
import Member from "../base/NekoYuki/entities/Member";
import { PositionHelper } from "../base/NekoYuki/enums/Position";
import { PermissionHelper } from "../base/NekoYuki/enums/Permission";

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
            if (!value.data.member) {
                value.data.member = await this.chooseMember(value, sentMsg);
            }
            if (!value.data.member) {
                return;
            }
            await this.clearAllMessages(sentMsg);
            await this.viewMember(value, value.data.member, sentMsg);
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

    async chooseMember(value: ViewMemberRequest, sentMsg: Array<Message>): Promise<User | undefined> {
        try {
            const chooseMemberEmbed = new EmbedBuilder()
                .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
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
            sentMsg.push(memberSelectMessage);
            try {
                const filter = (interaction: Interaction) => interaction.user.id === value.data.author.id;
                const memberSelectInteraction = await value.data.channel.awaitMessageComponent({ filter, time: 60000 });
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
        } finally {
            await this.clearAllMessages(sentMsg);
        }
    }

    async viewMember(value: ViewMemberRequest, member: User, sentMsg: Array<Message>): Promise<void> {
        try {
            const yukiMember = await value.data.client.dataSources.getRepository(Member).createQueryBuilder("member")
                .where("member.discordId = :discordId", { discordId: member.id })
                .leftJoin('member.joinedProjects', 'project')
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
            const memberEmbedMessage = await value.data.channel.send({ embeds: [memberEmbed] });

            // TODO: add navigation buttons
        } catch (error) {
            
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error when receiving interaction", ErrorCode.Forbidden, "view-member");
        } finally {
            await this.clearAllMessages(sentMsg);
        }
    }
}