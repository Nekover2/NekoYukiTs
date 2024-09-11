import { Collection } from "discord.js";
import IConfig from "./IConfig";
import ICommand from "./ICommand";
import ISubCommand from "./ISubCommand";

export default interface ICustomClient {
    config : IConfig;
    commands : Collection<string, ICommand>;
    subCommands : Collection<string, ISubCommand>;
    cooldowns : Collection<string, Collection<string, number>>;
    Init : () => void;
    LoadHandlers : () => void;
}