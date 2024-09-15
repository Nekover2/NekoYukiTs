import IMediatorHandle from "../base/interfaces/IMediatorHandle";
import Member from "../base/NekoYuki/entities/Member";
import CreateMemberRequest from "../requests/CreateMemberRequest";

export default class CreateMemberHandler implements IMediatorHandle<CreateMemberRequest> {
    name: string;
    constructor() {
        this.name = "CreateMember";
    }
    async handle(value: CreateMemberRequest): Promise<any> {
        console.log(`[CreateMemberHandler] Handling request ${value.name}`);
        console.log(`[CreateMemberHandler] Discord ID: ${value.data.discordId}`);
        console.log(`[CreateMemberHandler] Gmail: ${value.data.gmail}`);
        const newMember = new Member();
        newMember.discordId = value.data.discordId;
        newMember.gmail = value.data.gmail;
        await value.client.dataSources.manager.save(newMember);
        return Promise.resolve();
    }

}