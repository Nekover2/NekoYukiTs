import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder, Interaction, Message, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import Member from "../base/NekoYuki/entities/Member";
import Permission from "../base/NekoYuki/enums/Permission";
import CreateProjectRequest from "../requests/CreateProjectRequest";
import Project from "../base/NekoYuki/entities/Project";
import ProjectMember from "../base/NekoYuki/entities/ProjectMember";
import Role, { RoleHelper } from "../base/NekoYuki/enums/Role";

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
            const messageList : Array<Message<true>> = [];

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
            // Step 4: Get owner roles
            let ownerRole = await this.getOwnerRoles(value, messageList);
            console.log("Done getting owner roles");

            let newProject = new Project();
            newProject.name = projectInfoInput.name;
            newProject.ownerId = authorMember.discordId
            ownerRole.member = authorMember;
            ownerRole.project = newProject;
            console.log(newProject);
            
            // Step 5: save to database
            const createProjectStatusEmbed = new EmbedBuilder()
                .setTitle(`Creating project ${newProject.name}`)
                .setAuthor({ name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL() })
                .setTitle("Saving project to database")
                .setDescription("***Step 1:*** Adding project to the database...")
                .setColor("Random")
                .setFooter({ text: "NekoYuki's manager" })
                .setTimestamp();
            const createProjectStatusMsg = await value.data.channel.send({ embeds: [createProjectStatusEmbed] });
            await delay(3000);
            await value.data.client.dataSources.getRepository(Project).save(newProject);
            createProjectStatusEmbed.setDescription(`- ***Step 1:*** Adding project to the database... ***Done***\n- ***Step 2:*** Adding owner roles to the database...`);
            await createProjectStatusMsg.edit({ content: "", embeds: [createProjectStatusEmbed] });
            await value.data.client.dataSources.getRepository(ProjectMember).save(ownerRole);
            createProjectStatusEmbed.setDescription(`- ***Step 1:*** Adding project to the database... ***Done***\n- ***Step 2:*** Adding owner roles to the database... ***Done*** - ***Step 3***: Cleaning...`);
            delay(3000);
            await createProjectStatusMsg.edit({ content: "", embeds: [createProjectStatusEmbed] });
            for(let msg of messageList) 
                if(msg.deletable)
                    msg.delete();
            createProjectStatusEmbed.setTitle("All Done!")
                .setDescription("✔ Project has been created successfully!")
                .setColor("Green");
            await createProjectStatusMsg.edit({ content: "", embeds: [createProjectStatusEmbed] });
            await delay(5000);
            // TODO: send request to project viewer to view the project
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

    async getBasicInformation(infoInteraction: ButtonInteraction, messageList : Array<Message> ): Promise<ProjectRequiredInformation> {
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
        await projectInfoModalInteraction.editReply({ content: `Project name: ${projectName}`});
        await delay(3000);
        projectInfoModalInteraction.deleteReply();
        
        return { name: projectName };
    }

    async getOwnerRoles(value: CreateProjectRequest, messageList : Array<Message>): Promise<ProjectMember> {
        let ownerRoles = new ProjectMember();
        do {
            let roleString = RoleHelper.getRoleString(ownerRoles.getAllRoles());
            if (roleString.length === 0) {
                roleString = "No role";
            }

            const roleValue = Object.values(Role).filter((r) => !isNaN(Number(r)));
            const roleLabel = Object.keys(Role).filter((r) => isNaN(Number(r)));
            
            const roleSelectOptions = roleLabel.map((label, index) => {
                return {
                    label: label,
                    value: roleValue[index].toString(),
                }
            });
            
            const roleSelect = new StringSelectMenuBuilder()
                .setCustomId("roleSelect")
                .setPlaceholder("Select a role")
                .setMinValues(1)
                .setMaxValues(1)
                .addOptions(roleSelectOptions);
            
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
                .setTitle(`Role Dashboard for ${value.data.author.displayName}`)
                .setDescription("This is a role dashboard for the member you selected, you can manage their roles here. You can change their roles by picking roles input below. Note that, pick an existing role will remove it, and pick a non-existing role will add it. ***When you're done, click the accept button.***")
                .setColor("Random")
                .setAuthor({ name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL() })
                .setFooter({ text: "NekoYuki's manager" })
                .setTimestamp()
                .addFields({ name: "Current roles", value: roleString });
            // @ts-ignore
            const roleMsg = await value.data.channel.send({ embeds: [roleDashboardEmbed], components: [roleSelectRow, btnRow] });

            try {
                const roleSelectInteraction = await value.data.channel.awaitMessageComponent({ filter: (interaction) => interaction.user.id === value.data.author.id, time: 60000 });
                if (roleSelectInteraction.isButton()) {
                    if (roleSelectInteraction.customId === "accept") {
                        if(roleMsg.deletable)
                            await roleMsg.delete();
                        return ownerRoles;
                    }
                    if (roleSelectInteraction.customId === "cancel") {
                        throw new CustomError("Create project request cancelled", ErrorCode.UserCancelled, "Create Project");
                    }
                }
                if (roleSelectInteraction.isStringSelectMenu()) {
                    const selectedRole = roleSelectInteraction.values[0];
                    const role = parseInt(selectedRole);
                    if (ownerRoles.hasRole(role)) {
                        await roleSelectInteraction.reply({ content: `Role will be removed: ${roleLabel[roleValue.indexOf(role)]}`, ephemeral: true });
                        ownerRoles.removeRole(role);
                    } else {
                        await roleSelectInteraction.reply({ content: `Role will be added: ${roleLabel[roleValue.indexOf(role)]}`, ephemeral: true });
                        ownerRoles.addRole(role);
                    }
                    await delay(3000);
                    await roleMsg.delete();
                }
            } catch (error) {
                return ownerRoles;
            }
        } while (true);
    }
}

class ProjectRequiredInformation {
    name: string;

    constructor() {
        this.name = "";
    }
}