import { Client, Collection, GatewayIntentBits } from 'discord.js';
import IConfig from '../interfaces/IConfig';
import ICustomClient from '../interfaces/ICustomClient';
import Handler from './Handler';
import ICommand from '../interfaces/ICommand';
import ISubCommand from '../interfaces/ISubCommand';

export default class CustomClient extends Client implements CustomClient{
    config: IConfig;
    handler: Handler;
    commands: Collection<string, ICommand>;
    subCommands: Collection<string, ISubCommand>;
    cooldowns: Collection<string, Collection<string, number>>;
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
    }
    Init = () : void => {
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