import { ButtonStyle, ComponentType, EmbedBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputBuilder } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import Project from "../base/NekoYuki/entities/Project";
import ViewProjectRequest from "../requests/ViewProjectRequest";
import { ActionRowBuilder, ButtonBuilder, SelectMenuBuilder } from "@discordjs/builders";
import CreateChapterRequest from "../requests/CreateChapterRequest";
import Member from "../base/NekoYuki/entities/Member";
import Permission from "../base/NekoYuki/enums/Permission";

// TODO: Change global error handling...
export default class ViewProjectHandler implements IMediatorHandle<ViewProjectRequest> {
    name: string;
    ableToNavigate: boolean;

    constructor() {
        this.name = "ViewProject";
        this.ableToNavigate = true;
    }

    async handle(value: ViewProjectRequest): Promise<any> {
        // TODO: add navigation buttons
        try {
            const yukiMember = await value.data.client.dataSources.getRepository(Member).findOne({ where: { discordId: value.data.author.id } });
            if (!yukiMember) throw new CustomError("You are not a member of NekoYuki", ErrorCode.BadRequest, "View Project");
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
            const projects = await value.data.client.dataSources.getRepository(Project).find();
            let i = 0;
            let targetProjectId = "-1";
            while (true) {
                let description = "";
                let projectOptions = [];
                for (let j = i; j < i + 5; j++) {
                    if (projects[i * 5 + j] === undefined) break;
                    description += `${projects[i * 5 + j].id} - ${projects[i * 5 + j].name}\n`;
                    projectOptions.push(new StringSelectMenuOptionBuilder()
                        .setLabel(projects[i * 5 + j].id.toString())
                        .setValue(projects[i * 5 + j].id.toString())
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
                    if (interaction.isButton()) {
                        if (interaction.customId === "navigateLeft") {
                            i -= 5;
                            if (i < 0) {
                                i = 0;
                            }
                        } else if (interaction.customId === "navigateRight") {
                            i += 5;
                            if (i > projects.length / 5) {
                                i = Math.floor(projects.length / 5) * 5;
                            }
                        }
                    } else if (interaction.isStringSelectMenu()) {
                        targetProjectId = interaction.values[0];
                        await chooseProjectMsg.delete();
                        break;
                    }
                    await chooseProjectMsg.delete();
                } catch (error) {
                    throw new CustomError("You didn't choose a project in time", ErrorCode.BadRequest, "View Project", error as Error);
                }
            }
            if (targetProjectId === "-1") {
                throw new CustomError("You didn't choose a project", ErrorCode.BadRequest, "View Project");
            }

            // find project in array
            let project = await value.data.client.dataSources
                .getRepository(Project)
                .findOne({
                    where: { id: Number(targetProjectId) },
                    relations: ["members", "chapters"]
                });

            if (!project) {
                throw new CustomError("Project not found", ErrorCode.BadRequest, "View Project");
            }


            let projectDescription = "***OWNER***\n";
            projectDescription += `**<@${project.ownerId}>\n**`;
            projectDescription += `------Members------\n`;
            project.members.forEach(m => {
                projectDescription += `- <@${m.id}>\n`;
            });
            const projectEmbed = new EmbedBuilder()
                .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                .setTitle(project.name)
                .setDescription(projectDescription)
                .addFields([
                    { name: "Status", value: project.status.toString(), inline: true },
                    { name: "Number of chapters", value: project.chapters.length.toString(), inline: true },
                    { name: "Last updated", value: project.lastUpdated.toDateString(), inline: true },
                ]);

            // TODO: Add navigation btns
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



            const contextRows = [];
            const createChapterBtn = new ButtonBuilder()
                .setCustomId("createChapter")
                .setLabel("Create chapter")
                .setStyle(ButtonStyle.Primary);
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
                .setStyle(ButtonStyle.Success);
            const deleteProjectBtn = new ButtonBuilder()
                .setCustomId("deleteProject")
                .setLabel("Delete project")
                .setStyle(ButtonStyle.Danger);
            const editRow = new ActionRowBuilder()
                .addComponents(viewChapterBtn);

            if (hasProjectPermission) {
                editRow.addComponents(createChapterBtn, editProjectBtn, manageMemberBtn);
            }
            if (hasAdvancedProjectPermission) {
                editRow.addComponents(deleteProjectBtn);
            }
            contextRows.push(editRow);
            contextRows.push(value.data.client.navigations);
            // @ts-ignore   
            const projectInfoMsg = await value.data.channel.send({ embeds: [projectEmbed], components: contextRows });

            try {
                const projectInteraction = await projectInfoMsg.awaitMessageComponent({ filter: (interaction) => interaction.user.id === value.data.author.id, time: 60000 });
                projectInfoMsg.delete();
                if (projectInteraction.isButton()) {
                    switch (projectInteraction.customId) {
                        case "createChapter":
                            const createChapterRequest = new CreateChapterRequest(value.data.client, value.data.channel, yukiMember, project)
                            await value.data.client.mediator.send(createChapterRequest);
                            break;

                        default:
                            break;
                    }
                }
                if(projectInteraction.isStringSelectMenu()){
                    
                }

            } catch (error) {
                throw new CustomError("Time out", ErrorCode.UserCancelled, "View Project", error as Error);
            }
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
}