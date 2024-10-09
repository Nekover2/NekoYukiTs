import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, Interaction, StringSelectMenuBuilder, TextChannel, UserSelectMenuBuilder } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import Member from "../base/NekoYuki/entities/Member";
import ManageMemberGeneralRoleRequest from "../requests/ManageMemberGeneralRoleRequest";
import GeneralRole from "../base/NekoYuki/entities/GeneralRole";
import MemberGeneralRole from "../base/NekoYuki/entities/GeneralMemberRole";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
export default class ManageMemberGeneralRoleHandler implements IMediatorHandle<ManageMemberGeneralRoleRequest> {
    name: string;
    ableToNavigate: boolean;
    constructor() {
        this.name = "ManageMemberGeneralRole";
        this.ableToNavigate = false;
    }

    async checkPermission(value: ManageMemberGeneralRoleRequest): Promise<boolean> {
        // TODO: Check permission
        return true;
    }
    async handle(value: ManageMemberGeneralRoleRequest): Promise<any> {
        try {
            await this.checkPermission(value);
            const member = await this.chooseMember(value);
            await this.manageMemberGeneralRole(value, member);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Manage Member General Role", error as Error);
        }
    }

    async chooseMember(value: ManageMemberGeneralRoleRequest): Promise<Member> {
        try {
            if (value.data.targetUser) {
                const existingMember = await value.data.customClient.dataSources.getRepository(Member).findOne({
                    where: { discordId: value.data.targetUser.id },
                    relations: ["generalRoles"]
                });
                if (!existingMember) {
                    throw new CustomError("Member not found", ErrorCode.UserCannotBeFound, "Manage Member General Role");
                }
                return existingMember;
            }
            const chooseMemberEmbed = new EmbedBuilder()
                .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                .setColor("Blue")
                .setTitle("Choose a member")
                .setTimestamp()
                .setFooter({ text: "Powered by NekoYuki" });

            const userSelect = new UserSelectMenuBuilder()
                .setCustomId("userSelect")
                .setMaxValues(1)
                .setPlaceholder("Select a member");
            const userRow = new ActionRowBuilder().addComponents(userSelect);
            // @ts-ignore
            const chooseUserMsg = await value.data.channel.send({ embeds: [chooseMemberEmbed], components: [userRow] });

            try {
                const userFilter = (interaction: Interaction) => interaction.user.id === value.data.author.id;
                const userSelectInteraction = await chooseUserMsg.awaitMessageComponent({ filter: userFilter, time: 60000, componentType: ComponentType.UserSelect });
                chooseUserMsg.delete();
                const selectedUser = userSelectInteraction.users.first();
                if (!selectedUser) {
                    throw new CustomError("User not found", ErrorCode.UserCannotBeFound, "Manage Member General Role");
                }
                const choosedMember = await value.data.customClient.dataSources.getRepository(Member).findOne({
                    where: { discordId: selectedUser.id },
                    relations: ["generalRoles"]
                });
                if (!choosedMember) {
                    throw new CustomError("Member not found", ErrorCode.UserCannotBeFound, "Manage Member General Role");
                }
                return choosedMember;
            } catch (error) {
                if (error instanceof CustomError) throw error;
                throw new CustomError("Time out", ErrorCode.TimeOut, "Manage Member General Role", error as Error);
            } finally {
                if (chooseUserMsg.deletable)
                    chooseUserMsg.delete();
            }
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Manage Member General Role", error as Error);
        }
    }

