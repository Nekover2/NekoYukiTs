import { Collection, Events, REST, Routes } from "discord.js";
import CustomClient from "../../base/classes/CustomClient";
import Event from "../../base/classes/Event";
import ICommand from "../../base/interfaces/ICommand";

export default class Ready extends Event {
    constructor(client: CustomClient) {
        super(client, {
            name: Events.ClientReady,
            description: "Ready event",
            once: true
        });
    }

    async Execute() {
        console.log(`Logged in as ${this.client.user?.tag}`);

        const commands: object[] = this.GetGlobalCommandJson(this.client.commands)

        const rest = new REST().setToken(this.client.config.token);

        const globalCommands: object[] = [];

        const setCommands: any = await rest.put(Routes.applicationCommands(this.client.user?.id!), { body: commands });

        console.log(`[Commands] ${setCommands.length} global commands set`);

        const guildCommands: Collection<string, object[]> = this.GetGuildCommandJson(this.client.commands);

        guildCommands.forEach(async (commands: object[], guildId: string) => {
            const setCommands: any = await rest.put(Routes.applicationGuildCommands(this.client.user?.id!, guildId), { body: commands });
            console.log(`[Commands] ${setCommands.length} guild commands set in ${guildId}`);
        });
        
    }

    private GetGlobalCommandJson(commands: Collection<string, ICommand>): object[] {
        const data: object[] = [];
        commands.forEach((command: ICommand) => {
            if (command.guildId == "-1")
                data.push({
                    name: command.name,
                    description: command.description,
                    options: command.options,
                    default_member_permissions: command.defaultMemberPermissions.toString(),
                    dm_permissions: command.dmPermissions,
                });
        });
        return data;
    }

    private GetGuildCommandJson(commands: Collection<string, ICommand>): Collection<string, object[]> {
        const data: Collection<string, object[]> = new Collection();
        commands.forEach((command: ICommand) => {
            if (command.guildId != "-1") {
                if (!data.has(command.guildId))
                    data.set(command.guildId, []);
                data.get(command.guildId)?.push({
                    name: command.name,
                    description: command.description,
                    options: command.options,
                    default_member_permissions: command.defaultMemberPermissions.toString(),
                    dm_permissions: command.dmPermissions,
                });
            }
        });
        return data;
    }
}