import ICustomClient from "../base/interfaces/ICustomClient";
import NekoYukiEvent from "../base/NekoYuki/classes/NekoYukiEvent";
import IChapter from "../base/NekoYuki/interfaces/IChapter";

export default class ChapterCreated extends NekoYukiEvent {
    constructor(client: ICustomClient) {
        super(client, {
            Name: "ChapterCreated",
            Description: "Fires when a chapter is created",
            Once: false
        });
    }

    async Execute(newChapter: IChapter): Promise<void>  {
        console.log(`Chapter ${newChapter.title} has been created`);  
    }
}