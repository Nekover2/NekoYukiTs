import { ActionRowBuilder, ButtonStyle, EmbedBuilder, Interaction, Message, StringSelectMenuBuilder } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import GeneralRole from "../base/NekoYuki/entities/GeneralRole";
import GeneralRoleType from "../base/NekoYuki/enums/GeneralRoleType";
import Permission, { PermissionHelper } from "../base/NekoYuki/enums/Permission";
import ViewGeneralRoleRequest from "../requests/ViewGeneralRoleRequest";
import { ButtonBuilder } from "@discordjs/builders";
import CreateGeneralRoleRequest from "../requests/CreateGeneralRoleRequest";
import ProjectMember from "../base/NekoYuki/entities/ProjectMember";

export default class ViewGeneralRoleHandler implements IMediatorHandle<ViewGeneralRoleRequest> {
    name: string = "ViewGeneralRole";
    ableToNavigate: boolean = false;

    async checkPermissions(value: ViewGeneralRoleRequest): Promise<boolean> {
        try {
            let flag = false;
            if (value.data.authorMember.hasPermission(Permission.ManagePermission)) flag = true;
            if (value.data.author.id == value.data.channel.guild.ownerId) flag = true;
            if (flag == false) throw new CustomError("You do not have permission to view general role", ErrorCode.Unauthorized, "View General Role");
            return true;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            else throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "View General Role", error as Error);
        }
    }
    async handle(value: ViewGeneralRoleRequest): Promise<boolean> {
        try {
            let loopFlag = false;
            do {
                const allRoleCount = await value.data.client.dataSources.getRepository(GeneralRole).count();
                const projectRoleCount = await value.data.client.dataSources.getRepository(GeneralRole).count({ where: { Type: GeneralRoleType.Project } });

                const infoEmbed = new EmbedBuilder()
                    .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                    .setTitle("General Role Information")
                    .setDescription(`This is dashboard for managing general roles. There are currently have two types of roles: \n` +
                        `- 1. **Project Role** - Use for determine member's role in a project\n` +
                        `- 2. **General Role** - Use for determine member's role in the team\n` +
                        `Please choose an action to continue...`)
                    .addFields([
                        { name: "Total General Role", value: `${allRoleCount}`, inline: true },
                        { name: "Total Project Role", value: `${projectRoleCount}`, inline: true }
                    ])
                    .setColor("Blue")
                    .setFooter({ text: "NekoYuki's manager" })
                    .setThumbnail(value.data.channel.guild.iconURL())
                    .setTimestamp();
                const createRoleBtn = new ButtonBuilder()
                    .setCustomId("createRole")
                    .setLabel("Create Role")
                    .setStyle(ButtonStyle.Success);
                const generalRoleBtn = new ButtonBuilder()
                    .setCustomId("generalRole")
                    .setLabel("General Role")
                    .setStyle(ButtonStyle.Primary);
                const projectRoleBtn = new ButtonBuilder()
                    .setCustomId("projectRole")
                    .setLabel("Project Role")
                    .setStyle(ButtonStyle.Secondary);
                const cancelBtn = new ButtonBuilder()
                    .setCustomId("cancel")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Danger);
                const actionRow = new ActionRowBuilder()
                    .addComponents([createRoleBtn, generalRoleBtn, projectRoleBtn, cancelBtn]);
                // @ts-ignore
                const message = await value.data.channel.send({ embeds: [infoEmbed], components: [actionRow] });
                let choosenId = "-1";
                try {
                    const filter = (interaction: Interaction) => interaction.user.id === value.data.author.id;
                    const interaction = await message.awaitMessageComponent({ filter, time: 30000 });
                    message.delete();
                    choosenId = interaction.customId;
                } catch (error) {
                    message.edit({ components: [] });
                    return false;
                }

                switch (choosenId) {
                    case "createRole":
                        const createRoleRequest = new CreateGeneralRoleRequest({ customClient: value.data.client, channel: value.data.channel, author: value.data.author, authorMember: value.data.authorMember });
                        const createRoleRes = await value.data.client.mediator.send(createRoleRequest);
                        if (createRoleRes == true) loopFlag = true;
                        break;
                    case "generalRole":
                        loopFlag = await this.viewRoles(value, GeneralRoleType.General);
                        break;
                    case "projectRole":
                        loopFlag = await this.viewRoles(value, GeneralRoleType.Project);
                        break;
                    case "cancel":
                        return true;
                    default:
                        return false;

                }
            } while (loopFlag);
            return false;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            else throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "View General Role", error as Error);
        }
    }

    async viewRoles(value: ViewGeneralRoleRequest, type: GeneralRoleType): Promise<boolean> {
        try {
            let loopFlag = false;
            const createRoleBtn = new ButtonBuilder()
                .setCustomId("createRole")
                .setLabel("Create Role")
                .setStyle(ButtonStyle.Success);
            const returnBtn = new ButtonBuilder()
                .setCustomId("return")
                .setLabel("Return")
                .setStyle(ButtonStyle.Danger);
            const actionRow = new ActionRowBuilder()
                .addComponents([createRoleBtn, returnBtn]);

            const nextBtn = new ButtonBuilder()
                .setCustomId("next")
                .setLabel("Next")
                .setStyle(ButtonStyle.Primary);
            const prevBtn = new ButtonBuilder()
                .setCustomId("prev")
                .setLabel("Previous")
                .setStyle(ButtonStyle.Primary);
            do {
                const rolesLength = await value.data.client.dataSources.getRepository(GeneralRole).count({ where: { Type: type } });
                let infoMessage: Message;
                if (rolesLength == 0) {
                    const noRoleEmbed = new EmbedBuilder()
                        .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                        .setTitle("General Role Information")
                        .setDescription(`There are currently no ${type == GeneralRoleType.General ? "General" : "Project"} role in the database`)
                        .setColor("Random")
                        .setFooter({ text: "NekoYuki's manager" })
                        .setTimestamp();
                    // @ts-ignore
                    infoMessage = await value.data.channel.send({ embeds: [noRoleEmbed], components: [actionRow] });

                    try {
                        const filter = (interaction: Interaction) => interaction.user.id === value.data.author.id;
                        const interaction = await infoMessage.awaitMessageComponent({ filter, time: 30000 });
                        infoMessage.delete();
                        if (interaction.customId == "return") return true;
                    } catch (error) {
                        infoMessage.edit({ components: [] });
                        return false;
                    }
                    
                    const createRoleRequest = new CreateGeneralRoleRequest({ customClient: value.data.client, channel: value.data.channel, author: value.data.author, authorMember: value.data.authorMember });
                    const createRoleRes = await value.data.client.mediator.send(createRoleRequest);
                    if (createRoleRes == true) {
                        loopFlag = true;
                        continue;
                    }
                } else {
                    let i = 0;
                    while (true) {
                        let roleString = "";
                        const roles = await value.data.client.dataSources.getRepository(GeneralRole).find({ where: { Type: type }, skip: i, take: 5 });
                        if (roles.length == 0) break;
                        for (let role of roles) {
                            roleString += `- ${role.Name} | Permissions: ${PermissionHelper.getPermissionString(role.getPermissions())}\n`;
                        }
                        const roleEmbed = new EmbedBuilder()
                            .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                            .setTitle(`General Role Information`)
                            .setDescription(`List of ${type == GeneralRoleType.General ? "General" : "Project"} role in the database.\n` +
                                `Showing ${i * 5} to ${i * 5 + roles.length} of ${rolesLength}\n` +
                                `${roleString}`)
                            .setColor("Blue")
                            .setFooter({ text: `Page ${i+1} of ${ Math.ceil(rolesLength/5) }` })
                            .setTimestamp();
                        const infoBtn = new ButtonBuilder()
                            .setCustomId("info")
                            .setLabel(`Page ${i + 1}`)
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true);
                        if (i == 0) prevBtn.setDisabled(true);
                        else prevBtn.setDisabled(false);
                        if (i * 5 + roles.length >= rolesLength) nextBtn.setDisabled(true);
                        else nextBtn.setDisabled(false);
                        const infoRow = new ActionRowBuilder()
                            .addComponents([prevBtn, infoBtn, nextBtn, returnBtn]);

                        const rowSelectMenu = new StringSelectMenuBuilder()
                            .setCustomId("roleSelect")
                            .setPlaceholder("Select a role to edit or delete")
                            .setOptions(roles.map((role) => {
                                return {
                                    label: role.Name,
                                    value: role.Id.toString()
                                }
                            }));
                        const roleSelectRow = new ActionRowBuilder()
                            .addComponents([rowSelectMenu]);
                        // @ts-ignore
                        const message = await value.data.channel.send({ embeds: [roleEmbed], components: [roleSelectRow, infoRow] });
                        let selectedRoleId = "-1";
                        try {
                            const filter = (interaction: Interaction) => interaction.user.id === value.data.author.id;
                            const interaction = await message.awaitMessageComponent({ filter, time: 30000 });
                            message.delete();
                            if (interaction.isButton()) {
                                switch (interaction.customId) {
                                    case "prev":
                                        i -= 1;
                                        if (i < 0) i = 0;
                                        break;
                                    case "next":
                                        i += 1;
                                        if (i * 5 >= rolesLength) i -= 1;
                                        break;
                                    case "return":
                                        return true;
                                    default:
                                        return false;
                                        break;
                                }
                            }
                            if (interaction.isStringSelectMenu()) {
                                selectedRoleId = interaction.values[0];
                            }
                        } catch (error) {
                            message.edit({ components: [] });
                            return false;
                        }

                        if (selectedRoleId != "-1") {
                            const role = await value.data.client.dataSources.getRepository(GeneralRole).findOne({ where: { Id: parseInt(selectedRoleId) } });
                            if (role == undefined) return false;
                            const roleEmbed = new EmbedBuilder()
                                .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                                .setTitle(`General Role Information`)
                                .setDescription(`Information of ${role.Name} role`)
                                .addFields([
                                    { name: "Name", value: role.Name, inline: true },
                                    { name: "Type", value: role.Type, inline: true },
                                    { name: "Permissions", value: PermissionHelper.getPermissionString(role.getPermissions()) },

                                ])
                                .setColor("Blue")
                                .setFooter({ text: "NekoYuki's manager" })
                                .setTimestamp();

                            const editPermissionBtn = new ButtonBuilder()
                                .setCustomId("editPermission")
                                .setLabel("Edit Permission")
                                .setStyle(ButtonStyle.Primary);
                            const deleteRoleBtn = new ButtonBuilder()
                                .setCustomId("deleteRole")
                                .setLabel("Delete Role")
                                .setStyle(ButtonStyle.Danger);
                            const roleActionRow = new ActionRowBuilder()
                                .addComponents([editPermissionBtn, deleteRoleBtn, returnBtn]);
                            // @ts-ignore
                            const roleViewMsg = await value.data.channel.send({ embeds: [roleEmbed], components: [roleActionRow] });
                            let choosenBtnId = "-1";
                            try {
                                const filter = (interaction: Interaction) => interaction.user.id === value.data.author.id;
                                const interaction = await roleViewMsg.awaitMessageComponent({ filter, time: 30000 });
                                roleViewMsg.delete();
                                choosenBtnId = interaction.customId;
                            } catch (error) {
                                roleViewMsg.edit({ components: [] });
                                return false;
                            }
                            switch (choosenBtnId) {
                                case "editPermission":
                                    loopFlag = await this.editRolePermission(value, role);
                                    break;
                                case "deleteRole":
                                    loopFlag = await this.deleteRole(value, role);
                                    break;
                                case "return":
                                    loopFlag = true;
                                    break;
                                default:
                                    return false;
                            }
                        }
                    }
                }

            } while (loopFlag);
            return false;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            else throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "View General Role", error as Error);
        }
    }

    async editRolePermission(value: ViewGeneralRoleRequest, newRole: GeneralRole): Promise<boolean> {
        try {
            do {
                const currentPermissionString = newRole.getPermissionString();
                const permissionLabel = Object.keys(Permission).filter((p) => isNaN(Number(p)));
                const permissionValue = Object.values(Permission).filter((p) => !isNaN(Number(p)));
                const permissionSelect = new StringSelectMenuBuilder()
                    .setCustomId("permissionSelect")
                    .setPlaceholder("Select a permission")
                    .addOptions(permissionLabel.map((label, index) => {
                        return {
                            label: label,
                            value: permissionValue[index].toString(),
                        }
                    }));
                const permissionSelectRow = new ActionRowBuilder().addComponents(permissionSelect);
                const permissionDashboardEmbed = new EmbedBuilder()
                    .setAuthor({ name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL() })
                    .setTitle("Next: Manage Role Permission")
                    .setDescription("Select a permission to add or remove.\n" +
                        "- If you pick an existing permission, it will be removed\n" +
                        "- If you pick a non-existing permission, it will be added.\n"
                        + "`When you finish, click the confirm button to proceed.`")
                    .setColor("Blue")
                    .setTimestamp()
                    .addFields({ name: "Current permissions", value: currentPermissionString });

                const acceptButton = new ButtonBuilder()
                    .setCustomId("accept")
                    .setLabel("Confirm")
                    .setStyle(ButtonStyle.Success);
                const declineButton = new ButtonBuilder()
                    .setCustomId("decline")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Danger);
                const btnRow = new ActionRowBuilder().addComponents(acceptButton, declineButton);

                // @ts-ignore
                const permissionDashboardMessage = await value.data.channel.send({ embeds: [permissionDashboardEmbed], components: [permissionSelectRow, btnRow] });
                try {
                    const filter = (interaction: Interaction) => interaction.user.id === value.data.author.id;
                    const interactionPermissionInteraction = await permissionDashboardMessage.awaitMessageComponent({ filter: filter, time: 60000 });
                    permissionDashboardMessage.delete();
                    if (interactionPermissionInteraction.customId === "accept") {
                        await value.data.client.dataSources.getRepository(GeneralRole).save(newRole);
                        const successEmbed = new EmbedBuilder()
                            .setAuthor({ name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL() })
                            .setTitle("Role Permission Updated")
                            .setDescription("Role permission has been updated successfully")
                            .setColor("Green")
                            .setTimestamp();
                        // @ts-ignore
                        let sucessMsg = await value.data.channel.send({ embeds: [successEmbed] });
                        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
                        await delay(5000);
                        sucessMsg.delete();
                        return true;
                    }
                    if (interactionPermissionInteraction.customId === "decline") {
                        return true;
                    }
                    if (interactionPermissionInteraction.isStringSelectMenu()) {
                        const selectedPermission = interactionPermissionInteraction.values[0];
                        const permission = parseInt(selectedPermission);
                        if (newRole.hasPermission(permission)) {
                            await interactionPermissionInteraction.reply({ content: `Permission will be removed: ${PermissionHelper.getPermissionLabel(permission)}`, ephemeral: true });
                            newRole.removePermission(permission);
                        } else {
                            await interactionPermissionInteraction.reply({ content: `Permission will be added: ${PermissionHelper.getPermissionLabel(permission)}`, ephemeral: true });
                            newRole.addPermission(permission);
                        }
                    }
                } catch (error) {
                    permissionDashboardMessage.edit({ components: [] });
                }
            } while (true);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            else throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "View General Role", error as Error);
        }
    }

    async deleteRole(value: ViewGeneralRoleRequest, role: GeneralRole): Promise<boolean> {
        try {
            const roleEmbed = new EmbedBuilder()
                .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                .setTitle(`Confirm Delete Role`)
                .setDescription(`Are you sure you want to delete ${role.Name} role? All member with this role will be affected`)
                .setColor("Red")
                .setFooter({ text: "NekoYuki's manager" })
                .setTimestamp();
            const acceptBtn = new ButtonBuilder()
                .setCustomId("accept")
                .setLabel("Accept")
                .setStyle(ButtonStyle.Success);
            const declineBtn = new ButtonBuilder()
                .setCustomId("decline")
                .setLabel("Decline")
                .setStyle(ButtonStyle.Danger);
            const actionRow = new ActionRowBuilder()
                .addComponents([acceptBtn, declineBtn]);
            // @ts-ignore
            const message = await value.data.channel.send({ embeds: [roleEmbed], components: [actionRow] });
            try {
                const filter = (interaction: Interaction) => interaction.user.id === value.data.author.id;
                const interaction = await message.awaitMessageComponent({ filter, time: 30000 });
                message.delete();
                if (interaction.customId === "accept") {
                    const affectedProjectMember = await value.data.client.dataSources.getRepository(ProjectMember).find({
                        where: { role: role, isOwner: true },
                        relations: ["member", "project"]
                    });
                    if (affectedProjectMember.length > 0) {
                        //pick first 5 affected member
                        let affectedMemberString = "";
                        for (let i = 0; i < affectedProjectMember.length; i++) {
                            if (i > 5) break;
                            affectedMemberString += `- Project ${affectedProjectMember[i].project.name} | Owner: <@${affectedProjectMember[i].member.discordId}\n`;
                        }
                        const errorEmbed = new EmbedBuilder()
                            .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                            .setTitle("Role Deletion Failed")
                            .setDescription(`Role ${role.Name} cannot be deleted because it is used in a owner of a project. Considering deleting those project or let the owner change their positions\n` +
                                `Affected member:\n${affectedMemberString}`)
                            .setColor("Red")
                            .setFooter({ text: "NekoYuki's manager" })
                            .setTimestamp();
                        // @ts-ignore
                        const errorMsg = await value.data.channel.send({ embeds: [errorEmbed] });
                        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
                        await delay(5000);
                        errorMsg.delete();
                        return true;
                    }
                    await value.data.client.dataSources.getRepository(GeneralRole).delete({ Id: role.Id });
                    const successEmbed = new EmbedBuilder()
                        .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                        .setTitle("Role Deleted")
                        .setDescription(`Role ${role.Name} has been deleted successfully`)
                        .setColor("Green")
                        .setFooter({ text: "NekoYuki's manager" })
                        .setTimestamp();
                    // @ts-ignore
                    const successMsg = await value.data.channel.send({ embeds: [successEmbed] });
                    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
                    await delay(5000);
                    successMsg.delete();
                    return true;
                }
                if (interaction.customId === "decline") {
                    return true;
                }
            } catch (error) {
                message.edit({ components: [] });
                return false;
            }
            return false;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            else throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "View General Role", error as Error);
        }
    }
}