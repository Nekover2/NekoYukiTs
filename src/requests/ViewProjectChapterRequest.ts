import { Interaction } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import Project from "../base/NekoYuki/entities/Project";
import IMember from "../base/NekoYuki/interfaces/IMember";
import ICustomClient from "../base/interfaces/ICustomClient";

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
    customClient: ICustomClient;
    interaction: Interaction;
    project: Project;
    author: IMember;
    constructor(customClient: ICustomClient, interaction: Interaction, project: Project, author: IMember) {
        this.customClient = customClient;
        this.interaction = interaction;
        this.project = project;
        this.author = author;
    }
}