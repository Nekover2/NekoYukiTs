import { Client, Collection, GatewayIntentBits } from 'discord.js';
import IConfig from '../interfaces/IConfig';
import ICustomClient from '../interfaces/ICustomClient';
import Handler from './Handler';
import ICommand from '../interfaces/ICommand';
import ISubCommand from '../interfaces/ISubCommand';
import { DataSource } from 'typeorm';
import { NekoYukiDataSource } from '../../config/NekoYukiDataSource';
import Mediator from './Mediator';
import "reflect-metadata";
export default class CustomClient extends Client implements ICustomClient{
    config: IConfig;
    handler: Handler;
    commands: Collection<string, ICommand>;
    subCommands: Collection<string, ISubCommand>;
    cooldowns: Collection<string, Collection<string, number>>;
    dataSources: DataSource;
    mediator: Mediator;
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
        this.mediator.LoadMediator(`${process.cwd()}/build/requests/**/*.js`, `${process.cwd()}/build/handles/**/*.js`);
    }
    Init = async () => {
        await this.dataSources.initialize();
        this.LoadHandlers();
        this.login(this.config.token)
            .catch((err) => {
                console.error(err);
            });
    }

    LoadHandlers = () : void => {
        this.handler.LoadEvents();
        this.handler.LoadCommands();
    }
}