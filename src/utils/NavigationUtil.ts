import { ActionRowBuilder, Interaction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { glob } from "glob";
import path from "path";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import IMediator from "../base/interfaces/IMediator";
import ICustomClient from "../base/interfaces/ICustomClient";
export default class NavigationUtil {
    static async GetNavigationList(mediator: IMediator): Promise<ActionRowBuilder> {
        const nv = mediator.handles.filter((h) => h.ableToNavigate === true);
        const navigations = new ActionRowBuilder();
        const navigationRow = new StringSelectMenuBuilder()
            .setCustomId("navigationSelect")
            .setPlaceholder("Select a navigation");
        nv.forEach((n) => {
            const option = new StringSelectMenuOptionBuilder()
                .setLabel(n.name)
                .setValue(n.name);
            navigationRow.addOptions(option);
        });
        navigations.addComponents(navigationRow);
        return navigations;
    }

    static async HandleNavigation(value: string, customClient : ICustomClient, interaction: Interaction, mediator : IMediator) : Promise<void> {
        const requestObject  = mediator.requests.find((r) => r.name === value);
        const request = requestObject?.fromInteraction(customClient, interaction);
        if(request) {
            await mediator.send(request);
        }
    }
}