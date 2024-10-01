import GeneralRole from "./GeneralRole";

export default class NotificationConfig {
    // @ts-ignore
    id: number;
    // @ts-ignore
    generalRole: GeneralRole;
    createdAt: Date = new Date();
    action: string = "";
}