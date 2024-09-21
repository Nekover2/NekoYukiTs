import { EmbedBuilder } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import Member from "../base/NekoYuki/entities/Member";
import Permission from "../base/NekoYuki/enums/Permission";
import CreateProjectRequest from "../requests/CreateProjectRequest";

export default class CreateProjectHandler implements IMediatorHandle<CreateProjectRequest> {
    name: string;
    constructor() {
        this.name = "CreateProject";
    }
    async handle(value: CreateProjectRequest): Promise<any> {
        // Step 1: Check if author has permissions

        const authorMember = await value.data.client.dataSources.getRepository(Member).findOne({
            where: { discordId: value.data.author.id }
        });

        if (!authorMember)
            throw new CustomError("You haven't registered yet", ErrorCode.UserCannotBeFound, "Create Project");
        if (!authorMember.hasPermission(Permission.CreateProject))
            throw new CustomError("You don't have permission to create a project", ErrorCode.Forbidden, "Create Project");

        // Step 2: send prompt to get project information
        const projectInfoEmbed = new EmbedBuilder()
            .setTitle("Project Information")
            .setDescription("Please provide the information of the project you want to create.")
            .setColor("Random")
            .setAuthor({ name: value.data.author.displayName, iconURL: value.data.author.displayAvatarURL() })
            .setFooter({ text: "NekoYuki's manager" })
            .setTimestamp();
    }
}