import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, Interaction, StringSelectMenuBuilder } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import ViewMemberProjectRequest from "../requests/ViewMemberProjectRequest";
import NavigationButton from "../utils/NavigationButton";
import ProjectMember from "../base/NekoYuki/entities/ProjectMember";
import ViewProjectRequest from "../requests/ViewProjectRequest";
import Project from "../base/NekoYuki/entities/Project";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
export default class ViewMemberProjectHandler implements IMediatorHandle<ViewMemberProjectRequest> {
    name: string;
    ableToNavigate: boolean;
    constructor() {
        this.name = "ViewMemberProject";
        this.ableToNavigate = false;
    }
    async handle(value: ViewMemberProjectRequest): Promise<boolean> {
        try {
            const numberOfPendingProject = await value.data.client.dataSources.getRepository(ProjectMember)
                .createQueryBuilder("projectMember")
                .where("project.verified = false")
                .andWhere("member.discordId = :id", { id: value.data.targetUser?.id })
                .leftJoinAndSelect("projectMember.project", "project")
                .leftJoinAndSelect("projectMember.member", "member")
                .getCount();
            const numberOfProject = await value.data.client.dataSources.getRepository(ProjectMember)
                .createQueryBuilder("projectMember")
                .where("member.discordId = :id", { id: value.data.targetUser?.id })
                .leftJoinAndSelect("projectMember.project", "project")
                .leftJoinAndSelect("projectMember.member", "member")
                .getCount();
            const first5PendingProject = await value.data.client.dataSources.getRepository(ProjectMember)
                .createQueryBuilder("projectMember")
                .where("project.verified = false")
                .andWhere("member.discordId = :id", { id: value.data.targetUser?.id })
                .orderBy("projectMember.createdAt", "DESC")
                .leftJoinAndSelect("projectMember.project", "project")
                .leftJoinAndSelect("projectMember.member", "member")
                .leftJoinAndSelect("projectMember.role", "role")
                .take(5)
                .getMany();
            let memberProjectInfoString = `${value.data.targetUser?.displayName} have ${numberOfProject} project(s) in total, ${numberOfPendingProject} of them are pending.`;
            if (numberOfPendingProject > 5) {
                memberProjectInfoString += " ***Your first 5 pending projects are:***\n";
            } else {
                memberProjectInfoString += " ***Your pending projects are:***\n";
            }
            memberProjectInfoString += first5PendingProject.map((project) => {
                return `- Project ${project.project.name} - Role: ${project.role.Name}`;
            }).join("\n");
            const memberProjectInfoEmbed = new EmbedBuilder()
                .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                .setTitle(`Project statistics of ${value.data.targetUser?.displayName}`)
                .setDescription(memberProjectInfoString)
                .setColor("Blue")
                .setTimestamp();

            const showAllAcceptProject = new ButtonBuilder()
                .setCustomId("showAllAcceptProject")
                .setLabel("All Accepted Project")
                .setStyle(ButtonStyle.Success);
            const showAllPendingProject = new ButtonBuilder()
                .setCustomId("showAllPendingProject")
                .setLabel("All Pending Project")
                .setStyle(ButtonStyle.Secondary);
            const showAllOwnedProject = new ButtonBuilder()
                .setCustomId("showAllOwnedProject")
                .setLabel("Owned Project")
                .setStyle(ButtonStyle.Primary);
            const returnButton = new ButtonBuilder()
                .setCustomId("return")
                .setLabel("Return")
                .setStyle(ButtonStyle.Danger);
            const actionRow = new ActionRowBuilder()
                .addComponents(showAllAcceptProject, showAllPendingProject, showAllOwnedProject, returnButton);
            // @ts-ignore
            const infoMsgWithButton = await value.data.channel.send({ embeds: [memberProjectInfoEmbed], components: [actionRow] });

            let userReaction = "-1";
            try {
                const filter = (interaction: Interaction) => { return interaction.user.id === value.data.author.id; }
                const interaction = await infoMsgWithButton.awaitMessageComponent({ filter, time: 60000, componentType: ComponentType.Button });
                infoMsgWithButton.delete();
                userReaction = interaction.customId;
            } catch (error) {
                infoMsgWithButton.edit({ components: [] });
                return false;
            }

            switch (userReaction) {
                case "showAllAcceptProject":
                    return await this.showAcceptedProject(value, numberOfProject - numberOfPendingProject);
                    break;

                case "showAllPendingProject":
                    return await this.showPendingProject(value, numberOfPendingProject);
                    break;
                case "showAllOwnedProject":
                    return await this.showOwnedProject(value);
                    break;
                case "return":
                    return true;
                    break;
                default:
                    return false;
                    break;
            }
        } catch (error) {
            console.log(error);
            if (error instanceof CustomError) throw error;
            throw new CustomError("An error occurred while handling ViewProjectMemberChapter", ErrorCode.InternalServerError, this.name, error as Error);
        }
    }

