import { ActionRowBuilder, Application, ApplicationCommandOptionType, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, ModalBuilder, PermissionsBitField, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import CreateMemberRequest from "../../requests/CreateMemberRequest";
import Error from "../../base/classes/Error";

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
            //@ts-ignore
            const createMemberRequest = new CreateMemberRequest(this.client, interaction.channel as TextChannel, interaction.options.getUser("member"), interaction.user);
            const result = await this.client.mediator.send(createMemberRequest); 
            if(result instanceof Error) {
                const currChannel = interaction.channel as TextChannel;
                const errorEmbed = new EmbedBuilder()
                    .setTitle("Something went wrong")
                    .setDescription(result.message + `. ErrorCode: ${result.code}`)
                    .setColor("Red");
                const errMsg = await currChannel.send({ embeds: [errorEmbed] });
                await delay(5000);
                if(errMsg.deletable) {
                    await errMsg.delete();
                }
            }
        } catch (error : any) {
            const currChannel = interaction.channel as TextChannel;
            const errorEmbed = new EmbedBuilder()
                .setTitle("Something went wrong")
                .setDescription(error.message)
                .setColor("Red");
            const errMsg = await currChannel.send({ embeds: [errorEmbed] });
            await delay(5000);
            if(errMsg.deletable) {
                await errMsg.delete();
            }
        }   

    }
}