import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder, Interaction, Message, ModalBuilder, StringSelectMenuBuilder, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import Chapter from "../base/NekoYuki/entities/Chapter";
import ViewProjectChapterRequest from "../requests/ViewProjectChapterRequest";
import CreateChapterRequest from "../requests/CreateChapterRequest";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import Permission from "../base/NekoYuki/enums/Permission";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
export default class ViewProjectChapterHandler implements IMediatorHandle<ViewProjectChapterRequest> {
    name: string;
    ableToNavigate: boolean;
    constructor() {
        this.name = "ViewProjectChapter";
        this.ableToNavigate = false;
    }
    async handle(value: ViewProjectChapterRequest): Promise<any> {
        try {
            let returnFlag = false;
            // All defined btns are here
            let navigateLeftBtn = new ButtonBuilder()
                .setCustomId("navigateLeft")
                .setLabel("◀")
                .setStyle(ButtonStyle.Primary);
            let navigateRightBtn = new ButtonBuilder()
                .setCustomId("navigateRight")
                .setLabel("▶")
                .setStyle(ButtonStyle.Primary);
            let createChapterBtn = new ButtonBuilder()
                .setCustomId("createChapter")
                .setLabel("Create chapter")
                .setStyle(ButtonStyle.Success);
            let deleteChapterBtn = new ButtonBuilder()
                .setCustomId("deleteChapter")
                .setLabel("Delete chapter")
                .setStyle(ButtonStyle.Danger);
            let editChapterBtn = new ButtonBuilder()
                .setCustomId("editChapter")
                .setLabel("Edit chapter")
                .setStyle(ButtonStyle.Primary);
            const returnBtn = new ButtonBuilder()
                .setCustomId("returnBtn")
                .setLabel("Return")
                .setStyle(ButtonStyle.Secondary);

            do {
                let editPermission = false;
                if (value.data.project.ownerId === value.data.author.discordId) editPermission = true;
                if (value.data.author.hasPermission(Permission.UpdateProject)) editPermission = true;

                //////////// Step 01: get all chapters of the project ////////////
                const totalChapterCnt = value.data.project.chaptersCount;
                const chapterViewerEmbed = new EmbedBuilder()
                    .setAuthor({ name: value.data.interaction.user.displayName, iconURL: value.data.interaction.user.displayAvatarURL() })
                    .setTitle(`Chapter list of ${value.data.project.name}`)
                    .setDescription(`Total chapters: ${totalChapterCnt}`)
                    .setColor("Aqua")
                    .setTimestamp();

                let notifyBtn = new ButtonBuilder()
                    .setCustomId("notifyBtn")
                    .setDisabled(true)
                    .setLabel(`Total: ${totalChapterCnt}`)
                    .setStyle(ButtonStyle.Primary);

                ////////////// Step 01.2: build needed btns and components ////////////

                let i = 0;
                const currChannel = value.data.interaction.channel as TextChannel;

                if (totalChapterCnt == 0) {
                    chapterViewerEmbed.addFields({ name: "No chapters found", value: "There are no chapters in this project." });
                    const noChapterRow = new ActionRowBuilder();
                    if (editPermission)
                        noChapterRow.addComponents(createChapterBtn)
                    noChapterRow.addComponents(returnBtn);
                    // @ts-ignore
                    const noChapterMsg = await currChannel.send({ embeds: [chapterViewerEmbed], components: [noChapterRow] });
                    const handleResult = await this.handleInteraction(noChapterMsg, value);
                    if (handleResult === true) returnFlag = true;
                    continue;
                }

                let chapterIdReceived = "-1";
                do {
                    const chapters = await value.data.customClient.dataSources.getRepository(Chapter)
                        .createQueryBuilder("chapter")
                        .where("chapter.projectId = :projectId", { projectId: value.data.project.id })
                        .skip(i * 5)
                        .take(5)
                        .getMany();

                    notifyBtn.setLabel(`Page ${i + 1} of ${Math.ceil(totalChapterCnt / 5)}`);
                    chapterViewerEmbed.setFooter({ text: `Record ${i * 5 + 1} - ${i * 5 + chapters.length} of ${totalChapterCnt}` });
                    if (i == 0) {
                        navigateLeftBtn.setDisabled(true);
                    } else {
                        navigateLeftBtn.setDisabled(false);
                    }
                    if (i * 5 + chapters.length >= totalChapterCnt) {
                        navigateRightBtn.setDisabled(true);
                    } else {
                        navigateRightBtn.setDisabled(false);
                    }
                    const chapterSelectOptions = [];
                    for (const chapter of chapters) {
                        chapterViewerEmbed.addFields({ name: chapter.title, value: chapter.link });
                        chapterSelectOptions.push({ label: chapter.title, value: chapter.id.toString() });
                    }
                    const chapterSelect = new StringSelectMenuBuilder()
                        .setCustomId("chapterSelect")
                        .setMaxValues(1)
                        .setPlaceholder("Select a chapter to edit, delete or view")
                        .addOptions(chapterSelectOptions);
                    const chapterSelectRow = new ActionRowBuilder().addComponents([chapterSelect]);
                    const chapterRow = new ActionRowBuilder().addComponents([navigateLeftBtn, notifyBtn, navigateRightBtn, returnBtn]);
                    const contextComponents = [chapterRow];
                    //////////// Step 02: check permission ////////////
                    if (editPermission) contextComponents.push(chapterSelectRow);
                    // @ts-ignore
                    const chapterMsg = await currChannel.send({ embeds: [chapterViewerEmbed], components: contextComponents });
                    try {
                        const filter = (interaction: Interaction) => interaction.user.id === value.data.author.discordId;
                        const viewProjectInteraction = await chapterMsg.awaitMessageComponent({ filter, time: 60000 });
                        chapterMsg.delete();
                        if (viewProjectInteraction.isButton()) {
                            const action = viewProjectInteraction.customId
                            if (action === "navigateLeft") {
                                i = i - 1;
                                if (i < 0) i = 0;
                            } else if (action === "navigateRight") {
                                i = i + 1;
                                if (i * 5 >= totalChapterCnt) {
                                    i = i - 1;
                                }
                            } else if (action === "returnBtn") {
                                return true;
                                break;
                            }
                        }
                        if (viewProjectInteraction.isStringSelectMenu()) {
                            chapterIdReceived = viewProjectInteraction.values[0];
                            break;
                        }
                    } catch (error) {
                        chapterMsg.edit({ components: [] });
                        return false;
                    }
                    await delay(1000);
                } while (true);

                //////////// Step 03: handle the chapter ////////////
                const chapter = await value.data.customClient.dataSources.getRepository(Chapter).findOne({
                    where: { id: parseInt(chapterIdReceived) }
                });

                if (!chapter) {
                    return false;
                }
                const chapterInfoEmbed = new EmbedBuilder()
                    .setAuthor({ name: value.data.interaction.user.displayName, iconURL: value.data.interaction.user.displayAvatarURL() })
                    .setTitle(chapter.title)
                    .setDescription(`Chapter info, you can edit or delete this chapter if you have permission`)
                    .setColor("Aqua")
                    .addFields([
                        { name: "Link", value: chapter.link },
                        { name: "Verified", value: chapter.verified ? "Yes" : "No" },
                        { name: "Creation date", value: chapter.creationDate.toUTCString() }
                    ])
                    .setTimestamp();
                const chapterActionRow = new ActionRowBuilder().addComponents([editChapterBtn, deleteChapterBtn, returnBtn]);
                // @ts-ignore
                const chapterInfoMsg = await currChannel.send({ embeds: [chapterInfoEmbed], components: [chapterActionRow] });
                const userInput = await this.handleInteraction(chapterInfoMsg, value);
                if (!userInput) return false;
                if (userInput === true) {
                    returnFlag = true;
                    continue;
                }
                switch (userInput.customId) {
                    case "editChapter":
                        await this.editChapter(value, chapter, userInput);
                        break;
                    case "deleteChapter":
                        await this.deleteChapter(value, chapter);
                        break;
                    case "return":
                        returnFlag = true;
                        break;
                    default:
                        break;
                }
            } while (returnFlag);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("ViewProjectChapterHandlerError", ErrorCode.InternalServerError, "View project chapter", error as Error);
        }
    }

