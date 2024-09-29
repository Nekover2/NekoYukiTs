import { ActionRowBuilder, ComponentType, EmbedBuilder, Interaction, StringSelectMenuBuilder } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import Member from "../base/NekoYuki/entities/Member";
import Permission from "../base/NekoYuki/enums/Permission";
import Role, { RoleHelper } from "../base/NekoYuki/enums/Role";
import ManageMemberRoleRequest from "../requests/ManageMemberRoleRequest";
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
export default class ManageMemberRoleHandler implements IMediatorHandle<ManageMemberRoleRequest> {
    name: string;
    ableToNavigate: boolean;
    constructor() {
        this.name = "ManageMemberRole";
        this.ableToNavigate = false;
    }
    async handle(value: ManageMemberRoleRequest): Promise<any> {
        do { 
            try {
                let infoMsg = await value.data.channel.send("Manage Member Role is loading...");
                // Check if author has permissions
                const authorMember = await value.data.client.dataSources.getRepository(Member).findOne({
                    where: { discordId: value.data.author.id }
                });
    
                if (!authorMember)
                    throw new CustomError("Author is not a member", ErrorCode.UserCannotBeFound, "Manage Member Role");
                if (!authorMember.hasPermission(Permission.MangeMember))
                    throw new CustomError("Author does not have permission to manage members", ErrorCode.Forbidden, "Manage Member Role");
    
                // Check if member is registered
                const member = await value.data.client.dataSources.getRepository(Member).findOne({
                    where: { discordId: value.data.member.id }
                });
                if (!member)
                    throw new CustomError("Member is not registered", ErrorCode.UserCannotBeFound, "Manage Member Role");
                
                
                let roleString = RoleHelper.getRoleString(member.getAllRoles());
                if (roleString.length === 0) {
                    roleString = "No role";
                }
    
                const roleDashboardEmbed = new EmbedBuilder()
                    .setTitle(`Role Dashboard for ${value.data.member.displayName}`)
                    .setDescription("This is a role dashboard for the member you selected, you can manage their roles here. You can change their roles by picking roles input below. Note that, pick an existing role will remove it, and pick a non-existing role will add it.")
                    .setColor("Random")
                    .setAuthor({ name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL() })
                    .setFooter({ text: "NekoYuki's manager" })
                    .setTimestamp()
                    .addFields({ name: "Current roles", value: roleString });

    
                const roleLabel = Object.keys(Role).filter((r) => isNaN(Number(r)));
                const roleValue = Object.values(Role).filter((r) => !isNaN(Number(r)));
    
                const roleSelect = new StringSelectMenuBuilder()
                    .setCustomId("roleSelect")
                    .setPlaceholder("Select a role")
                    .addOptions(roleLabel.map((label, index) => {
                        return {
                            label: label,
                            value: roleValue[index].toString(),
                        }
                    }));
                
                const roleSelectRow = new ActionRowBuilder().addComponents(roleSelect);
    
                let roleSelectInteractionGlobal;
                // @ts-ignore
                await infoMsg.edit({ content: "", embeds: [roleDashboardEmbed], components: [roleSelectRow] });
                try {
                    const filter = (interaction : Interaction) => interaction.user.id === value.data.author.id;
                    roleSelectInteractionGlobal = await infoMsg.awaitMessageComponent({ filter, time: 60000, componentType: ComponentType.StringSelect });
                } catch (error) {
                    throw new CustomError("No response from author", ErrorCode.TimeOut, "Manage Member Role", error as Error);
                }
    
                const selectedRole = roleSelectInteractionGlobal.values[0];
                const role = parseInt(selectedRole);
                if (member.hasRole(role)) {
                    await roleSelectInteractionGlobal.reply({ content: `Role will be removed: ${roleLabel[roleValue.indexOf(role)]}, updating...`, ephemeral: true });
                    member.removeRole(role);
                } else {
                    await roleSelectInteractionGlobal.reply({ content: `Role will be added: ${roleLabel[roleValue.indexOf(role)]}, updating...`, ephemeral: true });
                    member.addRole(role);
                }
                await delay(3000);
                try {
                    await value.data.client.dataSources.getRepository(Member).save(member);
                } catch (error) {
                    throw new CustomError("Failed to save member to the database", ErrorCode.InternalServerError, "Manage Member Role",error as Error);
                }
                await roleSelectInteractionGlobal.editReply({content: "Role has been updated", components: []});
                infoMsg.delete();
            } catch (error) {
                
                if (error instanceof CustomError) {
                    throw error;
                }
                throw new CustomError("An ***unknown*** error occurred", ErrorCode.InternalServerError, "Manage Member Role", error as Error);
            }
        } while (true);
    }
}