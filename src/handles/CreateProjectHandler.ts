import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder, Interaction, Message, ModalBuilder, StringSelectMenuBuilder, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import Member from "../base/NekoYuki/entities/Member";
import Permission from "../base/NekoYuki/enums/Permission";
import CreateProjectRequest from "../requests/CreateProjectRequest";
import Project from "../base/NekoYuki/entities/Project";
import ProjectMember from "../base/NekoYuki/entities/ProjectMember";
import GeneralRole from "../base/NekoYuki/entities/GeneralRole";
import ViewProjectRequest from "../requests/ViewProjectRequest";
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
export default class CreateProjectHandler implements IMediatorHandle<CreateProjectRequest> {
    name: string;
    ableToNavigate: boolean;
    constructor() {
        this.name = "CreateProject";
        this.ableToNavigate = true;
    }
    async handle(value: CreateProjectRequest): Promise<any> {
        try {
            const messageList: Array<Message<true>> = [];

            const authorMember = await value.data.client.dataSources.getRepository(Member).findOne({
                where: { discordId: value.data.author.id }
            });

            if (!authorMember)
                throw new CustomError("You haven't registered yet", ErrorCode.UserCannotBeFound, "Create Project");
            if (!authorMember.hasPermission(Permission.CreateProject))
                throw new CustomError("You don't have permission to create a project", ErrorCode.Forbidden, "Create Project");

            // Step 2: send prompt to get project information
            const infoInteraction = await this.sendInfo(value, messageList);
            console.log("Done sending info");
            // Step 3: get project information
            const projectInfoInput = await this.getBasicInformation(infoInteraction, messageList);
            console.log("Done getting basic info");
            const projectWithSameName = await value.data.client.dataSources.getRepository(Project).findOne({
                where: { name: projectInfoInput.name }
            });
            if (projectWithSameName) {
                throw new CustomError("Project with the same name already exists", ErrorCode.BadRequest, "Create Project");
            }
            let newProject = new Project();
            newProject.name = projectInfoInput.name;
            newProject.ownerId = authorMember.discordId;
            newProject.lastUpdated = new Date();
            try {
                await value.data.client.dataSources.getRepository(Project).save(newProject);
            } catch (error) {
                throw new CustomError("An error occurred while saving the project to the database", ErrorCode.InternalServerError, "Create Project", error as Error);
            }
            const savedProject = await value.data.client.dataSources.getRepository(Project).findOne({
                where: { name: projectInfoInput.name, ownerId: authorMember.discordId }
            });
            if (!savedProject) {
                throw new CustomError("An error occurred while saving the project", ErrorCode.InternalServerError, "Create Project");
            }

            // Step 4: Get owner roles
            let ownerRoles = await this.getOwnerRoles(value, savedProject, messageList);
            console.log("Done getting owner roles");

            // Step 5: save to database
            await this.saveToDatabase(value, savedProject, ownerRoles);
        } catch (error) {

            if (error instanceof CustomError) {
                return value.data.channel.send({ content: error.message });
            }
            return value.data.channel.send({ content: "An error occurred while processing your request. Please try again later." });
        }
    }

    async sendInfo(value: CreateProjectRequest, messageList: Array<Message>): Promise<ButtonInteraction> {
        const projectInfoEmbed = new EmbedBuilder()
            .setTitle("Project Information")
            .setDescription("Please provide the informations of the project you want to create. When you accept, we need you to provide some important information of the project. When you're ready, click the **accept** button.")
            .setColor("Random")
            .setAuthor({ name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL() })
            .setFooter({ text: "NekoYuki's manager" })
            .setTimestamp();

        const acceptButton = new ButtonBuilder()
            .setCustomId("accept")
            .setLabel("Accept")
            .setStyle(ButtonStyle.Success);
        const cancelButton = new ButtonBuilder()
            .setCustomId("cancel")
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Danger);

        const infoRow = new ActionRowBuilder()
            .addComponents(acceptButton, cancelButton);

