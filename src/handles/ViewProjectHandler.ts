import { ButtonStyle, ComponentType, EmbedBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputBuilder } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import Project from "../base/NekoYuki/entities/Project";
import ViewProjectRequest from "../requests/ViewProjectRequest";
import { ActionRowBuilder, ButtonBuilder, SelectMenuBuilder } from "@discordjs/builders";
import { RoleHelper } from "../base/NekoYuki/enums/Role";

export default class ViewProjectHandler implements IMediatorHandle<ViewProjectRequest> {
    name: string;

    constructor() {
        this.name = "ViewProject";
    }

    async handle(value: ViewProjectRequest): Promise<any> {

        // TODO: add project viewer after modeling the chapter entity

        try {
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
                        break;
                    }
                    await chooseProjectMsg.delete();
                } catch (error) {
                    throw new CustomError("You didn't choose a project in time", ErrorCode.BadRequest, "View Project");
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
                    relations: ["members"]
                });
            console.log(project?.members);
            
            if (!project) {
                throw new CustomError("Project not found", ErrorCode.BadRequest, "View Project");
            }

            let projectOwnerId = project.members.find(m => m.isOwner = true)?.id;
            if (!projectOwnerId) {
                throw new CustomError("Project owner not found", ErrorCode.InternalServerError, "View Project");
            }

            let projectDescription = "***Members***\n";
            projectDescription += `<@${projectOwnerId}> - Owner\n`;

            project.members.forEach(m => {
                projectDescription += `<@${m.id}> - ${RoleHelper.getRoleString(m.getAllRoles())}\n`;
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
            await value.data.channel.send({ embeds: [projectEmbed] });
        } catch (error) {
            console.log(error);
            
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "View Project");
        }
    }
}