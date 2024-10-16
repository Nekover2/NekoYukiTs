import { Message, User, EmbedBuilder, UserSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction, ComponentType, TextChannel, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonInteraction } from "discord.js";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import ViewMemberRequest from "../requests/ViewMemberRequest";
import ErrorCode from "../base/enums/ErrorCode";
import CustomError from "../base/classes/CustomError";
import Member from "../base/NekoYuki/entities/Member";
import Permission, { PermissionHelper } from "../base/NekoYuki/enums/Permission";
import ViewMemberProjectRequest from "../requests/ViewMemberProjectRequest";
import NavigationButton from "../utils/NavigationButton";
import CustomClient from "../base/classes/CustomClient";
import ManageMemberGeneralRoleRequest from "../requests/ManageMemberGeneralRoleRequest";
import ManageMemberPermissionRequest from "../requests/ManageMemberPermissionRequest";

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
                memberSelectMessage.edit({ components: [] });
                return undefined;
            }

            return undefined;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error when receiving interaction", ErrorCode.Forbidden, "view-member", error as Error);
        }
    }

    async viewMember(value: ViewMemberRequest, member: User, sentMsg: Array<Message>): Promise<boolean> {
        try {
            let loopFlag = false;

            do {
                const yukiMember = await value.data.client.dataSources.getRepository(Member).createQueryBuilder("member")
                    .where("member.discordId = :discordId", { discordId: value.data.targetUser?.id })
                    .leftJoin('member.joinedProjects', 'project')
                    .leftJoinAndSelect('member.generalRoles', 'generalRole')
                    .leftJoinAndSelect('generalRole.role', 'role')
                    .loadRelationCountAndMap("member.joinedProjectCount", "member.joinedProjects")
                    .getOne();
                
                if (!yukiMember) {
                    throw new CustomError("Member is not registered", ErrorCode.UserCannotBeFound, "view-member");
                }
                const memberEmbed = new EmbedBuilder()
                    .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
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
    
                const viewProjectStatisticBtn = new ButtonBuilder()
                    .setCustomId("viewProjectStatistic")
                    .setLabel("View project statistic")
                    .setStyle(ButtonStyle.Success);
                const returnBtn = NavigationButton.getReturnButton();
                const editMemberBtn = new ButtonBuilder()
                    .setCustomId("editMember")
                    .setLabel("Edit member")
                    .setStyle(ButtonStyle.Primary);
                const actionRow = new ActionRowBuilder()
                    .addComponents(viewProjectStatisticBtn);
                
                // Check if author have permission to manage member info...
                let editMemberFlag = false;
                if(value.data.authorMember.hasPermission(Permission.ManageMember)) editMemberFlag = true;
                if(editMemberFlag) actionRow.addComponents(editMemberBtn);
                actionRow.addComponents(returnBtn);
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
                        const viewMemberProjectRequest = new ViewMemberProjectRequest(value.data.client, value.data.channel, value.data.author, value.data.authorMember, member);
                        loopFlag = await value.data.client.mediator.send(viewMemberProjectRequest);
                        break;
                    case "editMember":
                        loopFlag = await this.editMember(value.data.client, value.data.channel, value.data.author, value.data.authorMember, member, yukiMember);
                        break;
                    case "return":
                        return true;
                    default:
                        return false;
                        break;
                }
            } while (loopFlag);
            return false;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error when receiving interaction", ErrorCode.Forbidden, "view-member", error as Error);
        }
    }
    async editMember(client: CustomClient, channel : TextChannel, author: User, authorMember: Member, targetUser: User,  targetMember: Member): Promise<boolean> {
        try {
            let loopFlag = false;
            do {
                const editGmailButton = new ButtonBuilder()
                    .setCustomId("editgmail")
                    .setLabel("Gmail")
                    .setStyle(ButtonStyle.Primary);
    
                const editRoleBtn = new ButtonBuilder()
                    .setCustomId("editrole")
                    .setLabel("Edit roles")
                    .setStyle(ButtonStyle.Primary);
                
                const editPermissionBtn = new ButtonBuilder()
                    .setCustomId("editperms")
                    .setLabel("Edit permissions")
                    .setStyle(ButtonStyle.Primary);
                
                const returnBtn = new ButtonBuilder()
                    .setCustomId("return")
                    .setLabel("Return")
                    .setStyle(ButtonStyle.Secondary);
    
                const editRow = new ActionRowBuilder()
                    .addComponents(editGmailButton, editRoleBtn, editPermissionBtn, returnBtn);
                const infoEmbed = new EmbedBuilder()
                    .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                    .setColor("Yellow")
                    .setTitle(`Before editing member ${targetUser.displayName}`)
                    .setDescription(`Note that you are about to edit member ${targetUser.displayName}, please provide the new information for this member. You can edit their gmail, roles, permissions, etc. Please click a button below to start.`)
    
                //@ts-ignore
                const infoMsg = await channel.send({embeds: [infoEmbed], components: [editRow]});
                let btnInteraction : ButtonInteraction;
                try {
                    const filter = (interaction : Interaction) => interaction.user.id == author.id;
                    btnInteraction = await infoMsg.awaitMessageComponent({filter: filter, time: 60000, componentType: ComponentType.Button});
                    infoMsg.delete();
                } catch (error) {
                    infoMsg.edit({components:[]});
                    return false;
                }
                
                // @ts-ignore
                switch(btnInteraction.customId) {
                    case "editroles":
                        const editRolesRequest = new ManageMemberGeneralRoleRequest({customClient: client, channel: channel, author: author, authorMember: authorMember, targetUser: targetUser});
                        loopFlag= await client.mediator.send(editRolesRequest);
                        break;
                    case "editperms":
                        const editPermsRequest = new ManageMemberPermissionRequest(client, channel, author, authorMember, targetUser);
                        loopFlag =  await client.mediator.send(editPermsRequest);
                        break;
                    case "editgmail":
                        // @ts-ignore
                        loopFlag =  await this.getMemberStringInfo(client, channel, author, authorMember, targetUser, targetMember, btnInteraction);
                        break;
                    case "return":
                        return true;
                    default:
                        break;
                }
            } while (loopFlag);
            return true;
        } catch (error) {
            if(error instanceof CustomError) throw error;
            throw new CustomError("An unknown error occurred.", ErrorCode.InternalServerError, "Edit member", error as Error);
        }
    }

    async getMemberStringInfo(client: CustomClient, channel : TextChannel, author: User, authorMember: Member, targetUser: User,  targetMember: Member, btnInteraction: ButtonInteraction) {
        try {
            const getNewInfoModal = new ModalBuilder()
                .setCustomId("editMemberModal")
                .setTitle(`Edit member ${targetUser.displayName}`);
            const getGmailInput = new TextInputBuilder()
                .setCustomId("editGmail")
                .setLabel("Your gmail")
                .setMaxLength(32)
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(targetMember.gmail);
            const getGmailRow = new ActionRowBuilder()
                .addComponents(getGmailInput);
            //@ts-ignore
            getNewInfoModal.addComponents(getGmailRow);

            await btnInteraction.showModal(getNewInfoModal);

            try {
                const filter = (interaction : Interaction) => interaction.user.id == author.id;
                const modalSubmit = await btnInteraction.awaitModalSubmit({filter: filter, time: 60000});
                const gmailInputString = modalSubmit.fields.getTextInputValue("editGmail");
                modalSubmit.reply({content: `Gmail will be changed to ${gmailInputString}`, ephemeral: true});
                targetMember.gmail = gmailInputString;
            } catch (error) {
                return false;
            }

            try {
                await client.dataSources.getRepository(Member).save(targetMember);
            } catch (error) {
                throw new CustomError("Failed to save member to the database", ErrorCode.InternalServerError, "Edit member gmail", error as Error);
            }
            const sucessEmbed = new EmbedBuilder()
                .setTitle("Success")
                .setDescription(`Member <@${targetUser.id}> gmail has been updated successfully, new gmail: ***${targetMember.gmail}***`)
                .setColor("Green")
                .setTimestamp()
                .setFooter({ text: "NekoYuki's manager" });
            const successMsg = await channel.send({ embeds: [sucessEmbed] });
            const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
            await delay(3000);
            if (successMsg.deletable) {
                await successMsg.delete();
            }
            return true;
        } catch (error) {
            if(error instanceof CustomError) throw error;
            throw new CustomError("An unknown error occurred.", ErrorCode.InternalServerError, "Edit member gmail", error as Error);
        }
    }
}