        //@ts-ignore
        const infoMessage = await value.data.channel.send({ embeds: [projectInfoEmbed], components: [infoRow] });
        messageList.push(infoMessage);
        // Step 3: wait for user to accept or cancel
        try {
            const filter = (interaction: Interaction) => { return interaction.user.id === value.data.author.id; };
            const infoInteraction = await infoMessage.awaitMessageComponent({ filter, time: 60000, componentType: ComponentType.Button });
            await infoMessage.delete();
            messageList.pop();
            if (!infoInteraction) {
                throw new CustomError("Create project request cancelled", ErrorCode.TimeOut, "Create Project");
            }
            if (infoInteraction.customId === "cancel") {
                throw new CustomError("Create project request cancelled", ErrorCode.UserCancelled, "Create Project");
            }
            return infoInteraction as ButtonInteraction;
        } catch (error) {
            throw new CustomError("Create project request cancelled", ErrorCode.TimeOut, "Create Project", error as Error);
        }
    }

    async getBasicInformation(infoInteraction: ButtonInteraction, messageList: Array<Message>): Promise<ProjectRequiredInformation> {
        // Step 3: get project information
        const getProjectInfoModal = new ModalBuilder()
            .setCustomId("getProjectInfo")
            .setTitle("Project Information");

        const projectNameInput = new TextInputBuilder()
            .setCustomId("projectName")
            .setPlaceholder("Project Name")
            .setLabel("Project Name")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        const projectInputRow = new ActionRowBuilder()
            .addComponents(projectNameInput);

        //@ts-ignore
        getProjectInfoModal.addComponents(projectInputRow);

        await infoInteraction.showModal(getProjectInfoModal);
        const projectInfoModalInteraction = await infoInteraction.awaitModalSubmit({ time: 60000 });
        if (!projectInfoModalInteraction) {
            throw new CustomError("Create project request cancelled", ErrorCode.TimeOut, "Create Project");
        }
        const projectName = projectInfoModalInteraction.fields.getTextInputValue("projectName");
        if (!projectName) {
            throw new CustomError("Project name is required", ErrorCode.BadRequest, "Create Project");
        }
        await projectInfoModalInteraction.deferReply({ ephemeral: true });
        await projectInfoModalInteraction.editReply({ content: `Project name: ${projectName}` });
        await delay(3000);
        projectInfoModalInteraction.deleteReply();

        return { name: projectName };
    }

    async getOwnerRoles(value: CreateProjectRequest, project: Project, messageList: Array<Message>): Promise<ProjectMember[]> {
        try {
            let ownerRoles: ProjectMember[] = [];
            const currMember = await value.data.client.dataSources.getRepository(Member).findOne({
                where: { discordId: value.data.author.id },
                relations: ["generalRoles"]
            });
            if (!currMember) {
                throw new CustomError("You haven't registered yet", ErrorCode.UserCannotBeFound, "Create Project");
            }
            const allRoles = await value.data.client.dataSources.getRepository(GeneralRole).find();
            do {
                let ownerRolesString = ""
                ownerRoles.forEach((role) => {
                    ownerRolesString += role.role.Name + ", ";
                });
                if(ownerRolesString.length == 0) ownerRolesString = "No role";
                const roleSelect = new StringSelectMenuBuilder()
                    .setCustomId("roleSelect")
                    .setPlaceholder("Select a role")
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(allRoles.map((role) => {
                        return {
                            label: role.Name,
                            value: role.Id.toString()
                        }
                    }));
                
                const roleSelectRow = new ActionRowBuilder().addComponents(roleSelect);
                const acceptButton = new ButtonBuilder()
                    .setCustomId("accept")
                    .setLabel("Accept")
                    .setStyle(ButtonStyle.Success);
                const cancelButton = new ButtonBuilder()
                    .setCustomId("cancel")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Danger);

                const btnRow = new ActionRowBuilder().addComponents(acceptButton, cancelButton);

                const roleDashboardEmbed = new EmbedBuilder()
                    .setTitle(`Position Dashboard for ${value.data.author.displayName}`)
                    .setDescription(`After choose your name, you need to specify your role in project ${project.name}\n. Note that:` +
                        "\n- 1. You can only have many roles in a project" +
                        "\n- 2. Picking an existing role will remove it" +
                        "\n- 3. Picking a new role will add it" +
                        "***When you're done, click the accept button, we will save all your provided information to the database***")
                    .setColor("Blue")
                    .setAuthor({ name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL() })
                    .setFooter({ text: "NekoYuki's manager" })
                    .setTimestamp()
                    .addFields({ name: "Current roles", value: ownerRolesString });
                // @ts-ignore
                const roleMsg = await value.data.channel.send({ embeds: [roleDashboardEmbed], components: [roleSelectRow, btnRow] });
                try {
                    const roleSelectInteraction = await value.data.channel.awaitMessageComponent({ filter: (interaction) => interaction.user.id === value.data.author.id, time: 60000 });
                    await roleMsg.delete();
                    if (roleSelectInteraction.isButton()) {
                        if (roleSelectInteraction.customId === "accept") {
                            if(ownerRoles.length == 0) {
                                const warningMsg = await roleSelectInteraction.reply({ content: "You must have at least one role", ephemeral: true });
                                await delay(3000);
                                await warningMsg.delete();
                                continue;
                            }
                            return ownerRoles;
                        }
                        if (roleSelectInteraction.customId === "cancel") {
                            throw new CustomError("Create project request cancelled", ErrorCode.UserCancelled, "Create Project");
                        }
                    }
                    if (roleSelectInteraction.isStringSelectMenu()) {
                        const selectedRole = roleSelectInteraction.values[0];
                        const role = allRoles.find((role) => role.Id.toString() === selectedRole);
                        if (!role) {
                            throw new CustomError("Role not found", ErrorCode.BadRequest, "Create Project");
                        }
                        const roleIndex = ownerRoles.findIndex((r) => r.role.Id === role.Id);
                        if (roleIndex === -1) {
                            const newRole = new ProjectMember();
                            newRole.member = currMember;
                            newRole.project = project;
                            newRole.role = role;
                            newRole.isOwner = true;
                            ownerRoles.push(newRole);
                            await roleSelectInteraction.reply({ content: `Role ${role.Name} has been added`, ephemeral: true });
                        } else {
                            await roleSelectInteraction.reply({ content: `Role ${role.Name} has been removed`, ephemeral: true });
                            ownerRoles.splice(roleIndex, 1);
                        }
                        await delay(2000);
                    }
                } catch (error) {
                    if (error instanceof CustomError) {
                        throw error;
                    }
                    throw new CustomError("Create project request cancelled", ErrorCode.TimeOut, "Create Project", error as Error);
                }
            } while (true);
        } catch (error) {
            console.log(error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Create project request cancelled", ErrorCode.TimeOut, "Create Project", error as Error);
        }
    }

    async saveToDatabase(value: CreateProjectRequest, project: Project, projectMember: ProjectMember[]) : Promise<void> {
        const createProjectStatusEmbed = new EmbedBuilder()
            .setTitle(`Creating project ${project.name}`)
            .setAuthor({ name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL() })
            .setTitle("Saving project to database")
            .setDescription("***Step 1:*** Adding project to the database...")
            .setColor("Random")
            .setFooter({ text: "NekoYuki's manager" })
            .setTimestamp();
        const currChannel = value.data.channel as TextChannel;
        const createProjectStatusMsg = await currChannel.send({ embeds: [createProjectStatusEmbed] });
        await delay(3000);
        createProjectStatusEmbed.setDescription(`- ***Step 1:*** Adding project to the database... ***Done***\n- ***Step 2:*** Adding owner roles to the database...`);
        await createProjectStatusMsg.edit({ content: "", embeds: [createProjectStatusEmbed] });
        try {
            projectMember.forEach(async (member) => {
                await value.data.client.dataSources.getRepository(ProjectMember).save(member);
            });
            createProjectStatusEmbed.setDescription(`- ***Step 1:*** Adding project to the database... ***Done***\n- ***Step 2:*** Adding owner roles to the database... ***Done*** - ***Step 3***: Cleaning...`);
            await createProjectStatusMsg.edit({ content: "", embeds: [createProjectStatusEmbed] });
            await delay(3000);
            createProjectStatusEmbed
                .setTitle("All Done!")
                .setDescription("✔ Project has been created successfully! Here's your project information. Returning to the project info...")
                .setColor("Green")
                .setFooter({ text: "NekoYuki's manager" })
                .setTimestamp()
                .setFields([
                    { name: "Project Name", value: project.name, inline: true },
                    { name: "Owner", value: value.data.author.displayName, inline: true },
                    { name: "Owner roles", value: projectMember.map((role) => role.role.Name).join(", "), inline: false }
                ]);
            await createProjectStatusMsg.edit({ content: "", embeds: [createProjectStatusEmbed] });
            await delay(5000);
            await createProjectStatusMsg.delete();
            // TODO: send request to project viewer to view the project
            await value.data.client.mediator.send(new ViewProjectRequest(value.data.client, currChannel, value.data.author, project.id.toString()));
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            await value.data.client.dataSources.getRepository(Project).delete({ id: project.id });
            createProjectStatusMsg.delete();
            throw new CustomError("An error occurred while saving the project, project deleted.", ErrorCode.InternalServerError, "Create Project", error as Error);
        }
    }
}

class ProjectRequiredInformation {
    name: string;

    constructor() {
        this.name = "";
    }
}