    async showPendingProject(value: ViewMemberProjectRequest, numberOfPendingProject: number): Promise<boolean> {
        try {
            if (numberOfPendingProject === 0) {
                const noPendingProjectEmbed = new EmbedBuilder()
                    .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                    .setTitle(`Pending project of ${value.data.targetUser?.displayName}`)
                    .setDescription(`Yay! Member ${value.data.targetUser?.displayName} have **no pending project**. Good job!\n Return to the menu in 5 seconds...`)
                    .setColor("Green")
                    .setTimestamp();
                const noPendingProjectMessage = await value.data.channel.send({ embeds: [noPendingProjectEmbed] });
                await delay(5000);
                noPendingProjectMessage.delete();
            }
            let i = 0;
            while (true) {
                const pendingProjectInfo = await value.data.client.dataSources.getRepository(ProjectMember)
                    .createQueryBuilder("projectMember")
                    .leftJoinAndSelect("projectMember.project", "project")
                    .leftJoinAndSelect("projectMember.member", "member")
                    .leftJoinAndSelect("projectMember.role", "role")
                    .where("project.verified = false")
                    .andWhere("member.discordId = :id", { id: value.data.targetUser?.id })
                    .getMany();
                let pendingProjectInfoString = `${value.data.targetUser?.displayName} have ${numberOfPendingProject} pending projects(s).\n \`⚠Theese project need member with required permission/role accept before receving full benefits.\n\`` + pendingProjectInfo.map((project) => {
                    return `- Project ${project.project.name} - Role: ${project.role.Name}`;
                }).join("\n");

                if (pendingProjectInfo.length === 0) return true;
                const pendingChapterEmbed = new EmbedBuilder()
                    .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                    .setTitle(`Pending project of ${value.data.targetUser?.displayName}`)
                    .setDescription(pendingProjectInfoString)
                    .setColor("Yellow")
                    .setFooter({ text: `Page ${i + 1}` })
                    .setTimestamp();
                const navigationButtons = NavigationButton.getNavigationButton();
                if (i === 0) navigationButtons[0].setDisabled(true);
                if (5 * (i + 1) >= numberOfPendingProject) navigationButtons[2].setDisabled(true);
                const navigationRow = new ActionRowBuilder().addComponents(navigationButtons);

                const chooseProjectSelectMenu = new StringSelectMenuBuilder()
                    .setCustomId("chooseProject")
                    .setPlaceholder("Select a project to view")
                    .addOptions(pendingProjectInfo.map((project) => {
                        return {
                            label: project.project.name.slice(0, 25) + (project.project.name.length > 25 ? "..." : ""),
                            value: project.project.id.toString()
                        }
                    }));
                const chooseProjectRow = new ActionRowBuilder().addComponents(chooseProjectSelectMenu);
                // @ts-ignore
                const pendingChapterMessage = await value.data.channel.send({ embeds: [pendingChapterEmbed], components: [navigationRow, chooseProjectRow] });
                let choosenProjectId = "-1";
                try {
                    const filter = (interaction: Interaction) => {
                        return interaction.user.id === value.data.author.id;
                    }
                    const interaction = await pendingChapterMessage.awaitMessageComponent({ filter, time: 60000 });
                    pendingChapterMessage.delete();
                    if (interaction.isButton())
                        if (interaction.customId === "navigateLeft") {
                            i--;
                            if (i < 0) i = 0;
                        } else if (interaction.customId === "navigateRight") {
                            i++;
                            if (5 * (i + 1) >= numberOfPendingProject) i--;
                        }

                    if (interaction.isStringSelectMenu()) {
                        choosenProjectId = interaction.values[0];
                    }
                } catch (error) {
                    pendingChapterMessage.edit({ components: [] });
                    return false;
                }
                if (choosenProjectId != "-1") {
                    const viewProjectRequest = new ViewProjectRequest(value.data.client, value.data.channel, value.data.author, value.data.authorMember, choosenProjectId)
                    return await value.data.client.mediator.send(viewProjectRequest);
                }
            }
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An error occurred while showing pending chapter", ErrorCode.InternalServerError, this.name, error as Error);
        }
    }


