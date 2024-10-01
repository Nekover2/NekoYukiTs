import path from "path";
import {glob} from "glob";

import IHandler from "../interfaces/IHandler";
import Event from "./Event";
import CustomClient from "./CustomClient";
import ICommand from "../interfaces/ICommand";
import ISubCommand from "../interfaces/ISubCommand";
import NekoYukiEvent from "../NekoYuki/classes/NekoYukiEvent";


export default class Handler implements IHandler {
    client: CustomClient;

    constructor(client: CustomClient) {
        this.client = client;
    }
    LoadEvents= async () : Promise<void> => {
        const files = (await glob(`build/events/**/*.js`)).map((file) => path.resolve(file));

        files.map(async (file : string) => {
            const event : Event = new (await import(file)).default(this.client);
            if(!event.name)
                return delete require.cache[require.resolve(file)] && console.log(`Event ${file} does not have a name property`);
            const execute = (...args: any[]) => event.Execute(...args);
            // @ts-ignore
            if(event.once) this.client.once(event.name, execute);
            // @ts-ignore
            else this.client.on(event.name, execute); 
            console.log(`[Handler] Loaded event ${event.name}`);
            return delete require.cache[require.resolve(file)];
        });
    };

    LoadCommands = async () : Promise<void> => {
        const files = (await glob(`build/commands/**/*.js`)).map((file) => path.resolve(file));

        files.map(async (file : string) => {
            const command : ICommand | ISubCommand = new (await import(file)).default(this.client);
            if(!command.name)
                return delete require.cache[require.resolve(file)] && console.log(`Command ${file} does not have a name property`);

            if(file.split("/").pop()?.split(".")[2]) this.client.subCommands.set(command.name, command as ISubCommand);
            
            this.client.commands.set(command.name, command as ICommand);

            console.log(`[Handler] Loaded command ${command.name}`);
            return delete require.cache[require.resolve(file)];
        });
    };

    LoadNekoYukiEvents = async () : Promise<void> => {
        const files = (await glob(`build/NekoYukiEvents/**/*.js`)).map((file) => path.resolve(file));

        files.map(async (file : string) => {
            const event : NekoYukiEvent = new (await import(file)).default(this.client);
            if(!event.Name)
                return delete require.cache[require.resolve(file)] && console.log(`NekoYukiEvent ${file} does not have a name property`);
            const execute = (...args: any[]) => event.Execute(...args);
            // @ts-ignore
            if(event.Once) this.client.nekoYukiEvent.once(event.Name, execute);
            // @ts-ignore
            else this.client.nekoYukiEvent.on(event.Name, execute); 
            console.log(`[Handler] Loaded NekoYukiEvent ${event.Name}`);
            return delete require.cache[require.resolve(file)];
        });
    }
}