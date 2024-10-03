import { Interaction } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";

export default class CreateGeneralRoleRequest implements IMediatorRequest {
    name: string;
    data: CreateGeneralRoleRequestOptions;

    constructor(options: CreateGeneralRoleRequestOptions) {
        this.name = "CreateGeneralRole";
        this.data = options;
    }
    fromInteraction(customClient: CustomClient, interaction: Interaction): IMediatorRequest {
        return new CreateGeneralRoleRequest(new CreateGeneralRoleRequestOptions(customClient, interaction));
    }

}

class CreateGeneralRoleRequestOptions {
    customClient: CustomClient
    interaction: Interaction;

    constructor(customClient: CustomClient, interaction: Interaction) {
        this.customClient = customClient;
        this.interaction = interaction;
    }
}