import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder, Interaction, ModalBuilder, StringSelectMenuBuilder, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import CreateGeneralRoleRequest from "../requests/CreateGeneralRoleRequest";
import Permission, { PermissionHelper } from "../base/NekoYuki/enums/Permission";
import GeneralRole from "../base/NekoYuki/entities/GeneralRole";
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
export default class CreateGeneralRoleHandler implements IMediatorHandle<CreateGeneralRoleRequest> {
    name: string;
    ableToNavigate: boolean;
    constructor() {
        this.name = "CreateGeneralRole";
        this.ableToNavigate = true
    }

    async checkPermission(value: CreateGeneralRoleRequest): Promise<boolean> {
        let hasPermission = false;
        if(value.data.authorMember.hasPermission(Permission.MangePermission)) {
            hasPermission = true;
        }
        if(!hasPermission) {
            throw new CustomError("You don't have permission to create a role.", ErrorCode.Forbidden, "Create General Role");
        }
        return hasPermission;
    }
    async handle(value: CreateGeneralRoleRequest): Promise<any> {
        try {
            await this.checkPermission(value);
            let interaction = await this.sendInfo(value);
            if(interaction === undefined) return;
            let roleName = await this.getRoleName(value, interaction);
            if(roleName === undefined) return;
            let newRole = new GeneralRole();
            newRole.Name = roleName;
            newRole.CreatedAt = new Date();
            const newFullyRole = await this.getRolePermissions(value, newRole);
            if(newFullyRole === undefined) return;
            const savedRole = await this.saveToDatabase(value, newFullyRole);
            return savedRole;
        } catch (error) {
            if(error instanceof CustomError ) throw error;
            throw new CustomError("An ***unknown*** error occurred.", ErrorCode.InternalServerError, "Create General Role");
        }
    }

    async sendInfo(value: CreateGeneralRoleRequest) : Promise<ButtonInteraction | undefined> {
        try {
            const infoEmbed = new EmbedBuilder()
                .setAuthor({name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL()})
                .setTitle("You are about to create a new role")
                .setDescription("This role will be a general role for the server. It will be used to give user's permission to manage team data.\n" +
                    "Before you proceed, please make sure you have the necessary permissions to create a role.\n" +
                    "- Step 1: Enter the name of the role\n" +
                    "- Step 2: Choose permissions of the role\n" +
                    "- Step 3: Confirm the creation of the role"+ 
                    "\n\n" +
                    "Do you want to proceed?")
                .setColor("Blue")
                .setTimestamp();

            const acceptButton = new ButtonBuilder()
                .setCustomId("accept")
                .setLabel("Accept")
                .setStyle(ButtonStyle.Success);
            const declineButton = new ButtonBuilder()
                .setCustomId("decline")
                .setLabel("Decline")
                .setStyle(ButtonStyle.Danger);
            const btnRow = new ActionRowBuilder().addComponents(acceptButton, declineButton);
            // @ts-ignore
            const infoMsg = await value.data.channel.send({embeds: [infoEmbed], components: [btnRow]});

            try {
                const infoMsgInteraction = await infoMsg.awaitMessageComponent({ filter: i => i.user.id === value.data.author.id, time: 30000 , componentType: ComponentType.Button});
                infoMsg.delete();
                if(infoMsgInteraction.customId === "accept") {
                    return infoMsgInteraction;
                }
                return undefined;
            } catch (error) {
                throw new CustomError("Time out", ErrorCode.UserCancelled, "Create General Role", error as Error);
            }
        } catch (error) {
            if(error instanceof CustomError ) throw error;
            throw new CustomError("An ***unknown*** error occurred.", ErrorCode.InternalServerError, "Create General Role", error as Error);
        }
    }

    async getRoleName(value: CreateGeneralRoleRequest, interaction: ButtonInteraction) : Promise<string> {
        try {
            const nameInput = new TextInputBuilder()
                .setPlaceholder("Enter the name of the role")
                .setMinLength(3)
                .setMaxLength(32)
                .setCustomId("roleName")
                .setRequired(true)
                .setLabel("Role Name")
                .setStyle(TextInputStyle.Short);
            const nameRow = new ActionRowBuilder().addComponents(nameInput);
            const getInfoModal = new ModalBuilder()
                .setCustomId("getInfoModal")
                .setTitle("Enter needed information for new role")
                // @ts-ignore
                .setComponents(nameRow);

            await interaction.showModal(getInfoModal);
            try {
                const infoModalResponse = await interaction.awaitModalSubmit({ filter: i => i.user.id === value.data.author.id, time: 30000 });
                const roleName = infoModalResponse.fields.getTextInputValue("roleName");
                infoModalResponse.reply({ content: "Role name has been set, role name:" + roleName , ephemeral: true });
                return roleName;
            } catch (error) {
                if(error instanceof CustomError ) throw error;
                throw new CustomError("An ***unknown*** error occurred.", ErrorCode.InternalServerError, "Create General Role", error as Error);
            }
        } catch (error) {
            if(error instanceof CustomError ) throw error;
            throw new CustomError("An ***unknown*** error occurred.", ErrorCode.InternalServerError, "Create General Role", error as Error);
        }
    }

