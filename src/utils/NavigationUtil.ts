import { ActionRowBuilder, Interaction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { glob } from "glob";
import path from "path";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import IMediatorRequest from "../base/interfaces/IMediatorRequest";
import IMediator from "../base/interfaces/IMediator";
import ICustomClient from "../base/interfaces/ICustomClient";
export default class NavigationUtil {
    static async GetNavigationList(handlerPath: string): Promise<ActionRowBuilder> {
        const navigations = new ActionRowBuilder();
        const handler = (await glob(handlerPath)).map((file) => path.resolve(file));
        const navigationRow = new StringSelectMenuBuilder()
            .setCustomId("navigationSelect")
            .setPlaceholder("Select a navigation");
        handler.map(async (file: string) => {
            const navigation: IMediatorHandle<IMediatorRequest> = new (await import(file)).default(this);
            if (navigation.ableToNavigate === true) {
                const selectMenu = new StringSelectMenuOptionBuilder()
                    .setLabel(navigation.name)
                    .setValue(navigation.name);
                navigationRow.addOptions(selectMenu);
            }
            return delete require.cache[require.resolve(file)];
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