import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder, Message, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import Project from "../base/NekoYuki/entities/Project";
import Permission from "../base/NekoYuki/enums/Permission";
import CreateChapterRequest from "../requests/CreateChapterRequest";
import IProject from "../base/NekoYuki/interfaces/IProject";
import Chapter from "../base/NekoYuki/entities/Chapter";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
export default class CreateChapterHandler implements IMediatorHandle<CreateChapterRequest> {
    name: string;
    ableToNavigate: boolean;
    constructor() {
        this.name = "CreateChapter";
        this.ableToNavigate = false;
    }
    async handle(value: CreateChapterRequest): Promise<any> {
        const sentMsgs: Array<Message> = [];
        try {
            // STEP 1: Check if author has permissions
            let permissionFlag = true;
            const currProject = await value.data.client.dataSources.getRepository(Project).findOne({
                where: { id: value.data.project.id },
                relations: ["members"]
            });
            if (!currProject) throw new CustomError("Project not found", ErrorCode.BadRequest, "Create Chapter");
            const memberPosition = currProject.members.find(member => member.member.discordId === value.data.author.discordId);
            if (memberPosition?.hasPermission(Permission.UpdateProject)) permissionFlag = true;
            if (value.data.author.hasPermission(Permission.MangeProject)) permissionFlag = true;
            if (!permissionFlag) throw new CustomError("You do not have permission to create a chapter", ErrorCode.Forbidden, "Create Chapter");

            // STEP 2: Create a chapter
            const infoInteraction = await this.preSetup(value, currProject, sentMsgs);
            if (!infoInteraction) return;
            const chapterInfo = await this.getChapterInfo(infoInteraction, sentMsgs);
            if (!chapterInfo) return;
            const newChapter = await this.saveChapter(value, currProject, chapterInfo);
            value.data.client.nekoYukiEvent.emit("ChapterCreated", newChapter);
            return;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Create Chapter", error as Error);
        } finally {
            sentMsgs.forEach(async msg => {
                await msg.delete();
            });
        }
    }
    async preSetup(value: CreateChapterRequest, project: IProject, sentMsgs: Array<Message>): Promise<ButtonInteraction | undefined> {
        try {
            const infoEmbed = new EmbedBuilder()
                .setTitle("Before we start...")
                .setDescription(`You are about to create a chapter for the project **${project.name}**. Please provide the following information to continue. if you're ready, click the **Start** button below.`)
                .addFields([
                    { name: "Chapter Name", value: "The name of the chapter" },
                ])
                .setColor("Aqua")
                .setFooter({ text: "NekoYuki's manager" })
                .setTimestamp();
            const acceptBtn = new ButtonBuilder()
                .setCustomId("accept")
                .setLabel("Start")
                .setStyle(ButtonStyle.Success);
            const cancelBtn = new ButtonBuilder()
                .setCustomId("cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder()
                .addComponents(acceptBtn, cancelBtn);

            // @ts-ignore
            const infoMsg = await value.data.channel.send({ embeds: [infoEmbed], components: [actionRow] });
            sentMsgs.push(infoMsg);
            try {
                const infoMessageInteraction = await infoMsg.awaitMessageComponent({ filter: i => i.user.id === value.data.author.discordId, time: 60000, componentType: ComponentType.Button });
                infoMsg.delete();
                sentMsgs.pop();
                if (infoMessageInteraction.customId === "cancel") {
                    await infoMessageInteraction.update({ content: "Cancelled", components: [] });
                    return undefined;
                }
                return infoMessageInteraction;
            } catch (error) {
                if (error instanceof CustomError) {
                    throw error;
                }
                throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Create Chapter", error as Error);
            }
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Create Chapter", error as Error);
        }
    }

    async getChapterInfo(interaction: ButtonInteraction, sentMsgs: Array<Message>): Promise<CreateChapterOptions> {
        try {
            const getInfoModal = new ModalBuilder()
                .setCustomId("get-info-modal")
                .setTitle("Chapter Information");
            const chapterNameInput = new TextInputBuilder()
                .setCustomId("chapter-name")
                .setPlaceholder("Chapter Name")
                .setLabel("Chapter Name")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            const chapterLinkInput = new TextInputBuilder()
                .setCustomId("chapter-link") 
                .setPlaceholder("Chapter Link")
                .setLabel("Chapter Link")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            const chapterNameRow = new ActionRowBuilder().addComponents(chapterNameInput);
            const chapterLinkRow = new ActionRowBuilder().addComponents(chapterLinkInput);
            // @ts-ignore
            getInfoModal.addComponents(chapterNameRow, chapterLinkRow);
            await interaction.showModal(getInfoModal);

            try {
                let modalResponse = await interaction.awaitModalSubmit({ time: 60000 });
                let chapterName = modalResponse.fields.getTextInputValue("chapter-name");
                const chapterLink = modalResponse.fields.getTextInputValue("chapter-link");
                await modalResponse.reply(`- Chapter name: ${chapterName}\n- Chapter link: ${chapterLink}\n Creating chapter, please wait...`);
                await delay(2000);
                modalResponse.deleteReply();
                return new CreateChapterOptions(chapterName, chapterLink);
            } catch (error) {
                if (error instanceof CustomError) {
                    throw error;
                }
                throw new CustomError("Time out", ErrorCode.UserCancelled, "Create Chapter", error as Error);
            }
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Create Chapter", error as Error);
        }
    }

    async saveChapter(value: CreateChapterRequest, project: IProject, chapterInfo: CreateChapterOptions): Promise<Chapter> {
        try {
            const newChapter = new Chapter();
            newChapter.title = chapterInfo.name;
            newChapter.link = chapterInfo.link;
            newChapter.project = project;
            newChapter.verified = false;
            newChapter.creationDate = new Date();
            const progressEmbed = new EmbedBuilder()
                .setTitle("Creating Chapter")
                .setColor("Orange")
                .setTimestamp()
                .setFooter({ text: "NekoYuki's manager" })
                .setDescription("Saving chapter to database...")
                .addFields([
                    { name: "Chapter Name", value: chapterInfo.name },
                    { name: "Chapter Link", value: chapterInfo.link },
                    { name: "Project Name", value: project.name },
                    { name: "Creation Date", value: newChapter.creationDate.toDateString() },
                    { name: "Verified", value: newChapter.verified.toString() }
                ]);
            const progressMsg = await value.data.channel.send({ embeds: [progressEmbed] });
            delay(3000);
            const savedChapter = await value.data.client.dataSources.getRepository(Chapter).findOne({
                where: { title: newChapter.title, link: newChapter.link}
            });
            if (savedChapter) {
                progressEmbed
                    .setColor("Red")
                    .setDescription("Chapter already exists, returning...");
                await progressMsg.edit({ embeds: [progressEmbed] });
                await delay(2000);
                progressMsg.delete();
                return savedChapter;
            }
            await value.data.client.dataSources.getRepository(Chapter).save(newChapter);
            progressEmbed
                .setColor("Green")
                .setDescription("Chapter saved successfully! returning...");
            await progressMsg.edit({ embeds: [progressEmbed] });
            await delay(2000);
            progressMsg.delete();
            
            const savedChapter2 = await value.data.client.dataSources.getRepository(Chapter).findOne({
                where: { title: newChapter.title, link: newChapter.link},
                relations: ["project"]
            });
            if (!savedChapter2) throw new CustomError("Cannot find chapter in database", ErrorCode.InternalServerError, "Create Chapter");
            return newChapter;
        } catch (error) {
            throw new CustomError("Cannot save chapter to database, please try again later...", ErrorCode.InternalServerError, "Create Chapter", error as Error);
        }
    }
}

class CreateChapterOptions {
    name: string;
    link: string;
    constructor(name: string, link: string) {
        this.name = name;
        this.link = link; 
    }
}