    async manageMemberGeneralRole(value: ManageMemberGeneralRoleRequest, targetMember: Member): Promise<boolean> {
        try {
            const currMember = Object.assign({}, targetMember);
            const roleList = await value.data.customClient.dataSources.getRepository(GeneralRole).find();
            if (!currMember) {
                throw new CustomError("Member not found", ErrorCode.UserCannotBeFound, "Manage Member General Role");
            }
            do {
                const chooseRoleEmbed = new EmbedBuilder()
                    .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                    .setColor("Blue")
                    .setTitle(`General Role Management`)
                    .setDescription(`This is general role mangager for <@${targetMember.discordId}>.\n` +
                        `Note that:\n` +
                        `- 1. Choose an **existing role** will **remove** the role from the member.\n` +
                        `- 2. Choose a **new role** will **add** the role to the member.\n` +
                        `- 3. You can only choose role **one by one**.\n` +
                        `- 4. You can cancel this operation by clicking the ***cancel*** button, it will reset the role to the previous state.\n` +
                        `- 5. You can finish this operation by clicking the ***finish*** button.\n`)
                    .setTimestamp()
                    .addFields([
                        { name: "Old Roles", value: targetMember.generalRoles.map(role => role.role.Name).join(", ") || "No Role" },
                        { name: "Current Roles", value: currMember.generalRoles.map(role => role.role.Name).join(", ") || "No Role" },
                    ])
                    .setFooter({ text: "Powered by NekoYuki" });
                const btnRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("finish")
                            .setLabel("Finish")
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId("cancel")
                            .setLabel("Cancel")
                            .setStyle(ButtonStyle.Danger)
                    );
                const roleSelect = new StringSelectMenuBuilder()
                    .setCustomId("roleSelect")
                    .setMaxValues(1)
                    .setPlaceholder("Select a role")
                    .addOptions(roleList.map(role => {
                        return {
                            label: role.Name,
                            value: role.Id.toString()
                        };
                    }));
                const roleRow = new ActionRowBuilder().addComponents(roleSelect);

                // @ts-ignore
                const chooseRoleMsg = await value.data.channel.send({ embeds: [chooseRoleEmbed], components: [roleRow, btnRow] });
                let endingStr = "-1";
                try {
                    const roleFilter = (interaction: Interaction) => interaction.user.id === value.data.author.id;
                    const roleSelectInteraction = await chooseRoleMsg.awaitMessageComponent({ filter: roleFilter, time: 60000 });
                    chooseRoleMsg.delete();
                    if (roleSelectInteraction.isButton()) {
                        endingStr = roleSelectInteraction.customId;
                    }

                    if (roleSelectInteraction.isStringSelectMenu()) {
                        const selectedRole = roleList.find(role => role.Id === parseInt(roleSelectInteraction.values[0]));
                        if (!selectedRole) {
                            throw new CustomError("Role not found", ErrorCode.UserCannotBeFound, "Manage Member General Role");
                        }
                        const newMemberGeneralRole = new MemberGeneralRole();
                        newMemberGeneralRole.member = currMember;
                        newMemberGeneralRole.role = selectedRole;
                        newMemberGeneralRole.createdAt = new Date();
                        const roleIndex  = currMember.generalRoles.findIndex(role => role.role.Id === selectedRole.Id);
                        if (roleIndex !== -1) {
                            currMember.generalRoles.splice(roleIndex, 1);
                        } else {
                            currMember.generalRoles.push(newMemberGeneralRole);
                        }
                    }
                } catch (error) {
                    chooseRoleMsg.edit({ components: [] });
                    return false;
                }

                if(endingStr == "-1") return false;
                if (endingStr === "finish") {
                    await value.data.customClient.dataSources.getRepository(Member).save(currMember);
                    for (const role of currMember.generalRoles) {
                        await value.data.customClient.dataSources.getRepository(MemberGeneralRole).save(role);
                    }
                    const finishEmbed = new EmbedBuilder()
                        .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                        .setColor("Green")
                        .setTitle("General Role Management")
                        .setDescription(`Successfully managed general role for <@${currMember.discordId}>.`)
                        .addFields([
                            { name: "Current Roles", value: currMember.generalRoles.map(role => role.role.Name).join(", ") || "No Role" }
                        ])
                        .setTimestamp()
                        .setFooter({ text: "Powered by NekoYuki" });
                    let resultMsg = await value.data.channel.send({ embeds: [finishEmbed] });
                    await delay(5000);
                    if (resultMsg.deletable) {
                        resultMsg.delete();
                    }
                    return true;
                }
                if (endingStr === "cancel") {
                    const cancelEmbed = new EmbedBuilder()
                        .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                        .setColor("Red")
                        .setTitle("General Role Management")
                        .setDescription(`Cancelled general role management for <@${currMember.discordId}>. All changes are reverted.`)
                        .addFields([
                            { name: "Current Roles", value: targetMember.generalRoles.map(role => role.role.Name).join(", ") || "No Role" }
                        ])
                        .setTimestamp()
                        .setFooter({ text: "Powered by NekoYuki" });
                    let resultMsg = await value.data.channel.send({ embeds: [cancelEmbed] });
                    await delay(5000);
                    if (resultMsg.deletable) {
                        resultMsg.delete();
                    }
                    return true;
                }
            } while (true);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Manage Member General Role", error as Error);
        }
    }
}