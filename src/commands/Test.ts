import { ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import Command from "../base/classes/Command";
import CustomClient from "../base/classes/CustomClient";
import Category from "../base/enums/Category";

export default class Test extends Command {
    constructor(client : CustomClient) {
        super(client,{
            name: "test",
            description: "Test command",
            category: Category.Utilities,
            defaultMemberPermissions: PermissionsBitField.Flags.UseApplicationCommands,
            dmPermissions: false,
            cooldown: 1,
            options: [],
            guildId: "-1",
        });
    }

    Execute(interaction: ChatInputCommandInteraction): void {
        interaction.reply("Test command executed");
    }
}