    async handleInteraction(message: Message, value: ViewProjectChapterRequest): Promise<ButtonInteraction | boolean> {
        try {
            const filter = (interaction: Interaction) => interaction.user.id === value.data.author.discordId;
            const btnInteraction = await message.awaitMessageComponent({ filter, time: 60000, componentType: ComponentType.Button });
            message.delete();
            // TODO: add edit and delete chapter functionality
            switch (btnInteraction.customId) {
                case "createChapter":
                    return await value.data.customClient.mediator.send(new CreateChapterRequest(
                        value.data.customClient,
                        value.data.interaction.channel as TextChannel,
                        value.data.interaction.user,
                        value.data.author,
                        value.data.project
                    ));
                    break;
                case "return":
                    return true;
                default:
                    return btnInteraction;
            }
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("Handle Interaction Error", ErrorCode.InternalServerError, "Handle Interaction", error as Error);
        }
    }

    async editChapter(value: ViewProjectChapterRequest, chapter: Chapter, btnInteraction: ButtonInteraction) {
        try {
            const getInfoModal = new ModalBuilder()
                .setCustomId("get-info-modal")
                .setTitle("Chapter Information");
            const chapterNameInput = new TextInputBuilder()
                .setCustomId("chapter-name")
                .setPlaceholder("Chapter Name")
                .setLabel("Chapter Name")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(chapter.title)
                .setRequired(true);
            const chapterLinkInput = new TextInputBuilder()
                .setCustomId("chapter-link")
                .setPlaceholder("Chapter Link")
                .setLabel("Chapter Link")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(chapter.link)
                .setRequired(true);
            const chapterNameRow = new ActionRowBuilder().addComponents(chapterNameInput);
            const chapterLinkRow = new ActionRowBuilder().addComponents(chapterLinkInput);
            // @ts-ignore
            getInfoModal.addComponents(chapterNameRow, chapterLinkRow);
            await btnInteraction.showModal(getInfoModal);
            try {
                const filter = (interaction: Interaction) => interaction.user.id === value.data.author.discordId;
                let modalResponse = await btnInteraction.awaitModalSubmit({ filter: filter, time: 60000 });
                let chapterName = modalResponse.fields.getTextInputValue("chapter-name");
                const chapterLink = modalResponse.fields.getTextInputValue("chapter-link");
                await modalResponse.reply(`- Chapter name: ${chapterName}\n- Chapter link: ${chapterLink}\n editing chapter, please wait...`);
                await delay(2000);
                modalResponse.deleteReply();
                chapter.title = chapterName;
                chapter.link = chapterLink;
                chapter.verified = false;
                value.data.customClient.nekoYukiEvent.emit("ChapterEdited", chapter);
            } catch (error) {
                if (error instanceof CustomError) {
                    throw error;
                }
                throw new CustomError("Time out", ErrorCode.UserCancelled, "Create Chapter", error as Error);
            }

            await value.data.customClient.dataSources.getRepository(Chapter).save(chapter);
            const statusEmbed = new EmbedBuilder()
                .setAuthor({ name: value.data.interaction.user.displayName, iconURL: value.data.interaction.user.displayAvatarURL() })
                .setTitle("Chapter edited")
                .setDescription("Chapter edited successfully")
                .addFields([
                    { name: "Chapter name", value: chapter.title },
                    { name: "Chapter link", value: chapter.link }
                ])
                .setColor("Aqua")
                .setTimestamp();
            const currChannel = value.data.interaction.channel as TextChannel;
            const statusMsg = await currChannel.send({ embeds: [statusEmbed] });
            // const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
            await delay(5000);
            if (statusMsg.deletable) await statusMsg.delete();
            return;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("Unknown exception when editing the chapter", ErrorCode.InternalServerError, "Edit chapter", error as Error);
        }

    }
    async deleteChapter(value: ViewProjectChapterRequest, chapter: Chapter) {
        try {
            await value.data.customClient.dataSources.getRepository(Chapter).delete({ id: chapter.id });
            const statusEmbed = new EmbedBuilder()
                .setAuthor({ name: value.data.interaction.user.displayName, iconURL: value.data.interaction.user.displayAvatarURL() })
                .setTitle("Chapter deleted")
                .setDescription("Chapter deleted successfully")
                .addFields([
                    { name: "Chapter name", value: chapter.title },
                    { name: "Chapter link", value: chapter.link }
                ])
                .setColor("Aqua")
                .setTimestamp();
            const currChannel = value.data.interaction.channel as TextChannel;
            const statusMsg = await currChannel.send({ embeds: [statusEmbed] });
            await delay(5000);
            if (statusMsg.deletable) await statusMsg.delete();
            return;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("Unknown exception when deleting the chapter", ErrorCode.InternalServerError, "Delete chapter", error as Error);
        }
    }
}