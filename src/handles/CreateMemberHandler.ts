import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import Member from "../base/NekoYuki/entities/Member";
import CreateMemberRequest from "../requests/CreateMemberRequest";
import ErrorCode from "../base/enums/ErrorCode";
import CustomError from "../base/classes/CustomError";
import Permission from "../base/NekoYuki/enums/Permission";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
export default class CreateMemberHandler implements IMediatorHandle<CreateMemberRequest> {
    name: string;
    ableToNavigate: boolean;
    constructor() {
        this.name = "CreateMember";
        this.ableToNavigate = true;
    }

    async checkPermissions(value: CreateMemberRequest) : Promise<boolean> {
        if(!value.data.authorMember){
            throw new CustomError("Author is not a member", ErrorCode.UserCannotBeFound, "Create Member");
        }
        if(!value.data.authorMember.hasPermission(Permission.ManageMember)) {
            throw new CustomError("Author does not have permission to manage members", ErrorCode.Forbidden, "Create Member");
        }
        const existingMember = await value.data.client.dataSources.getRepository(Member).findOne({ where: { discordId: value.data.targetUser.id} });
        if(existingMember) {
            throw new CustomError("Member is already registered", ErrorCode.UserAlreadyExists, "Create Member");
        }
        return true;
    }
    async handle(value: CreateMemberRequest): Promise<Member> {
        try {
            //await this.checkPermissions(value);

            const newMember = new Member();
            newMember.discordId = value.data.targetUser.id;
            let infoBtnInteraction : ButtonInteraction = await this.sendInfo(value);
            
            const gmail = await this.getInformation(infoBtnInteraction as ButtonInteraction);
            newMember.gmail = gmail as string;

            const createMemberStatusEmbed = new EmbedBuilder()
                .setTitle(`Registering member ${value.data.targetUser.displayName}`)
                .setAuthor({ name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL() })
                .setDescription("***Step 1:*** Adding member to the database...")
                .setColor("Random")
                .setFooter({ text: "NekoYuki's manager" })
                .setTimestamp();
            await infoBtnInteraction.editReply({ embeds: [createMemberStatusEmbed] });
            await this.saveToDatabase(value, newMember);
            createMemberStatusEmbed.setDescription(`***Step 1:*** Adding member to the database... Done\n***Added member to the database***`);
            await infoBtnInteraction.editReply({ content: "", embeds: [createMemberStatusEmbed], components:[] });
            await delay(5000);
            await infoBtnInteraction.deleteReply();
            return newMember;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            } else {
                throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Create Member", error as Error);
            }
        }

    }

    async sendInfo(value: CreateMemberRequest): Promise<ButtonInteraction> {
        const infoEmbed = new EmbedBuilder()
            .setTitle(`You are registering member ${value.data.targetUser.displayName}`)
            .setAuthor({ name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL() })
            .setColor("Random")
            .setFooter({ text: "NekoYuki's manager" })
            .setTimestamp()
            .setDescription(`Before registering the member, please make sure you have the following information:`)
            .addFields([
                { name: "Gmail", value: "Member's gmail, required for additional features" }
            ]);

        const infoAcceptBtn = new ButtonBuilder()
            .setCustomId("info-accept")
            .setStyle(ButtonStyle.Success)
            .setLabel("Accept");
        const infoDeclineBtn = new ButtonBuilder()
            .setCustomId("info-decline")
            .setStyle(ButtonStyle.Danger)
            .setLabel("Decline");

        const infoRow = new ActionRowBuilder()
            .addComponents([infoAcceptBtn, infoDeclineBtn]);

        //@ts-ignore
        const infoMessage = await value.data.channel.send({ embeds: [infoEmbed], components: [infoRow] });

        try {
            const infoInteraction = await infoMessage.awaitMessageComponent({ filter: (interaction) => interaction.user.id === value.data.author.id, time: 30000 });
            if (infoInteraction.customId === "info-decline") {
                await infoMessage.delete();
                throw new CustomError("User declined", ErrorCode.UserCancelled, "Create Member");
            }
            return infoInteraction as ButtonInteraction;
        } catch (error) {
            throw new CustomError("Cancelled create member request due to timeout", ErrorCode.UserCancelled, "Create Member", error as Error);
        }
    }

    async getInformation(interaction: ButtonInteraction): Promise<string> {
        const getInfoModal = new ModalBuilder()
            .setCustomId("get-info-modal")
            .setTitle("Please Enter Member Information");

        const gmailInput = new TextInputBuilder()
            .setCustomId("gmail-input")
            .setPlaceholder("Gmail only. Example: a@gmail.com")
            .setLabel("Gmail")
            .setMaxLength(32)
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

        const getInfoRow = new ActionRowBuilder()
            .addComponents(gmailInput);

        //@ts-ignore
        getInfoModal.addComponents(getInfoRow);

        await interaction.showModal(getInfoModal);
        try {
            const infoModalInteraction = await interaction.awaitModalSubmit({ filter: (interaction) => interaction.user.id === interaction.user.id, time: 30000 });
            await infoModalInteraction.reply({ content: "Information received, processing data...", ephemeral: true });
            await delay(2000);
            await infoModalInteraction.deleteReply();
            return infoModalInteraction.fields.getTextInputValue("gmail-input");
        } catch (error) {
            throw new CustomError("Cancelled create member request due to timeout", ErrorCode.UserCancelled, "Create Member", error as Error);
        }
    }

    async assignRoles(value: CreateMemberRequest) {
        // TODO: Assign needed role to member.
    }

    async saveToDatabase(value: CreateMemberRequest, member: Member) {
        try {
            await value.data.client.dataSources.getRepository(Member).save(member);
        } catch (error) {
            throw new CustomError("Failed to save member to database", ErrorCode.DatabaseCreateError, "Create Member", error as Error);
        }
    }

}