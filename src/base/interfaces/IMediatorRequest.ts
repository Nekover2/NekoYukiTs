import { Interaction } from "discord.js";
import ICustomClient from "./ICustomClient";

export default interface IMediatorRequest {
    name: string;
    data: object;
    fromInteraction(customClient : ICustomClient, interaction: Interaction) : IMediatorRequest;
}