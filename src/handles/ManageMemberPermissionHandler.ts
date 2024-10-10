import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, Interaction, StringSelectMenuBuilder } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import ManageMemberPermissionRequest from "../requests/ManageMemberPermissionRequest";
import Member from "../base/NekoYuki/entities/Member";
import Permission from "../base/NekoYuki/enums/Permission";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export default class ManageMemberPermissionHandler implements IMediatorHandle<ManageMemberPermissionRequest> {
    name: string;
    ableToNavigate: boolean;
    constructor() {
        this.name = "ManageMemberPermission";
        this.ableToNavigate = false;
    }
    async checkPermission(value: ManageMemberPermissionRequest) {
        let hasPermission = false;
        if (value.data.authorMember.hasPermission(Permission.ManageMember)) {
            hasPermission = true;
        }
        if (value.data.author.id == value.data.channel.guild.ownerId) {
            hasPermission = true;
        }
        if (!hasPermission) {
            throw new CustomError("You don't have permission to manage member", ErrorCode.Unauthorized, this.name);
        }
    }
    async handle(value: ManageMemberPermissionRequest): Promise<any> {
        try {
            await this.checkPermission(value);
            do {
                const currMember = await value.data.client.dataSources.getRepository(Member).findOne({
                    where: { discordId: value.data.targetUser?.id }
                });
                if (!currMember)
                    throw new CustomError("Member is not registered", ErrorCode.UserCannotBeFound, this.name);

                let permissionString = currMember.permissionString().map((p) => p).join(", ");
                if (permissionString.length === 0) {
                    permissionString = "No permission";
                }

                const permissionDashboardEmbed = new EmbedBuilder()
                    .setTitle(`Permission Dashboard for ${value.data.targetUser?.username}`)
                    .setDescription("This is a permission dashboard for the member you selected, you can manage their permissions here." +
                        "Note that:\n" + 
                        "- You can change their permissions by picking permissions input select below.\n" + 
                        "- Pick an existing permission will remove it\n" + 
                        "- Pick a non-existing permission will add it.\n" + 
                        "- Permissions will be saved automatically after picking a permission \n")
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

                const returnRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("return")
                        .setLabel("Return")
                        .setStyle(ButtonStyle.Secondary)
                );
                let permissionSelectInteractionGlobal;
                // @ts-ignore
                const permissionDashboardMessage = await value.data.channel.send({ content: "", embeds: [permissionDashboardEmbed], components: [permissionSelectRow, returnRow] });
                try {
                    const filter = (interaction: Interaction) => interaction.user.id === value.data.author.id;
                    const permissionSelectInteraction = await permissionDashboardMessage.awaitMessageComponent({ filter, time: 60000 });
                    permissionDashboardMessage.delete();
                    if(permissionSelectInteraction.isStringSelectMenu()){
                        const selectedPermission = permissionSelectInteraction.values[0];
                        const permission = parseInt(selectedPermission);
                        if (currMember.hasOwnPermission(permission)) {
                            await permissionSelectInteraction.reply({ content: `Permission will be removed: ${permissionLabel[permissionValue.indexOf(permission)]}`, ephemeral: true });
                            currMember.removePermission(permission);
                        } else {
                            await permissionSelectInteraction.reply({ content: `Permission will be added: ${permissionLabel[permissionValue.indexOf(permission)]}`, ephemeral: true });
                            currMember.addPermission(permission);
                        }
                        permissionSelectInteractionGlobal = permissionSelectInteraction;
                    } else if(permissionSelectInteraction.isButton()){
                        if(permissionSelectInteraction.customId === "return"){
                            return true;
                        }
                    }
                } catch (error) {
                    console.log(error);
                    permissionDashboardMessage.edit({ components: []});
                    return false;
                }
                try {
                    await value.data.client.dataSources.getRepository(Member).save(currMember);
                } catch (error) {
                    throw new CustomError("Failed to save member to the database", ErrorCode.InternalServerError, "Manage Member Permission", error as Error);
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
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Unknown error ocurred", ErrorCode.InternalServerError, this.name);
        }
    }

}