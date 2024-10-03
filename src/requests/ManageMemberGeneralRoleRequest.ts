import { Interaction, User } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class ManageMemberGeneralRoleRequest implements IMediatorRequest {
    name: string;
    data: ManageMemberGeneralRoleRequestOptions;
    constructor(ManageMemberGeneralRoleRequestOptions: ManageMemberGeneralRoleRequestOptions) {
        this.name = "ManageMemberGeneralRole";
        this.data = ManageMemberGeneralRoleRequestOptions;
    }
    fromInteraction(customClient: CustomClient, interaction: Interaction): IMediatorRequest {
        return new ManageMemberGeneralRoleRequest({
            customClient: customClient,
            interaction: interaction
        });
    }

}

class ManageMemberGeneralRoleRequestOptions {
    customClient: CustomClient;
    interaction: Interaction;
    member? : User;
    constructor(customClient: CustomClient, interaction: Interaction, member?: User) {
        this.customClient = customClient;
        this.interaction = interaction;
        this.member = member;
    }
}