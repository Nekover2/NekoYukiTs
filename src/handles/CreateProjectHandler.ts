import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder, Interaction, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import Member from "../base/NekoYuki/entities/Member";
import Permission from "../base/NekoYuki/enums/Permission";
import CreateProjectRequest from "../requests/CreateProjectRequest";
import Project from "../base/NekoYuki/entities/Project";

export default class CreateProjectHandler implements IMediatorHandle<CreateProjectRequest> {
    name: string;
    constructor() {
        this.name = "CreateProject";
    }
    async handle(value: CreateProjectRequest): Promise<any> {
        try {
            const authorMember = await value.data.client.dataSources.getRepository(Member).findOne({
                where: { discordId: value.data.author.id }
            });

            if (!authorMember)
                throw new CustomError("You haven't registered yet", ErrorCode.UserCannotBeFound, "Create Project");
            if (!authorMember.hasPermission(Permission.CreateProject))
                throw new CustomError("You don't have permission to create a project", ErrorCode.Forbidden, "Create Project");

            // Step 2: send prompt to get project information
            const infoInteraction = await this.sendInfo(value);
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

            const newProject = new Project();
            newProject.name = projectName;

            // Step 5: save to database
            
            // Step 4: send prompt to get project information
        } catch (error) {
            console.log(error);

            if (error instanceof CustomError) {
                return value.data.channel.send({ content: error.message });
            }
            return value.data.channel.send({ content: "An error occurred while processing your request. Please try again later." });
        }
    }

    async sendInfo(value: CreateProjectRequest): Promise<ButtonInteraction> {
        const projectInfoEmbed = new EmbedBuilder()
            .setTitle("Project Information")
            .setDescription("Please provide the information of the project you want to create. When you accept, we need you to provide some important information of the project. When you're ready, click the accept button.")
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

        // Step 3: wait for user to accept or cancel
        try {
            const filter = (interaction: Interaction) => { return interaction.user.id === value.data.author.id; };
            const infoInteraction = await infoMessage.awaitMessageComponent({ filter, time: 60000, componentType: ComponentType.Button });
            if (!infoInteraction) {
                throw new CustomError("Create project request cancelled", ErrorCode.TimeOut, "Create Project");
            }
            if (infoInteraction.customId === "cancel") {
                throw new CustomError("Create project request cancelled", ErrorCode.UserCancelled, "Create Project");
            }
            return infoInteraction as ButtonInteraction;
        } catch (error) {
            throw new CustomError("Create project request cancelled", ErrorCode.TimeOut, "Create Project");
        }
    }
}