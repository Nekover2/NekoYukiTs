import { ButtonBuilder, ButtonStyle } from "discord.js";
import CustomError from "../base/classes/CustomError";
import ErrorCode from "../base/enums/ErrorCode";
import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import ViewMemberChapterRequest from "../requests/ViewMemberChapterRequest";
import Chapter from "../base/NekoYuki/entities/Chapter";

export default class ViewMemberChapterHandler implements IMediatorHandle<ViewMemberChapterRequest> {
    name: string = "ViewMemberChapter";
    ableToNavigate: boolean = true;


    async handle(value: ViewMemberChapterRequest): Promise<any> {
        try {
            let loopFlag = false;

            const returnBtn = new ButtonBuilder()
                .setCustomId("return")
                .setLabel("Return")
                .setStyle(ButtonStyle.Secondary);
            do {
                
            } while (loopFlag);
        } catch (error) {
            if(error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("An error occurred while trying to view the member chapter", ErrorCode.InternalServerError, "View Member Chapter", error as Error);
        }
    }
}