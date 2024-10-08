import { ButtonInteraction, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, ComponentType, EmbedBuilder, Interaction, ModalBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextChannel, TextInputBuilder, TextInputStyle, User } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import Project from "../base/NekoYuki/entities/Project";
import { ActionRowBuilder, ButtonBuilder, SelectMenuBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder } from "@discordjs/builders";
import Member from "../base/NekoYuki/entities/Member";
import CustomClient from "../base/classes/CustomClient";
import { ProjectTypeHelper } from "../base/NekoYuki/enums/ProjectType";
import GuildConfig from "../commands/NekoYuki/GuildConfig";
import GeneralRole from "../base/NekoYuki/entities/GeneralRole";
import GeneralRoleType from "../base/NekoYuki/enums/GeneralRoleType";
import ProjectMember from "../base/NekoYuki/entities/ProjectMember";
export default class ProjectUtils {
    public static async setRootChannel(client: CustomClient, project: Project, channel: TextChannel, author: User, guildConfig?: GuildConfig) {
        try {
            const infoEmbed = new EmbedBuilder()
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setTitle("Next step: Choose a root channel you created for your new project")
                .setDescription("Please choose a post in the channel you want to set as the root channel for your project")
                .setColor("Aqua")
                .setTimestamp()
                .setFooter({ text: "Powered by NekoYuki" });
            const rootChannelSelectMenu = new ChannelSelectMenuBuilder()
                .setCustomId("rootChannel")
                .setPlaceholder("Choose a root channel")
                .setMaxValues(1);

            const rootChannelActionRow = new ActionRowBuilder()
                .addComponents(rootChannelSelectMenu);

            //@ts-ignore
            const rootChannelMsg = await channel.send({ embeds: [infoEmbed], components: [rootChannelActionRow] });

            try {
                const filter = (interaction: Interaction) => interaction.user.id === author.id;
                const rootChannelInteraction = await rootChannelMsg.awaitMessageComponent({ filter, time: 60000, componentType: ComponentType.ChannelSelect });
                rootChannelMsg.delete();
                const rootChannel = rootChannelInteraction.channels.at(0);
                if (!rootChannel) return false;
                const selectInfoEmbed = new EmbedBuilder()
                    .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                    .setTitle("Root channel selected")
                    .setDescription(`Root channel has been selected: <#${rootChannel.id}>`)
                    .setColor("Green")
                    .setTimestamp()
                    .setFooter({ text: "Powered by NekoYuki" });
                const selectInfoMsg = await rootChannelInteraction.reply({ embeds: [selectInfoEmbed], ephemeral: true });
                const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
                await delay(3000);
                selectInfoMsg.delete();
                project.postChannelId = rootChannel.id;
            } catch (error) {
                rootChannelMsg.edit({ components: [] });
                return false;
            }
            return project;
        }
        catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Set Root Channel", error as Error);
        }
    }

    public static async getProjectType(client: CustomClient, channel: TextChannel, project: Project, author: User) {
        try {
            const infoEmbed = new EmbedBuilder()
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setTitle(`First step: Choose project type`)
                .setDescription("Please choose a project type to continue, it will help us to determine the project and its chapters' properties")
                .setColor("Aqua")
                .setTimestamp()
                .setFooter({ text: "Powered by NekoYuki" });

            const projectTypeLabels = ProjectTypeHelper.getProjectTypeLabels();
            const projectTypeValues = ProjectTypeHelper.getProjectTypeValues();
            const projectTypeSelectMenu = new StringSelectMenuBuilder()
                .setCustomId("projectType")
                .setMaxValues(1)
                .setMinValues(1)
                .setPlaceholder("--- Choose a project type ---")
                .setOptions(
                    projectTypeLabels.map((label, index) => new StringSelectMenuOptionBuilder()
                        .setLabel(label)
                        .setValue(projectTypeValues[index])
                    )
                );

            const projectTypeActionRow = new ActionRowBuilder()
                .addComponents(projectTypeSelectMenu);

            //@ts-ignore
            const projectTypeMsg = await channel.send({ embeds: [infoEmbed], components: [projectTypeActionRow] });

            try {
                const filter = (interaction: Interaction) => interaction.user.id === author.id;
                const projectTypeInteraction = await projectTypeMsg.awaitMessageComponent({ filter, time: 60000, componentType: ComponentType.StringSelect });
                projectTypeMsg.delete();
                project.type = ProjectTypeHelper.getProjectTypeValue(projectTypeInteraction.values[0]);
                return project;
            } catch (error) {
                projectTypeMsg.edit({ components: [] });
                return false;
            }
            return project;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Get Project Type", error as Error);
        }
    }

    public static async deleteProject(client: CustomClient, channel: TextChannel, project: Project, author: User) {
        try {
            const warningMessage = new EmbedBuilder()
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setTitle("Warning")
                .setDescription("Are you sure you want to delete this project? All its related data will be lost. This action is ***irreversible***")
                .setColor("Red")
                .setTimestamp()
                .setFields([
                    { name: "Project name", value: project.name },
                    { name: "Project ID", value: project.id.toString() },
                    { name: "Project type", value: ProjectTypeHelper.getProjectTypeLabel(project.type) },
                    { name: "Project status", value: project.status.toString() },
                    { name: "Owner", value: `<@${project.ownerId}>` },
                    { name: "Last updated", value: project.lastUpdated.toDateString() },
                ])
                .setFooter({ text: "Powered by NekoYuki" });
            const acceptBtn = new ButtonBuilder()
                .setCustomId("deleteBtn")
                .setLabel("Delete")
                .setStyle(ButtonStyle.Danger);
            const cancelBtn = new ButtonBuilder()
                .setCustomId("cancelBtn")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Secondary);

            const actionRow = new ActionRowBuilder()
                .addComponents(acceptBtn, cancelBtn);

            //@ts-ignore
            const warningMsg = await channel.send({ embeds: [warningMessage], components: [actionRow] });

            const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
            try {
                const filter = (interaction: Interaction) => interaction.user.id === author.id;
                const interaction = await warningMsg.awaitMessageComponent({ filter, time: 60000, componentType: ComponentType.Button });
                warningMsg.delete();
                if (interaction.customId === "cancelBtn") {
                    const cancelEmbed = new EmbedBuilder()
                        .setTitle("Cancelled")
                        .setDescription("The deletion has been cancelled")
                        .setColor("Green")
                        .setTimestamp()
                        .setFooter({ text: "Powered by NekoYuki" });
                    const cancelMsg = await channel.send({ embeds: [cancelEmbed] });
                    await delay(3000);
                    cancelMsg.delete();
                    return true;
                }
            } catch (error) {
                const cancelEmbed = new EmbedBuilder()
                    .setTitle("Cancelled")
                    .setDescription("The deletion has been cancelled")
                    .setColor("Green")
                    .setTimestamp()
                    .setFooter({ text: "Powered by NekoYuki" });
                const cancelMsg = await channel.send({ embeds: [cancelEmbed] });
                await delay(3000);
                cancelMsg.delete();
                return false;
            }

            const progressEmbed = new EmbedBuilder()
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setTitle("Executing")
                .setDescription(`Deleting project: ${project.name}`)
                .setColor("Yellow")
                .setTimestamp()
                .setFooter({ text: "Powered by NekoYuki" });
            const progressMsg = await channel.send({ embeds: [progressEmbed] });
            await delay(3000);
            // Start deleting project
            try {
                await client.dataSources.getRepository(Project).delete({
                    id: project.id
                });

            } catch (error) {
                progressEmbed.setTitle("Failed");
                progressEmbed.setDescription(`Failed to delete project ${project.name} due to unknown error happened in database`);
                progressEmbed.setColor("Red");
                await progressMsg.edit({ embeds: [progressEmbed] });
                await delay(3000);
                progressMsg.delete();
            }
            progressEmbed.setTitle("Success");
            progressEmbed.setDescription(`Project ${project.name} has been deleted successfully`);
            progressEmbed.setColor("Green");
            await progressMsg.edit({ embeds: [progressEmbed] });
            await delay(3000);
            progressMsg.delete();
            return project;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Delete Project", error as Error);
        }
    }

    public static async manageMember(client: CustomClient, channel: TextChannel, project: Project, author: User) : Promise<boolean> {
        try {
            if (project.members) {
                const tmpProject = await client.dataSources.getRepository(Project).findOne({
                    where: { id: project.id },
                    relations: ["members", "members.role", "members.member"]
                })
                if (tmpProject) {
                    project = tmpProject;
                }
            }
            const addMemberBtn = new ButtonBuilder()
                .setCustomId("addMember")
                .setLabel("Add member")
                .setStyle(ButtonStyle.Success);
            const cancelBtn = new ButtonBuilder()
                .setCustomId("cancelBtn")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Secondary);
            const infoBtn = new ButtonBuilder()
                .setCustomId("infoBtn")
                .setLabel("Choose a member to manage or remove")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true);

            const btnRow = new ActionRowBuilder()
                .addComponents(addMemberBtn, infoBtn, cancelBtn);

            const infoMessage = new EmbedBuilder()
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setTitle("Manage member")
                .setDescription("Choose a member from below select to manage or remove, or you can add a new member using `Add member` button below.")
                .setColor("Aqua")
                .setTimestamp()
                .setFooter({ text: "Powered by NekoYuki" });

            const contextComponents = [];
            if (project.members.length == 0) {
                infoMessage.setDescription("No member found, please add a new member using `Add member` button below.");
                infoBtn.setDisabled(true);
                contextComponents.push(btnRow);
            } else {
                const memberSelectListTmp = project.members.map((m) => {
                    const discordMember = channel.guild.members.cache.get(m.member.discordId);
                    if (!discordMember) return;
                    return new StringSelectMenuOptionBuilder()
                        .setLabel(discordMember.displayName)
                        .setValue(m.member.discordId);
                });
                const memberSelectList = memberSelectListTmp.filter((m) => m !== undefined);
                const memberSelectMenu = new StringSelectMenuBuilder()
                    .setCustomId("memberSelect")
                    .setPlaceholder("Select a member")
                    .addOptions(memberSelectList);
                const memberSelectRow = new ActionRowBuilder()
                    .addComponents(memberSelectMenu);

                contextComponents.push(memberSelectRow);
                contextComponents.push(btnRow);
            }

            //@ts-ignore
            const infoMsg = await channel.send({ embeds: [infoMessage], components: contextComponents });

            const selectedMemberId = "-1";
            try {
                const filter = (interaction: Interaction) => interaction.user.id === author.id;
                const interaction = await infoMsg.awaitMessageComponent({ filter, time: 60000 });
                infoMsg.delete();
                if (interaction.isButton()) {
                    if (interaction.customId == "cancelBtn")
                        return true;
                    if (interaction.customId == "addMember")
                        await ProjectUtils.addMemberToProject(client, channel, project, author);
                        return true;
                }
            } catch (error) {
                await infoMsg.edit({ components: [] });
                return false;
            }
            return true;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Manage Member", error as Error);
        }
    }

    public static async addMemberToProject(client: CustomClient, channel: TextChannel, project: Project, author: User) {
        try {
            const infoEmbed = new EmbedBuilder()
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setColor("Aqua")
                .setTimestamp()
                .setFooter({ text: "Powered by NekoYuki" })
                .setTitle("Step 1/2: Choose member")
                .setDescription("Please choose a member to add to the project");
            const memberSelectMenu = new UserSelectMenuBuilder()
                .setCustomId("memberSelect")
                .setPlaceholder("Select a member")
                .setMaxValues(1);
            const memberSelectActionRow = new ActionRowBuilder()
                .addComponents(memberSelectMenu);

            const cancelBtn = new ButtonBuilder()
                .setCustomId("cancelBtn")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Secondary);
            const actionRow = new ActionRowBuilder()
                .addComponents(cancelBtn);
            //@ts-ignore
            const memberSelectMsg = await channel.send({ embeds: [infoEmbed], components: [memberSelectActionRow, actionRow] });
            let selectedUser = author;
            try {
                const filter = (interaction: Interaction) => interaction.user.id === author.id;
                const memberSelectInteraction = await memberSelectMsg.awaitMessageComponent({ filter, time: 60000 });
                memberSelectMsg.delete();
                if (memberSelectInteraction.isButton()) {
                    if (memberSelectInteraction.customId === "cancelBtn") {
                        return true;
                    }
                }
                if (memberSelectInteraction.isUserSelectMenu()) {
                    const selectingUser = memberSelectInteraction.users?.first();
                    if (selectingUser) {
                        selectedUser = selectingUser;
                    }
                }

            } catch (error) {
                memberSelectMsg.edit({ components: [] });
                return false;
            }

            // Check if user is registered
            const member = await client.dataSources.getRepository(Member).findOne({
                where: { discordId: selectedUser.id }
            });
            if (!member) {
                throw new CustomError("User not found, please register the user first", ErrorCode.BadRequest, "Add Member");
            }

            // Check if user is already in the project
            const existingMember = project.members.find(m => m.member.discordId === member.discordId);
            if (existingMember) {
                throw new CustomError("User is already in the project", ErrorCode.BadRequest, "Add Member");
            }
            const allRoles = await client.dataSources.getRepository(GeneralRole).find(
                {
                    where: { Type: GeneralRoleType.Project }
                }
            );
            if (allRoles.length == 0) {
                throw new CustomError("No role found, please add a project role first.", ErrorCode.BadRequest, "Add Member");
            }

            const roleSelectMenu = new StringSelectMenuBuilder()
                .setCustomId("roleSelect")
                .setPlaceholder("Select a role")
                .setMaxValues(1)
                .setMinValues(1)
                .setOptions(
                    allRoles.map((role) => new StringSelectMenuOptionBuilder()
                        .setLabel(role.Name)
                        .setValue(role.Id.toString())
                    )
                );
            const roleSelectActionRow = new ActionRowBuilder()
                .addComponents(roleSelectMenu);

            
            const chooseRoleEmbed = new EmbedBuilder()
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setColor("Aqua")
                .setTimestamp()
                .setFooter({ text: "Powered by NekoYuki" })
                .setTitle("Step 2/2: Choose role")
                .setDescription("Please choose a role for the member");
            
            //@ts-ignore
            const roleSelectMsg = await channel.send({ embeds: [chooseRoleEmbed], components: [roleSelectActionRow, actionRow] });
            let selectedRoleId = "-1";
            try {
                const filter = (interaction: Interaction) => interaction.user.id === author.id;
                const roleSelectInteraction = await roleSelectMsg.awaitMessageComponent({ filter, time: 60000 });
                roleSelectMsg.delete();
                if (roleSelectInteraction.isButton()) {
                    if (roleSelectInteraction.customId === "cancelBtn") {
                        return true;
                    }
                }
                if (roleSelectInteraction.isStringSelectMenu()) {
                    selectedRoleId = roleSelectInteraction.values[0];
                }
            } catch (error) {
                roleSelectMsg.edit({ components: [] });
                return false;
            }

            if (selectedRoleId === "-1") return false;
            const newProjectMember = new ProjectMember();
            newProjectMember.member = member;
            const currRole = allRoles.find(r => r.Id.toString() === selectedRoleId);
            if (!currRole) {
                throw new CustomError("Role not found", ErrorCode.BadRequest, "Add Member");
            }
            newProjectMember.role = currRole;
            newProjectMember.project = project;
            
            const statusEmbed = new EmbedBuilder()
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setColor("Blue")
                .setTimestamp()
                .setFooter({ text: "Powered by NekoYuki" })
                .setTitle("Please wait when we are working on it")
                .setDescription(`Adding <@${selectedUser.id}> to the project ${project.name} with role ${currRole.Name}\n This may take 5-6 seconds, please wait...`);
            const statusMsg = await channel.send({ embeds: [statusEmbed] });

            await client.dataSources.getRepository(ProjectMember).save(newProjectMember);
            const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
            await delay(3000);

            statusEmbed.setTitle("Success");
            statusEmbed.setColor("Green");
            statusEmbed.setDescription(`Successfully added <@${selectedUser.id}> to the project ${project.name} with role ${currRole.Name}`);
            await statusMsg.edit({ embeds: [statusEmbed] });
            await delay(3000);
            statusMsg.delete();
            return true;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Add Member", error as Error);
        }
    }

    public static async getProjectStringProps(client: CustomClient, btnInteraction : ButtonInteraction, project: Project, author: User) {
        try {
            const getInfoModal = new ModalBuilder()
                .setTitle("Project information...")
                .setCustomId("getInfoModal");

            const nameInput = new TextInputBuilder()
                .setCustomId("nameInput")
                .setPlaceholder(project.name == "" ? project.name : "Project name")
                .setStyle(TextInputStyle.Short)
                .setLabel("Project name");
            const linkInput = new TextInputBuilder()
                .setCustomId("linkInput")
                .setPlaceholder(project.link == "" ? project.link : "Project link")
                .setStyle(TextInputStyle.Short)
                .setLabel("Project link");
            
            if(project.name == "") nameInput.setRequired(true);
            if(project.link == "") linkInput.setRequired(true);

            const nameInputActionRow = new ActionRowBuilder()
                .addComponents(nameInput);
            const linkInputActionRow = new ActionRowBuilder()
                .addComponents(linkInput);

            //@ts-ignore
            getInfoModal.addComponents(nameInputActionRow, linkInputActionRow);

            const infoMsg = await btnInteraction.showModal(getInfoModal);
            const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

            try {
                const filter = (interaction: Interaction) => interaction.user.id === author.id;
                const interaction = await btnInteraction.awaitModalSubmit({ filter, time: 60000 });
                await interaction.reply("Received your input, please wait...");
                await delay(3000);
                interaction.deleteReply();
                const nameInputRes = interaction.fields.getTextInputValue("nameInput");
                const linkInputRes = interaction.fields.getTextInputValue("linkInput");

                if(nameInputRes) project.name = nameInputRes;
                if(linkInputRes) project.link = linkInputRes;
                return project;
            } catch (error) {
                throw new CustomError("An ***unknown*** error occurred while receiving info from project modal.", ErrorCode.InternalServerError, "Get Project Info", error as Error);
            }
            return true;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Get Project Info", error as Error);
        }
    }

    public static async editProject(client: CustomClient, channel: TextChannel, project: Project, author: User) : Promise<boolean> {
        return true;
    }
}