import { ActionRow, ActionRowBuilder, Collection } from "discord.js";
import IConfig from "./IConfig";
import ICommand from "./ICommand";
import ISubCommand from "./ISubCommand";
import { DataSource } from "typeorm";
import IMediator from "./IMediator";

export default interface ICustomClient {
    config : IConfig;
    commands : Collection<string, ICommand>;
    subCommands : Collection<string, ISubCommand>;
    cooldowns : Collection<string, Collection<string, number>>;
    dataSources : DataSource;
    mediator : IMediator;
    navigations : ActionRowBuilder;
    Init : () => void;
    LoadHandlers : () => void;
    LoadNavigation : (handlerPath: string) => void;
}