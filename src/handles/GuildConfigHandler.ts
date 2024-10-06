import { ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, EmbedBuilder, Interaction } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import GuildConfigRequest from "../requests/GuildConfigRequest";
import { ActionRowBuilder, StringSelectMenuBuilder } from "@discordjs/builders";
import GuildConfig from "../base/NekoYuki/entities/GuildConfig";

export default class GuildConfigHandler implements IMediatorHandle<GuildConfigRequest> {
    name: string = "GuildConfig";
    ableToNavigate: boolean = false;

    async validatePermissions(value: GuildConfigRequest): Promise<boolean> {
        if (value.data.author.id !== value.data.channel.guild.ownerId) throw new CustomError("You do not have permission to view this information", ErrorCode.Forbidden, "Guild Config", new Error("User is not the guild owner"));
        return true;
    }

    async handle(value: GuildConfigRequest): Promise<any> {
        try {
            let mainFlag = false;
            await this.validatePermissions(value);
            do {
                let guildConfig = await value.data.client.dataSources.getRepository(GuildConfig).findOne({
                    where: {
                        guildId: value.data.channel.guild.id
                    }
                });
                if (!guildConfig) {
                    const newGuildConfig = new GuildConfig();
                    newGuildConfig.guildId = value.data.channel.guild.id;
                    await value.data.client.dataSources.getRepository(GuildConfig).save(newGuildConfig);
                    guildConfig = newGuildConfig;
                }
                let guildConfigInfoString = `***Guild Configuration for ${value.data.channel.guild.name}:***\n`;
                guildConfigInfoString += `- Root Novel Channel: <#${guildConfig.rootNovelChannelId}>\n`;
                guildConfigInfoString += `- Root Manga Channel: <#${guildConfig.rootMangaChannelId}>\n`;
                guildConfigInfoString += `- Root OLN Channel: <#${guildConfig.rootOLNChannelId}>\n`;

                const guildConfigInfoEmbed = new EmbedBuilder()
                    .setTitle("Guild Configuration")
                    .setDescription(guildConfigInfoString)
                    .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                    .setColor("DarkRed")
                    .setTimestamp();
                const selectPropertyComponent = new StringSelectMenuBuilder()
                    .setCustomId("guild_config_change_property")
                    .setPlaceholder("Select the property to change")
                    .addOptions([
                        { label: "Novel", value: "novel" },
                        { label: "Manga", value: "manga" },
                        { label: "OLN", value: "oln" }
                    ]);

                // @ts-ignore
                const mainMsg = await value.data.channel.send({ embeds: [guildConfigInfoEmbed], components: [new ActionRowBuilder().addComponents(selectPropertyComponent)] });
                let selectResult = "";
                try {
                    const filter = (interaction: Interaction) => { return interaction.user.id === value.data.author.id; }
                    const choosePropertyInteraction = await mainMsg.awaitMessageComponent({ filter, time: 60000 });
                    mainMsg.delete();
                    if (choosePropertyInteraction.isStringSelectMenu()) selectResult = choosePropertyInteraction.values[0];
                } catch (error) {
                    mainMsg.edit({ components: [] });
                    return;
                }
                if (selectResult === "novel" || selectResult === "manga" || selectResult === "oln") {
                    mainFlag = await this.changeProperty(value, guildConfig, selectResult);
                }
            } while (mainFlag);
        } catch (error) {
            console.log(error);
            if (error instanceof CustomError) throw error;
            throw new CustomError("An error occurred while changing guild options", ErrorCode.InternalServerError, "Guild Config", error as Error);
        }
    }


    async changeProperty(value: GuildConfigRequest, guildConfig: GuildConfig, property: string): Promise<boolean> {
        try {
            const infoEmbed = new EmbedBuilder()
                .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                .setColor("Blue")
                .setTitle("You're changing the guild configuration of property: " + property)
                .setDescription("Please pick the channel you want to set as the root channel for this property. You can also type `cancel` to cancel this operation. This property is use for creating new post channels for novels, manga, and OLN.")
                .setFooter({ text: "This operation will expires in 5 minutes." })
                .setTimestamp();
            const chooseChannelComponent = new ChannelSelectMenuBuilder()
                .setCustomId("guild_config_change_channel")
                .setChannelTypes(ChannelType.GuildForum)
                .setPlaceholder("Select the forum channel")
                .setMinValues(1)
                .setMaxValues(1);
            const cancelBtn = new ButtonBuilder()
                .setCustomId("guild_config_cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger);
            const selectRow = new ActionRowBuilder()
                .addComponents(chooseChannelComponent)
            const cancelRow = new ActionRowBuilder()
                .addComponents(cancelBtn);

            //@ts-ignore
            const message = await value.data.channel.send({ embeds: [infoEmbed], components: [selectRow, cancelRow] });
            let targetChannelId = "";
            try {
                const filter = (interaction: Interaction) => { return interaction.user.id === value.data.author.id; }
                const chooseChannelInteraction = await message.awaitMessageComponent({ filter, time: 300000 });
                message.delete();
                if (chooseChannelInteraction.customId === "guild_config_cancel") {
                    return true;
                }
                if (chooseChannelInteraction.isChannelSelectMenu()) {
                    targetChannelId = chooseChannelInteraction.channels.first()?.id || "";
                }
            } catch (error) {
                message.edit({ components: [] });
            }

            if (targetChannelId === "") {
                throw new CustomError("You did not select a channel. Operation cancelled.", ErrorCode.BadRequest, "Guild Config", new Error("No channel selected"));
            }
            if (property === "novel") {
                guildConfig.rootNovelChannelId = targetChannelId;
            } else if (property === "manga") {
                guildConfig.rootMangaChannelId = targetChannelId;
            } else if (property === "oln") {
                guildConfig.rootOLNChannelId = targetChannelId;
            }
            await value.data.client.dataSources.getRepository(GuildConfig).save(guildConfig);
            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: value.data.author.username, iconURL: value.data.author.displayAvatarURL() })
                .setColor("Green")
                .setTitle("Guild Configuration Changed")
                .setDescription("The guild configuration has been changed successfully.")
                .setTimestamp();
            let sucessMsg = await value.data.channel.send({ embeds: [successEmbed] });
            const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
            await delay(5000);
            sucessMsg.delete();
            return true;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("An error occurred while changing guild options", ErrorCode.InternalServerError, "Guild Config", error as Error);
        }
    }
}