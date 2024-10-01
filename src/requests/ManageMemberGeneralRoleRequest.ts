import { Interaction, User } from "discord.js";
import ICustomClient from "../base/interfaces/ICustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class ManageMemberGeneralRoleRequest implements IMediatorRequest {
    name: string;
    data: ManageMemberGeneralRoleRequestOptions;
    constructor(ManageMemberGeneralRoleRequestOptions: ManageMemberGeneralRoleRequestOptions) {
        this.name = "ManageMemberGeneralRole";
        this.data = ManageMemberGeneralRoleRequestOptions;
    }
    fromInteraction(customClient: ICustomClient, interaction: Interaction): IMediatorRequest {
        throw new Error("Method not implemented.");
    }

}

class ManageMemberGeneralRoleRequestOptions {
    customClient: ICustomClient;
    interaction: Interaction;
    member? : User;
    constructor(customClient: ICustomClient, interaction: Interaction, member?: User) {
        this.customClient = customClient;
        this.interaction = interaction;
        this.member = member;
    }
}