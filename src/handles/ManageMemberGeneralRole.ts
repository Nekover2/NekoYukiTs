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
    async handle(value: ManageMemberGeneralRoleRequest): Promise<any> {
        try {
            const member = await this.chooseMember(value);
            await this.manageMemberGeneralRole(value, member);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Manage Member General Role", error as Error);
        }
    }

    async chooseMember(value: ManageMemberGeneralRoleRequest): Promise<Member> {
        try {
            if (value.data.member) {
                const existingMember = await value.data.customClient.dataSources.getRepository(Member).findOne({
                    where: { discordId: value.data.member.id },
                    relations: ["generalRoles"]
                });
                if (!existingMember) {
                    throw new CustomError("Member not found", ErrorCode.UserCannotBeFound, "Manage Member General Role");
                }

                return existingMember;
            }

            const existingMember = await value.data.customClient.dataSources.getRepository(Member).findOne({
                where: { discordId: value.data.interaction.user.id },
                relations: ["generalRoles"]
            });

            const chooseMemberEmbed = new EmbedBuilder()
                .setAuthor({ name: value.data.interaction.user.username, iconURL: value.data.interaction.user.displayAvatarURL() })
                .setColor("Blue")
                .setTitle("Choose a member")
                .setTimestamp()
                .setFooter({ text: "Powered by NekoYuki" });

            const userSelect = new UserSelectMenuBuilder()
                .setCustomId("userSelect")
                .setMaxValues(1)
                .setPlaceholder("Select a member");
            const userRow = new ActionRowBuilder().addComponents(userSelect);

            const currChannel = value.data.interaction.channel as TextChannel;
            // @ts-ignore
            const chooseUserMsg = await currChannel.send({ embeds: [chooseMemberEmbed], components: [userRow] });

            try {
                const userFilter = (interaction: Interaction) => interaction.user.id === value.data.interaction.user.id;
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

    async manageMemberGeneralRole(value: ManageMemberGeneralRoleRequest, member: Member): Promise<void> {
        try {
            const roleList = await value.data.customClient.dataSources.getRepository(GeneralRole).find();
            const currMember = await value.data.customClient.dataSources.getRepository(Member).findOne({
                where: { discordId: member.discordId },
                relations: ["generalRoles"]
            });
            if (!currMember) {
                throw new CustomError("Member not found", ErrorCode.UserCannotBeFound, "Manage Member General Role");
            }
            do {
                const chooseRoleEmbed = new EmbedBuilder()
                    .setAuthor({ name: value.data.interaction.user.username, iconURL: value.data.interaction.user.displayAvatarURL() })
                    .setColor("Blue")
                    .setTitle(`General Role Management`)
                    .setDescription(`This is general role mangager for <@${member.discordId}>.\n` +
                        `Note that:\n` +
                        `- 1. Choose an **existing role** will **remove** the role from the member.\n` +
                        `- 2. Choose a **new role** will **add** the role to the member.\n` +
                        `- 3. You can only choose role **one by one**.\n` +
                        `- 4. You can cancel this operation by clicking the ***cancel*** button, it will reset the role to the previous state.\n` +
                        `- 5. You can finish this operation by clicking the ***finish*** button.\n`)
                    .setTimestamp()
                    .addFields([
                        { name: "Old Roles", value: member.generalRoles.map(role => role.role.Name).join(", ") || "No Role" },
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
                const currChannel = value.data.interaction.channel as TextChannel;

                // @ts-ignore
                const chooseRoleMsg = await currChannel.send({ embeds: [chooseRoleEmbed], components: [roleRow, btnRow] });

                try {
                    const roleFilter = (interaction: Interaction) => interaction.user.id === value.data.interaction.user.id;
                    const roleSelectInteraction = await chooseRoleMsg.awaitMessageComponent({ filter: roleFilter, time: 60000 });
                    chooseRoleMsg.delete();
                    if (roleSelectInteraction.isButton()) {
                        if (roleSelectInteraction.customId === "finish") {
                            await value.data.customClient.dataSources.getRepository(Member).save(member);
                            for (const role of currMember.generalRoles) {
                                await value.data.customClient.dataSources.getRepository(MemberGeneralRole).save(role);
                            }
                            const finishEmbed = new EmbedBuilder()
                                .setAuthor({ name: value.data.interaction.user.username, iconURL: value.data.interaction.user.displayAvatarURL() })
                                .setColor("Green")
                                .setTitle("General Role Management")
                                .setDescription(`Successfully managed general role for <@${member.discordId}>.`)
                                .addFields([
                                    { name: "Current Roles", value: currMember.generalRoles.map(role => role.role.Name).join(", ") || "No Role" }
                                ])
                                .setTimestamp()
                                .setFooter({ text: "Powered by NekoYuki" });
                            let resultMsg = await currChannel.send({ embeds: [finishEmbed] });
                            await delay(5000);
                            if (resultMsg.deletable) {
                                resultMsg.delete();
                            }
                            return;
                        }
                        if (roleSelectInteraction.customId === "cancel") {
                            const cancelEmbed = new EmbedBuilder()
                                .setAuthor({ name: value.data.interaction.user.username, iconURL: value.data.interaction.user.displayAvatarURL() })
                                .setColor("Red")
                                .setTitle("General Role Management")
                                .setDescription(`Cancelled general role management for <@${member.discordId}>. All changes are reverted.`)
                                .addFields([
                                    { name: "Current Roles", value: member.generalRoles.map(role => role.role.Name).join(", ") || "No Role" }
                                ])
                                .setTimestamp()
                                .setFooter({ text: "Powered by NekoYuki" });
                            let resultMsg = await currChannel.send({ embeds: [cancelEmbed] });
                            await delay(5000);
                            if (resultMsg.deletable) {
                                resultMsg.delete();
                            }
                            return;
                        }
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
                    if (error instanceof CustomError) throw error;
                    throw new CustomError("Time out", ErrorCode.TimeOut, "Manage Member General Role", error as Error);
                }
            } while (true);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Manage Member General Role", error as Error);
        }
    }
}