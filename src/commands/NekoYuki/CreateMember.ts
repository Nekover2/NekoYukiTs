import { ActionRowBuilder, Application, ApplicationCommandOptionType, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, ModalBuilder, PermissionsBitField, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import CreateMemberRequest from "../../requests/CreateMemberRequest";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export default class CreateMember extends Command {
    constructor(client: CustomClient) {
        super(client, {
            name: "register-member",
            description: "Register a member to the database",
            category: Category.NekoYuki,
            options: [{
                name: "member",
                description: "The member to register",
                type: ApplicationCommandOptionType.User,
                required: true
            }],
            defaultMemberPermissions: PermissionsBitField.Flags.UseApplicationCommands,
            dmPermissions: false,
            cooldown: 0,
            guildId: "-1"
        });
    }

    async Execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true });
        await interaction.deleteReply();
        // TODO check member permissions

        // TODO check if member is already registered

        // TODO register member
        try {
            const infoEmbed = new EmbedBuilder()
                .setTitle(`You are registering member ${interaction.options.getUser("member")?.displayName}`)
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
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
            const currentChannel = interaction.channel as TextChannel;
            //@ts-ignore
            const infoMessage = await currentChannel.send({ embeds: [infoEmbed], components: [infoRow] });
            const filterInfo = (i: any) => i.customId === "info-accept" || i.customId === "info-decline" && i.user.id === interaction.user.id;
            const infoResponse = await infoMessage.awaitMessageComponent({ filter: filterInfo, time: 60000 });
            if (infoResponse.customId === "info-decline") {
                await infoResponse.update({ content: "Member registration declined", components: [] });
                return;
            }
    
            if (infoMessage.deletable)
                await infoMessage.delete();
    
            const getInfoModal = new ModalBuilder()
                .setCustomId("get-info-modal")
                .setTitle("Enter member information");
    
            const gmailInput = new TextInputBuilder()
                .setLabel("Gmail")
                .setCustomId("gmail-input")
                .setPlaceholder("Member's gmail")
                .setRequired(true)
                .setStyle(TextInputStyle.Short);
    
            const getInfoRow = new ActionRowBuilder()
                .addComponents([gmailInput]);
    
            //@ts-ignore
            getInfoModal.addComponents([getInfoRow]);
    
            const infoModelRequest = await infoResponse.showModal(getInfoModal);
    
            const filterInfoModal = (i: any) => i.customId === "get-info-modal" && i.user.id === interaction.user.id;
    
            const infoModalResponse = await interaction.awaitModalSubmit({ filter: filterInfoModal, time: 60000 });
            const gmail = infoModalResponse.fields.getTextInputValue("gmail-input");
            await infoModalResponse.reply({ content: `Member's gmail: ${gmail}, please wait...`, components: [] });
            //@ts-ignore
            const createMemberRequest = new CreateMemberRequest( this.client, interaction.options.getUser("member")?.id, gmail);
            await this.client.mediator.send(createMemberRequest); 
        } catch (error) {
            console.error(error);
        }

    }
}