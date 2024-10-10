import { ButtonInteraction, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, ComponentType, EmbedBuilder, Interaction, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextChannel, TextInputBuilder, User } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import Project from "../base/NekoYuki/entities/Project";
import ViewProjectRequest from "../requests/ViewProjectRequest";
import { ActionRowBuilder, ButtonBuilder, SelectMenuBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder } from "@discordjs/builders";
import CreateChapterRequest from "../requests/CreateChapterRequest";
import Member from "../base/NekoYuki/entities/Member";
import Permission from "../base/NekoYuki/enums/Permission";
import ViewProjectChapterRequest from "../requests/ViewProjectChapterRequest";
import CustomClient from "../base/classes/CustomClient";
import ProjectUtils from "../utils/ProjectUtils";

export default class ViewProjectHandler implements IMediatorHandle<ViewProjectRequest> {
    name: string;
    ableToNavigate: boolean;

    constructor() {
        this.name = "ViewProject";
        this.ableToNavigate = true;
    }

    async handle(value: ViewProjectRequest): Promise<any> {
        try {
            const yukiMember = value.data.authorMember;
            if (!value.data.projectId)
                value.data.projectId = await ViewProjectHandler.chooseProject(value);
            if (!value.data.projectId) return;
            await ViewProjectHandler.viewProject(value.data.client, value.data.channel, value.data.author, yukiMember, value.data.projectId);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "View Project", error as Error);
        }
    }

    static async chooseProject(value: ViewProjectRequest): Promise<string | undefined> {
        try {
            const totalProjectsCnt = await value.data.client.dataSources.getRepository(Project).count();
            if (totalProjectsCnt == 0) {
                throw new CustomError("No project found", ErrorCode.BadRequest, "Choose Project");
            }
            const chooseProjectEmbed = new EmbedBuilder()
                .setTitle("Choose a project")
                .setTimestamp()
                .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                .setFooter({ text: "Powered by NekoYuki" })
                .setColor("Blue");
            let navigateLeftBtn = new ButtonBuilder()
                .setCustomId("navigateLeft")
                .setLabel("◀")
                .setStyle(ButtonStyle.Primary);
            let navigateRightBtn = new ButtonBuilder()
                .setCustomId("navigateRight")
                .setLabel("▶")
                .setStyle(ButtonStyle.Primary);
            let notifyBtn = new ButtonBuilder()
                .setCustomId("notifyBtn")
                .setDisabled(true)
                .setLabel("Choose a project")
                .setStyle(ButtonStyle.Primary);
            let actionRow = new ActionRowBuilder()
                .addComponents(navigateLeftBtn, notifyBtn, navigateRightBtn);

            let i = 0;
            let targetProjectId = "-1";
            while (true) {
                const projects = await value.data.client.dataSources.getRepository(Project).find({
                    skip: i,
                    take: 5
                });
                if (i == 0) navigateLeftBtn.setDisabled(true)
                else navigateLeftBtn.setDisabled(false);
                if (i == Math.floor(projects.length / 5) * 5 - 1) navigateRightBtn.setDisabled(true)
                else navigateRightBtn.setDisabled(false);
                let description = "";
                let projectOptions = [];
                for (let j = 0; j < 5; j++) {
                    if (projects[j] === undefined) break;
                    description += `- ***${projects[j].id}***. ${projects[j].name}\n`;
                    projectOptions.push(new StringSelectMenuOptionBuilder()
                        .setLabel(projects[j].id.toString())
                        .setValue(projects[j].id.toString())
                    );
                }
                chooseProjectEmbed.setDescription(description);

                let chooseProjectSelectMenu = new SelectMenuBuilder()
                    .setCustomId("chooseProject")
                    .setOptions(projectOptions);

                let chooseProjectActionRow = new ActionRowBuilder()
                    .addComponents(chooseProjectSelectMenu);
                //@ts-ignore
                const chooseProjectMsg = await value.data.channel.send({ embeds: [chooseProjectEmbed], components: [chooseProjectActionRow, actionRow] });
                try {
                    const interaction = await chooseProjectMsg.awaitMessageComponent({ filter: (interaction) => interaction.user.id === value.data.author.id, time: 60000 });
                    await chooseProjectMsg.delete();
                    if (interaction.isButton()) {
                        if (interaction.customId === "navigateLeft") {
                            i -= 5;
                            if (i < 0) {
                                i = 0;
                            }
                        } else if (interaction.customId === "navigateRight") {
                            i += 5;
                            if (i > totalProjectsCnt / 5) {
                                i = Math.floor(projects.length / 5) * 5;
                            }
                        }
                    } else if (interaction.isStringSelectMenu()) {
                        targetProjectId = interaction.values[0];
                        return targetProjectId;
                    }
                } catch (error) {
                    await chooseProjectMsg.delete();
                    return;
                }
            }
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Choose Project", error as Error);
        }
    }

    static async viewProject(client: CustomClient, currChannel: TextChannel, author: User, yukiMember: Member, projectId: string): Promise<boolean> {
        try {
            let loopFlag = false;
            do {
                /////////////// Step 01: Check if project exists ///////////////
                if (projectId === "-1") return false;
                if (!projectId) return false;
                let project = await client.dataSources.getRepository(Project)
                    .createQueryBuilder('project')
                    .where("project.id = :id", { id: projectId })
                    .leftJoinAndSelect('project.members', 'projectMember')
                    .leftJoinAndSelect('projectMember.role', 'role')
                    .leftJoinAndSelect('projectMember.member', 'member')
                    .leftJoin('project.chapters', 'chapter')
                    .loadRelationCountAndMap("project.chaptersCount", "project.chapters")
                    .getOne();

                if (!project) {
                    throw new CustomError("Project not found", ErrorCode.BadRequest, "View Project");
                }

                /////////////// Step 02: Build project description ///////////////
                let projectDescription = "***-----OWNER-----***\n";
                projectDescription += `**<@${project.ownerId}>\n**`;

                if (project.members.length == 0) projectDescription += "`[⚠WARNING] No member, request project owner or project manager to add more member`\n";
                if (project.verified) projectDescription += "`[✅] Status: ***Verified***`\n";
                else projectDescription += "`[⚠] Status: ***Not verified***`\n";
                projectDescription += `***------MEMBERS------***\n`;

                const memberRoles = [
                    { role: "Role name", memberId: "Member ID" }
                ];
                memberRoles.pop();
                project.members.forEach(m => {
                    const existingMemberIndex = memberRoles.findIndex((mr) => mr.memberId === m.member.discordId);
                    if (existingMemberIndex === -1) {
                        memberRoles.push({ role: m.role.Name, memberId: m.member.discordId });
                    } else {
                        memberRoles[existingMemberIndex].role += `, ${m.role.Name}`;
                    }
                });

                memberRoles.forEach(mr => {
                    projectDescription += `- <@${mr.memberId}> - ${mr.role}\n`;
                });


                /////////////// Step 03: Build project embed ///////////////
                const projectEmbed = new EmbedBuilder()
                    .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                    .setTitle(project.name)
                    .setDescription(projectDescription)
                    .addFields([
                        { name: "Status", value: project.status.toString(), inline: true },
                        { name: "Number of chapters", value: project.chaptersCount.toString(), inline: true },
                        { name: "Last updated", value: project.lastUpdated.toDateString(), inline: true },
                        { name: "Type", value: project.type.toString(), inline: true },
                    ]);

                /////////////// Step 04.01: Build project action row ///////////////
                console.log(yukiMember);

                let hasProjectPermission = false;
                let hasAdvancedProjectPermission = false;
                let hasVerifiedProjectPermission = false;
                if (yukiMember.discordId == project.ownerId) {
                    hasProjectPermission = true;
                    hasAdvancedProjectPermission = true;
                }
                if (yukiMember.hasPermission(Permission.ManageProject)) {
                    hasProjectPermission = true;
                    hasAdvancedProjectPermission = true;
                    hasVerifiedProjectPermission = true;
                }
                if (yukiMember.hasPermission(Permission.UpdateProject)) hasProjectPermission = true;
                if (project.members.find(m => m.member.discordId === yukiMember.discordId)) hasProjectPermission = true;

                /////////////// Step 04.2: Build project context row ///////////////
                /////////////// Because the limit of 5 buttons per row, we need to create select component///////////////
                const contextSelectMenu = new StringSelectMenuBuilder()
                    .setCustomId("contextSelect")
                    .setPlaceholder("Select an action");
                if (hasProjectPermission) {
                    contextSelectMenu.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Create chapter")
                            .setValue("createChapter"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Edit project")
                            .setValue("editProject"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Manage member")
                            .setValue("manageMember"),
                    );
                }
                if (hasAdvancedProjectPermission) {
                    contextSelectMenu.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Delete project")
                            .setValue("deleteProject"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Transfer project")
                            .setValue("transferProject"),
                    );
                }
                if (hasVerifiedProjectPermission) {
                    contextSelectMenu.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Verify project")
                            .setValue("verifyProject"),
                    );
                }
                contextSelectMenu.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel("View chapter")
                        .setValue("viewChapter"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Return")
                        .setValue("return"),
                );
                const contextSelectRow = new ActionRowBuilder()
                    .addComponents(contextSelectMenu);
                const contextRows = [];
                const createChapterBtn = new ButtonBuilder()
                    .setCustomId("createChapter")
                    .setLabel("Create chapter")
                    .setStyle(ButtonStyle.Success);
                const editProjectBtn = new ButtonBuilder()
                    .setCustomId("editProject")
                    .setLabel("Edit project")
                    .setStyle(ButtonStyle.Primary);
                const manageMemberBtn = new ButtonBuilder()
                    .setCustomId("manageMember")
                    .setLabel("Manage member")
                    .setStyle(ButtonStyle.Primary);
                const viewChapterBtn = new ButtonBuilder()
                    .setCustomId("viewChapter")
                    .setLabel("View chapter")
                    .setStyle(ButtonStyle.Primary);
                const deleteProjectBtn = new ButtonBuilder()
                    .setCustomId("deleteProject")
                    .setLabel("Delete project")
                    .setStyle(ButtonStyle.Danger);
                const transferProjectBtn = new ButtonBuilder()
                    .setCustomId("transferProject")
                    .setLabel("Transfer project")
                    .setStyle(ButtonStyle.Primary);
                const verifyProjectBtn = new ButtonBuilder()
                    .setCustomId("verifyProject")
                    .setLabel("Verify project")
                    .setStyle(ButtonStyle.Success);
                const returnBtn = new ButtonBuilder()
                    .setCustomId("return")
                    .setLabel("Return")
                    .setStyle(ButtonStyle.Secondary);
                const editRow = new ActionRowBuilder();

                if (hasProjectPermission) {
                    viewChapterBtn.setLabel("Manage chapters");
                    editRow.setComponents(createChapterBtn, viewChapterBtn, manageMemberBtn);
                } else {
                    viewChapterBtn.setLabel("View chapters");
                    editRow.setComponents(viewChapterBtn);
                }
                if (hasAdvancedProjectPermission) {
                    editRow.addComponents(deleteProjectBtn);
                }
                if (hasVerifiedProjectPermission) {
                    editRow.setComponents(verifyProjectBtn);
                }
                editRow.addComponents(returnBtn);
                contextRows.push(editRow, contextSelectRow);
                // @ts-ignore   
                const projectInfoMsg = await currChannel.send({ embeds: [projectEmbed], components: contextRows });

                /////////////// Step 05: Handle project interaction ///////////////
                let globalBtnInteraction = null;
                let globalSelectInteraction = null;
                try {
                    const projectInteraction = await projectInfoMsg.awaitMessageComponent({ filter: (interaction: Interaction) => interaction.user.id === author.id, time: 60000 });
                    await projectInfoMsg.delete();
                    if (projectInteraction.isButton()) {
                        globalBtnInteraction = projectInteraction;
                    }
                    if (projectInteraction.isStringSelectMenu()) {
                        globalSelectInteraction = projectInteraction;
                    }
                } catch (error) {
                    await projectInfoMsg.edit({ components: [] });
                    return false;
                }
                const globalBtnInteractionAfter = globalBtnInteraction as ButtonInteraction;
                const globalSelectInteractionAfter = globalSelectInteraction as StringSelectMenuInteraction;
                let commandId = "";
                if (globalSelectInteraction) {
                    commandId = globalSelectInteractionAfter.values[0];
                }
                if (globalBtnInteraction) {
                    commandId = globalBtnInteractionAfter.customId;
                }
                try {
                    switch (commandId) {
                        case "createChapter":
                            const createChapterRequest = new CreateChapterRequest(client, currChannel, author, yukiMember, project)
                            const createResult = await client.mediator.send(createChapterRequest);
                            if (createResult == true) loopFlag = true;
                            break;
                        case "viewChapter":
                            const viewProjectChapterRequest = new ViewProjectChapterRequest({ customClient: client, interaction: globalBtnInteractionAfter, project: project, author: yukiMember });
                            const viewResult = await client.mediator.send(viewProjectChapterRequest);
                            if (viewResult == true) loopFlag = true;
                            break;
                        case "editProject":
                            const editResult = await ProjectUtils.editProject(client, currChannel, project, author);
                            if (editResult == true) loopFlag = true;
                            break;
                        case "manageMember":
                            const manageMemberResult = await ProjectUtils.manageMember(client, currChannel, project, author);
                            if (manageMemberResult == true) loopFlag = true;
                            break;
                        case "deleteProject":
                            const deleteResult = await ProjectUtils.deleteProject(client, currChannel, project, author);
                            if (deleteResult == true) loopFlag = true;
                            break;
                        case "transferProject":
                            const transferResult = await ProjectUtils.transferProject(client, currChannel, project, author);
                            if (transferResult == true) loopFlag = true;
                            break;
                        case "verifyProject":
                            const verifyResult = await ProjectUtils.verifyProject(client, currChannel, project, author, yukiMember);
                            if (verifyResult == true) loopFlag = true;
                            break;
                        case "return":
                            return true;
                        default:
                            break;
                    }
                } catch (error) {
                    if (error instanceof CustomError) {
                        throw error;
                    }
                    throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "View Project", error as Error);
                }
            } while (loopFlag);
            return true;
        } catch (error) {
            console.log(error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "View Project", error as Error);
        }
    }
}
