import { ActionRow, ActionRowBuilder, Client, Collection, GatewayIntentBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import IConfig from '../interfaces/IConfig';
import ICustomClient from '../interfaces/ICustomClient';
import Handler from './Handler';
import ICommand from '../interfaces/ICommand';
import ISubCommand from '../interfaces/ISubCommand';
import { DataSource } from 'typeorm';
import { NekoYukiDataSource } from '../../config/NekoYukiDataSource';
import Mediator from './Mediator';
import "reflect-metadata";
import { glob } from 'glob';
import path from 'path';
import IMediatorHandle from '../interfaces/IMediatorHandle';
import IMediatorRequest from '../interfaces/IMediatorRequest';
export default class CustomClient extends Client implements ICustomClient{
    config: IConfig;
    handler: Handler;
    commands: Collection<string, ICommand>;
    subCommands: Collection<string, ISubCommand>;
    cooldowns: Collection<string, Collection<string, number>>;
    dataSources: DataSource;
    mediator: Mediator;
    navigations: ActionRowBuilder;
    constructor(){
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessageReactions,
            ]
        });
        this.config = require(`${process.cwd()}/data/config.json`);
        this.handler = new Handler(this);
        this.commands = new Collection();
        this.subCommands = new Collection();
        this.cooldowns = new Collection();
        this.dataSources = NekoYukiDataSource
        this.mediator = new Mediator();
        this.mediator.LoadMediator(`build/requests/**/*.js`, `build/handles/**/*.js`);
        this.navigations = new ActionRowBuilder();
    }
    Init = async () => {
        await this.dataSources.initialize();
        this.LoadHandlers();
        this.login(this.config.token)
            .catch((err) => {
                console.error(err);
            });
        await this.LoadNavigation(`build/handles/**/*.js`);
    }

    LoadHandlers = () : void => {
        this.handler.LoadEvents();
        this.handler.LoadCommands();
    }

    LoadNavigation = async (handlerPath: string) : Promise<void> => {
        const handler = (await glob(handlerPath)).map((file) => path.resolve(file));
        const navigationRow = new StringSelectMenuBuilder()
            .setCustomId("navigationSelect")
            .setPlaceholder("Select a navigation");
        handler.map(async (file: string) => {
            const navigation: IMediatorHandle<IMediatorRequest> = new (await import(file)).default(this);
            if(navigation.ableToNavigate === true) {
                const selectMenu = new StringSelectMenuOptionBuilder()
                    .setLabel(navigation.name)
                    .setValue(navigation.name);
                navigationRow.addOptions(selectMenu);
            }
            return delete require.cache[require.resolve(file)];
        });
        this.navigations.addComponents(navigationRow);
    }
}