    async showAcceptedProject(value: ViewMemberProjectRequest, numberOfVerifiedProject: number): Promise<boolean> {
        try {
            if (numberOfVerifiedProject === 0) {
                const noPendingProjectEmbed = new EmbedBuilder()
                    .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                    .setTitle(`Pending project of ${value.data.targetUser?.displayName}`)
                    .setDescription(`Oops! Member ${value.data.targetUser?.displayName} have **no accepted project**. ` +
                        + `You can told members who can accept your project to accept your pending project if you have now!`
                        + `\n Return to the menu in 5 seconds...`)
                    .setColor("Green")
                    .setTimestamp();
                const noPendingProjectMessage = await value.data.channel.send({ embeds: [noPendingProjectEmbed] });
                await delay(5000);
                noPendingProjectMessage.delete();
            }

            let i = 0;
            while (true) {
                const verifiedProjectInfo = await value.data.client.dataSources.getRepository(ProjectMember)
                    .createQueryBuilder("projectMember")
                    .leftJoinAndSelect("projectMember.project", "project")
                    .leftJoinAndSelect("projectMember.member", "member")
                    .leftJoinAndSelect("projectMember.role", "role")
                    .where("project.verified = true")
                    .andWhere("member.discordId = :id", { id: value.data.targetUser?.id })
                    .getMany();
                let verifiedProjectInfoString = `${value.data.targetUser?.displayName} have ${numberOfVerifiedProject} accepted projects(s).\n` + verifiedProjectInfo.map((project) => {
                    return `- Project ${project.project.name} - Role: ${project.role.Name}`;
                }).join("\n");

                if (verifiedProjectInfo.length === 0) return true;
                const verifiedChapterEmbed = new EmbedBuilder()
                    .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                    .setTitle(`Pending project of ${value.data.targetUser?.displayName}`)
                    .setDescription(verifiedProjectInfoString)
                    .setColor("Green")
                    .setFooter({ text: `Page ${i + 1}` })
                    .setTimestamp();
                const navigationButtons = NavigationButton.getNavigationButton();
                if (i === 0) navigationButtons[0].setDisabled(true);
                if (5 * (i + 1) >= numberOfVerifiedProject) navigationButtons[2].setDisabled(true);
                const navigationRow = new ActionRowBuilder().addComponents(navigationButtons);

                const chooseProjectSelectMenu = new StringSelectMenuBuilder()
                    .setCustomId("chooseProject")
                    .setPlaceholder("Select a project to view")
                    .addOptions(verifiedProjectInfo.map((project) => {
                        return {
                            label: project.project.name.slice(0, 25) + (project.project.name.length > 25 ? "..." : ""),
                            value: project.project.id.toString()
                        }
                    }));
                const chooseProjectRow = new ActionRowBuilder().addComponents(chooseProjectSelectMenu);
                // @ts-ignore
                const verifiedChapterMessage = await value.data.channel.send({ embeds: [verifiedChapterEmbed], components: [navigationRow, chooseProjectRow] });

                let choosenProjectId = "-1";
                try {
                    const filter = (interaction: Interaction) => {
                        return interaction.user.id === value.data.author.id;
                    }
                    const interaction = await verifiedChapterMessage.awaitMessageComponent({ filter, time: 60000 });
                    verifiedChapterMessage.delete();
                    if (interaction.isButton())
                        if (interaction.customId === "navigateLeft") {
                            i--;
                            if (i < 0) i = 0;
                        } else if (interaction.customId === "navigateRight") {
                            i++;
                            if (5 * (i + 1) >= numberOfVerifiedProject) i--;
                        }

                    if (interaction.isStringSelectMenu()) {
                        choosenProjectId = interaction.values[0];
                    }
                } catch (error) {
                    verifiedChapterMessage.edit({ components: [] });
                    return false;
                }

                if (choosenProjectId != "-1") {
                    const viewProjectRequest = new ViewProjectRequest(value.data.client, value.data.channel, value.data.author, value.data.authorMember, choosenProjectId)
                    return await value.data.client.mediator.send(viewProjectRequest);
                }
            }
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An error occurred while showing accepted chapter", ErrorCode.InternalServerError, this.name, error as Error);
        }
    }