    async getRolePermissions(value: CreateGeneralRoleRequest, newRole: GeneralRole) : Promise<GeneralRole | undefined> {
        try {
            do {
                const currentPermissionString = newRole.getPermissionString();
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
                const permissionDashboardEmbed = new EmbedBuilder()
                    .setAuthor({name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL()})
                    .setTitle("Step 2: Manage Role Permission")
                    .setDescription("Select a permission to add or remove, if you pick an existing permission, it will be removed, if you pick a non-existing permission, it will be added.\n"
                        +"When you finish, click the confirm button to proceed.")
                    .setColor("Blue")
                    .setTimestamp()
                .addFields({name: "Current permissions", value: currentPermissionString});

                const acceptButton = new ButtonBuilder()
                    .setCustomId("accept")
                    .setLabel("Confirm")
                    .setStyle(ButtonStyle.Success);
                const declineButton = new ButtonBuilder()
                    .setCustomId("decline")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Danger);
                const btnRow = new ActionRowBuilder().addComponents(acceptButton, declineButton);

                // @ts-ignore
                const permissionDashboardMessage = await value.data.channel.send({embeds: [permissionDashboardEmbed], components: [permissionSelectRow, btnRow]});
                try {
                    const filter = (interaction: Interaction) => interaction.user.id === value.data.author.id;
                    const interactionPermissionInteraction = await permissionDashboardMessage.awaitMessageComponent({ filter: filter, time: 60000});
                    if(interactionPermissionInteraction.customId === "accept") {
                        permissionDashboardMessage.delete();
                        return newRole;
                    }
                    if(interactionPermissionInteraction.customId === "decline") {
                        permissionDashboardMessage.delete();
                        return undefined;
                    }
                    if(interactionPermissionInteraction.isStringSelectMenu()) {
                        const selectedPermission = interactionPermissionInteraction.values[0];
                        const permission = parseInt(selectedPermission);
                        if (newRole.hasPermission(permission)) {
                            await interactionPermissionInteraction.reply({ content: `Permission will be removed: ${PermissionHelper.getPermissionLabel(permission)}`, ephemeral: true });
                            newRole.removePermission(permission);
                        } else {
                            await interactionPermissionInteraction.reply({ content: `Permission will be added: ${PermissionHelper.getPermissionLabel(permission)}`, ephemeral: true });
                            newRole.addPermission(permission);
                        }
                    }
                    permissionDashboardMessage.delete();
                } catch (error) {
                    if(error instanceof CustomError ) throw error;
                    throw new CustomError("Time out", ErrorCode.InternalServerError, "Create General Role", error as Error);
                }
            } while (true);
        } catch (error) {
            if(error instanceof CustomError ) throw error;
            throw new CustomError("An ***unknown*** error occurred.", ErrorCode.InternalServerError, "Create General Role", error as Error);
        }
    }

    async saveToDatabase(value: CreateGeneralRoleRequest, newRole: GeneralRole) : Promise<GeneralRole> {
        try {
            const statusEmbed = new EmbedBuilder()
                .setAuthor({name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL()})
                .setTitle("Saving new role to the database")
                .setDescription("This is the information of the new role.\n Please wait while we save it to the database...")
                .setColor("Blue")
                .setFields([
                    {name: "Role Name", value: newRole.Name},
                    {name: "Role Permissions", value: newRole.getPermissionString()},
                    {name: "Created At", value: newRole.CreatedAt.toUTCString()}
                ])
                .setTimestamp();
    
            const statusMsg = await value.data.author.send({embeds: [statusEmbed]});
            await value.data.customClient.dataSources.getRepository(GeneralRole).save(newRole);
            statusEmbed.setDescription("Role has been saved to the database.")
                .setColor("Green")
                .setTitle("Role has been saved")
                .setTimestamp();
            await statusMsg.edit({embeds: [statusEmbed]});
            await delay(5000);
            statusMsg.delete();
            return newRole;
        } catch (error) {
            if(error instanceof CustomError ) throw error;
            throw new CustomError("Error when saving role to the database.", ErrorCode.InternalServerError, "Create General Role", error as Error);
        }
    }
}