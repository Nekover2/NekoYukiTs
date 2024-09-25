import { ActionRowBuilder, ComponentType, EmbedBuilder, Interaction, StringSelectMenuBuilder } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import ManageMemberPermissionRequest from "../requests/ManageMemberPermissionRequest";
import Member from "../base/NekoYuki/entities/Member";
import Permission from "../base/NekoYuki/enums/Permission";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export default class ManageMemberPermissionHandler implements IMediatorHandle<ManageMemberPermissionRequest> {
    name: string;
    constructor() {
        this.name = "ManageMemberPermission";
    }

    async handle(value: ManageMemberPermissionRequest): Promise<any> {
        try {
            const permissionDashboardMessage = await value.data.channel.send("Permission Dashboard is loading...");
            do {
                const currMember = await value.data.client.dataSources.getRepository(Member).findOne({
                    where: { discordId: value.data.author.id }
                });
                if (!currMember)
                    throw new CustomError("Author is not a member", ErrorCode.UserCannotBeFound, this.name);

                let permissionString = currMember.permissionString().map((p) => p).join(", ");
                if (permissionString.length === 0) {
                    permissionString = "No permission";
                }
                const permissionDashboardEmbed = new EmbedBuilder()
                    .setTitle(`Permission Dashboard for ${value.data.member.displayName}`)
                    .setDescription("This is a permission dashboard for the member you selected, you can manage their permissions here. You can change their permissions by picking permissions input below. Note that, pick an existing permission will remove it, and pick a non-existing permission will add it.")
                    .setColor("Random")
                    .setAuthor({ name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL() })
                    .setFooter({ text: "NekoYuki's manager" })
                    .setTimestamp()
                    .addFields({ name: "Current permissions", value: permissionString });

                const permissionLabel = Object.keys(Permission).filter((p) => isNaN(Number(p)));
                const permissionValue = Object.values(Permission).filter((p) => !isNaN(Number(p)));

                const permissionSelect = new StringSelectMenuBuilder()
                    .setCustomId("permissionSelect")
                    .setPlaceholder("Select a permission")
                    .addOptions(permissionLabel.map((label, index) => {
                        return {
                            label: label,
                            value: permissionValue[index].toString(),
                        }
                    }));

                const permissionSelectRow = new ActionRowBuilder().addComponents(permissionSelect);

                let permissionSelectInteractionGlobal;
                // @ts-ignore
                await permissionDashboardMessage.edit({ content: "", embeds: [permissionDashboardEmbed], components: [permissionSelectRow] });
                try {
                    const filter = (interaction: Interaction) => interaction.user.id === value.data.author.id;
                    const permissionSelectInteraction = await value.data.channel.awaitMessageComponent({ filter, componentType: ComponentType.StringSelect, time: 60000 });
                    const selectedPermission = permissionSelectInteraction.values[0];
                    const permission = parseInt(selectedPermission);
                    if (currMember.hasPermission(permission)) {
                        await permissionSelectInteraction.reply({ content: `Permission will be removed: ${permissionLabel[permissionValue.indexOf(permission)]}`, ephemeral: true });
                        currMember.removePermission(permission);
                    } else {
                        await permissionSelectInteraction.reply({ content: `Permission will be added: ${permissionLabel[permissionValue.indexOf(permission)]}`, ephemeral: true });
                        currMember.addPermission(permission);
                    }
                    permissionSelectInteractionGlobal = permissionSelectInteraction;
                } catch (error) {
                    throw new CustomError("Failed to manage member permission due to inactive", ErrorCode.TimeOut, "Manage Member Permission");
                } finally {
                    await permissionDashboardMessage.edit({ content: "", embeds: [permissionDashboardEmbed], components: [] });
                }
                await permissionSelectInteractionGlobal.deleteReply();
                try {
                    await value.data.client.dataSources.getRepository(Member).save(currMember);
                } catch (error) {
                    throw new CustomError("Failed to save member to the database", ErrorCode.InternalServerError, "Manage Member Permission");
                }
                const sucessEmbed = new EmbedBuilder()
                    .setTitle("Success")
                    .setDescription("Permission has been updated successfully")
                    .setColor("Green")
                    .setTimestamp()
                    .setFooter({ text: "NekoYuki's manager" });
                const successMsg = await value.data.channel.send({ embeds: [sucessEmbed] });
                await delay(3000);
                if (successMsg.deletable) {
                    await successMsg.delete();
                }
            } while (true);
        } catch (error) {
            console.error(error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Unknown error ocurred", ErrorCode.InternalServerError, this.name);
        }
    }

}