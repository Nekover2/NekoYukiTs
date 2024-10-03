import { Interaction } from "discord.js";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import Project from "../base/NekoYuki/entities/Project";
import IMember from "../base/NekoYuki/interfaces/IMember";
import CustomClient from "../base/classes/CustomClient";

export default class ViewProjectChapterRequest implements IMediatorRequest {
    name: string;
    data: ViewProjectChapterOptions;
    constructor(ViewProjectChapterOptions: ViewProjectChapterOptions) {
        this.name = "ViewProjectChapter";
        this.data = ViewProjectChapterOptions;
    }
    fromInteraction(customClient: any, interaction: any): IMediatorRequest {
        throw new Error("Method not implemented.");
    }
}

class ViewProjectChapterOptions {
    customClient: CustomClient;
    interaction: Interaction;
    project: Project;
    author: IMember;
    constructor(customClient: CustomClient, interaction: Interaction, project: Project, author: IMember) {
        this.customClient = customClient;
        this.interaction = interaction;
        this.project = project;
        this.author = author;
    }
}