    async showOwnedProject(value: ViewMemberProjectRequest): Promise<boolean> {
        try {

            let i = 0;
            while (true) {
                const ownedProjectInfo = await value.data.client.dataSources.getRepository(Project)
                    .createQueryBuilder("project")
                    .where("project.ownerId = :id", { id: value.data.targetUser?.id })
                    .leftJoinAndSelect("project.members", "members")
                    .leftJoinAndSelect("members.role", "role")
                    .getMany();
                if (ownedProjectInfo.length === 0) {
                    const noProjectEmbed = new EmbedBuilder()
                        .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                        .setTitle(`Pending project of ${value.data.targetUser?.displayName}`)
                        .setDescription(`Oops! Member ${value.data.targetUser?.displayName} have **no owned project**. ` +
                            + `\nYou can create a project by using the command \`/create-project\`.`
                            + `\n Return to the menu in 5 seconds...`)
                        .setColor("Green")
                        .setTimestamp();
                    const noProjectMessage = await value.data.channel.send({ embeds: [noProjectEmbed] });
                    await delay(5000);
                    noProjectMessage.delete();
                    return true;
                }
                let verifiedProjectInfoString = `${value.data.targetUser?.displayName} have ${ownedProjectInfo.length} owned projects(s).\n` + ownedProjectInfo.map((project) => {
                    return `- Project ${project.name} / Number of members: ${project.members.length}`;
                }).join("\n");


                const verifiedChapterEmbed = new EmbedBuilder()
                    .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                    .setTitle(`Pending project of ${value.data.targetUser?.displayName}`)
                    .setDescription(verifiedProjectInfoString)
                    .setColor("Green")
                    .setFooter({ text: `Page ${i + 1}` })
                    .setTimestamp();
                const navigationButtons = NavigationButton.getNavigationButton();
                if (i === 0) navigationButtons[0].setDisabled(true);
                if (5 * (i + 1) >= ownedProjectInfo.length) navigationButtons[2].setDisabled(true);
                const navigationRow = new ActionRowBuilder().addComponents(navigationButtons);

                const chooseProjectSelectMenu = new StringSelectMenuBuilder()
                    .setCustomId("chooseProject")
                    .setPlaceholder("Select a project to view")
                    .addOptions(ownedProjectInfo.map((project) => {
                        return {
                            label: project.name.slice(0, 25) + (project.name.length > 25 ? "..." : ""),
                            value: project.id.toString()
                        }
                    }));
                const chooseProjectRow = new ActionRowBuilder().addComponents(chooseProjectSelectMenu);
                // @ts-ignore
                const verifiedChapterMessage = await value.data.channel.send({ embeds: [verifiedChapterEmbed], components: [navigationRow, chooseProjectRow] });

                let choosenProjectId = "-1";
                try {
                    const filter = (interaction: Interaction) => {
                        return interaction.user.id === value.data.author.id;
                    }
                    const interaction = await verifiedChapterMessage.awaitMessageComponent({ filter, time: 60000 });
                    verifiedChapterMessage.delete();
                    if (interaction.isButton())
                        if (interaction.customId === "navigateLeft") {
                            i--;
                            if (i < 0) i = 0;
                        } else if (interaction.customId === "navigateRight") {
                            i++;
                            if (5 * (i + 1) >= ownedProjectInfo.length) i--;
                        }

                    if (interaction.isStringSelectMenu()) {
                        choosenProjectId = interaction.values[0];
                    }
                } catch (error) {
                    verifiedChapterMessage.edit({ components: [] });
                    return false;
                }

                if (choosenProjectId != "-1") {
                    const viewProjectRequest = new ViewProjectRequest(value.data.client, value.data.channel, value.data.author, value.data.authorMember, choosenProjectId)
                    return await value.data.client.mediator.send(viewProjectRequest);
                }
            }
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An error occurred while showing accepted chapter", ErrorCode.InternalServerError, this.name, error as Error);
        }
    }
}