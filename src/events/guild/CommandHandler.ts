import { ChatInputCommandInteraction, Collection, EmbedBuilder, Events, TextChannel } from "discord.js";
import CustomClient from "../../base/classes/CustomClient";
import Event from "../../base/classes/Event";
import ICommand from "../../base/interfaces/ICommand";
import CustomError from "../../base/classes/CustomError";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export default class CommandHandler extends Event {

    constructor(client: CustomClient) {
        super(client, {
            name: Events.InteractionCreate,
            description: "Command Handler",
            once: false
        })
    }
    async Execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.isChatInputCommand()) return;
        const command: ICommand = this.client.commands.get(interaction.commandName)!;

        if (!command) return await interaction.reply({ content: "Command not found", ephemeral: true }) && this.client.commands.delete(interaction.commandName);

        const { cooldowns } = this.client;

        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.name)!;
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                const timeLeftEmbed = new EmbedBuilder()

                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`❌ Please wait ${timeLeft.toFixed(1)} more seconds before reusing the \`${command.name}\` command`)
                            .setTimestamp()
                    ], ephemeral: true
                });
            }
        }
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        try {
            const subCommandGroup = interaction.options.getSubcommandGroup(false);
            const subCommand = `${interaction.commandName}${subCommandGroup ? `.${subCommandGroup}` : ""}.${interaction.options.getSubcommand(false)}`;
            await interaction.deferReply({ ephemeral: true });
            interaction.deleteReply();
            while (true)
                await this.client.subCommands.get(subCommand)?.Execute(interaction) || await command.Execute(interaction);
        } catch (error) {
            console.error(error);
            if (error instanceof CustomError) {
                const currentChannel = interaction.channel as TextChannel;
                const errorEmbed = new EmbedBuilder()
                    .setTimestamp()
                    .setColor("Red")
                    .setFooter({ text: "Execute command failed." })
                    .setTitle(`An error orcurred when processing ${error.origin}`)
                    .setDescription(`Info: ${error.message}, code: ${error.errorCode}`)
                const errMsg = await currentChannel.send({ embeds: [errorEmbed] });
                // delay 5s
                await delay(5000);
                if (errMsg.deletable) {
                    await errMsg.delete();
                }
                return;
            }
            if (!interaction.channel) return;
            const errorEmbed = new EmbedBuilder()
                .setTimestamp()
                .setColor("Red")
                .setFooter({ text: "Execute command failed." })
                .setTitle(`An unknown error orcurred`)
                .setDescription(`Info: ${error}`)
            const currChannel = interaction.channel as TextChannel;
            const errorEmbed1 = await currChannel.send({ embeds: [errorEmbed] });
            await delay(5000);
            if (errorEmbed1.deletable) {
                await errorEmbed1.delete();
            }
            return;
        }
    }

}