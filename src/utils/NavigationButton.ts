import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default class NavigationButton {
    static getNavigationButton(): ButtonBuilder[] {
        let navigateLeftBtn = new ButtonBuilder()
            .setCustomId("navigateLeft")
            .setLabel("◀")
            .setStyle(ButtonStyle.Primary);
        let navigateRightBtn = new ButtonBuilder()
            .setCustomId("navigateRight")
            .setLabel("▶")
            .setStyle(ButtonStyle.Primary);
        let notifyBtn = new ButtonBuilder()
            .setCustomId("notifyBtn")
            .setDisabled(true)
            .setLabel(`Use left and right button to navigate`)
            .setStyle(ButtonStyle.Primary);

        return [navigateLeftBtn, notifyBtn, navigateRightBtn];
    }
}