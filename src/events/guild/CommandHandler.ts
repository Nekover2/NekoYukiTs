import { ChatInputCommandInteraction, Collection, EmbedBuilder, Events } from "discord.js";
import CustomClient from "../../base/classes/CustomClient";
import Event from "../../base/classes/Event";
import ICommand from "../../base/interfaces/ICommand";



export default class CommandHandler extends Event {

    constructor(client : CustomClient){
        super(client, {
            name: Events.InteractionCreate,
            description: "Command Handler",
            once: false
        })
    }
    async Execute(interaction : ChatInputCommandInteraction) {
        if(!interaction.isChatInputCommand()) return;
        const command : ICommand = this.client.commands.get(interaction.commandName)!;
        
        if(!command) return await interaction.reply({content: "Command not found", ephemeral: true}) && this.client.commands.delete(interaction.commandName);

        const { cooldowns } = this.client;

        if(!cooldowns.has(command.name)){
            cooldowns.set(command.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.name)!;
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if(timestamps.has(interaction.user.id)){
            const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;
            if(now < expirationTime){
                const timeLeft = (expirationTime - now) / 1000;
                const timeLeftEmbed = new EmbedBuilder()
                    
                return await interaction.reply({embeds : [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(`❌ Please wait ${timeLeft.toFixed(1)} more seconds before reusing the \`${command.name}\` command`)
                        .setTimestamp()
                ], ephemeral: true});
            }
        }
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        try {
            const subCommandGroup = interaction.options.getSubcommandGroup(false);
            const subCommand = `${interaction.commandName}${subCommandGroup ?`.${subCommandGroup}` : ""}.${interaction.options.getSubcommand(false)}`;

            return this.client.subCommands.get(subCommand)?.Execute(interaction) || command.Execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({content: "There was an error while executing this command!", ephemeral: true});
        }
    }

}