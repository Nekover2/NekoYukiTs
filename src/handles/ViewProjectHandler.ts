import { ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder, Interaction, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextChannel, TextInputBuilder, User } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import Project from "../base/NekoYuki/entities/Project";
import ViewProjectRequest from "../requests/ViewProjectRequest";
import { ActionRowBuilder, ButtonBuilder, SelectMenuBuilder } from "@discordjs/builders";
import CreateChapterRequest from "../requests/CreateChapterRequest";
import Member from "../base/NekoYuki/entities/Member";
import Permission from "../base/NekoYuki/enums/Permission";
import ViewProjectChapterRequest from "../requests/ViewProjectChapterRequest";
import CustomClient from "../base/classes/CustomClient";

export default class ViewProjectHandler implements IMediatorHandle<ViewProjectRequest> {
    name: string;
    ableToNavigate: boolean;

    constructor() {
        this.name = "ViewProject";
        this.ableToNavigate = true;
    }

    async handle(value: ViewProjectRequest): Promise<any> {
        try {
            const yukiMember = await value.data.client.dataSources.getRepository(Member).findOne({ where: { discordId: value.data.author.id } });
            if (!yukiMember) throw new CustomError("You are not a member of NekoYuki", ErrorCode.BadRequest, "View Project");
            if (!value.data.projectId)
                value.data.projectId = await ViewProjectHandler.chooseProject(value);
            if(!value.data.projectId) return;
            await ViewProjectHandler.viewProject(value.data.client, value.data.channel, value.data.author, yukiMember, value.data.projectId);
            // TODO: add navigation buttons
            // TODO: rebuild project query
            // TODO: clean messages after done
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
            /////////////// Step 01: Check if project exists ///////////////
            if (projectId === "-1") return false;
            if (!projectId) return false;
            // find project in array
            // let project = await value.data.client.dataSources
            //     .getRepository(Project)
            //     .findOne({
            //         where: { id: Number(value.data.projectId) },
            //         relations: ["members", "chapters", "members.role", "members.member"]
            //     });
            let project = await client.dataSources.getRepository(Project)
                .createQueryBuilder('project')
                .where("project.id = :id", { id:projectId })
                .leftJoinAndSelect('project.members', 'projectMember')
                .leftJoinAndSelect('projectMember.role', 'role')
                .leftJoinAndSelect('projectMember.member', 'member')
                .leftJoin('project.chapters', 'chapter')
                .loadRelationCountAndMap("project.chaptersCount", "project.chapters")
                .getOne();
            
            if (!project) {
                throw new CustomError("Project not found", ErrorCode.BadRequest, "View Project");
            }
            // project.chaptersCount = await value.data.client.dataSources.getRepository(Project)
            //     .createQueryBuilder('project')
            //     .where("project.id = :id", { id: value.data.projectId })
            //     .leftJoin('project.chapters', 'chapter')
            //     .getCount();

            /////////////// Step 02: Build project description ///////////////
            let projectDescription = "***-----OWNER-----***\n";
            projectDescription += `**<@${project.ownerId}>\n**`;
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
            if (project.members.length == 0) projectDescription += "`[⚠WARNING] No member, request project owner or project manager to add more member`\n";

            /////////////// Step 03: Build project embed ///////////////
            const projectEmbed = new EmbedBuilder()
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setTitle(project.name)
                .setDescription(projectDescription)
                .addFields([
                    { name: "Status", value: project.status.toString(), inline: true },
                    { name: "Number of chapters", value: project.chaptersCount.toString(), inline: true },
                    { name: "Last updated", value: project.lastUpdated.toDateString(), inline: true },
                ]);

            /////////////// Step 04.01: Build project action row ///////////////
            let hasProjectPermission = false;
            let hasAdvancedProjectPermission = false;

            if (yukiMember.discordId == project.ownerId) {
                hasProjectPermission = true;
                hasAdvancedProjectPermission = true;
            }
            if (yukiMember.hasPermission(Permission.MangeProject)) {
                hasProjectPermission = true;
                hasAdvancedProjectPermission = true;
            }
            if (yukiMember.hasPermission(Permission.UpdateProject)) hasProjectPermission = true;
            if (project.members.find(m => m.member.discordId === yukiMember.discordId)) hasProjectPermission = true;

            /////////////// Step 04.2: Build project context row ///////////////
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
            const editRow = new ActionRowBuilder()

            if (hasProjectPermission) {
                viewChapterBtn.setLabel("Manage chapters");
                editRow.addComponents(createChapterBtn, viewChapterBtn, editProjectBtn, manageMemberBtn);
            } else {
                viewChapterBtn.setLabel("View chapters");
                editRow.setComponents(viewChapterBtn);
            }
            if (hasAdvancedProjectPermission) {
                editRow.addComponents(deleteProjectBtn);
            }
            contextRows.push(editRow);
            // @ts-ignore   
            const projectInfoMsg = await currChannel.send({ embeds: [projectEmbed], components: contextRows });

            /////////////// Step 05: Handle project interaction ///////////////
            let globalBtnInteraction = null;
            try {
                const projectInteraction = await projectInfoMsg.awaitMessageComponent({ filter: (interaction : Interaction) => interaction.user.id === author.id, time: 60000 });
                await projectInfoMsg.delete();
                if (projectInteraction.isButton()) {
                    globalBtnInteraction = projectInteraction;
                }
                if (projectInteraction.isStringSelectMenu()) {
                    //TODO: add navigation handlers
                }
            } catch (error) {
                await projectInfoMsg.edit({ components: [] });
                return false;
            }
            if (!globalBtnInteraction) return false;
            const globalBtnInteractionAfter = globalBtnInteraction as ButtonInteraction;
            try {
                switch (globalBtnInteractionAfter.customId) {
                    case "createChapter":
                        const createChapterRequest = new CreateChapterRequest(client, currChannel, yukiMember, project)
                        await client.mediator.send(createChapterRequest);
                        break;
                    case "viewChapter":
                        const viewProjectChapterRequest = new ViewProjectChapterRequest({ customClient: client, interaction: globalBtnInteractionAfter, project: project, author: yukiMember });
                        await client.mediator.send(viewProjectChapterRequest);
                        break;
                    default:
                        break;
                }
            } catch (error) {
                if (error instanceof CustomError) {
                    throw error;
                }
                throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "View Project", error as Error);
            }
            return true;
        } catch (error) {
            console.log(error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "View Project", error as Error);
        }
    }

    static async editProject(value : ViewProjectRequest, project: Project) : Promise<void> {
        
    }

    static async deleteProject(value : ViewProjectRequest, project: Project) : Promise<void> {
    }

    static async manageMember(value : ViewProjectRequest, project: Project) : Promise<void> {
    }
}
