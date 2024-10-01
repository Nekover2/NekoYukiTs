import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import GeneralRole from "./GeneralRole";
import Member from "./Member";

@Entity()
export default class GeneralMemerRole {
    @PrimaryGeneratedColumn()
    // @ts-ignore
    id: number;
    @ManyToOne(() => Member, member => member.generalMemerRole)
    // @ts-ignore
    member: Member;
    @ManyToOne(() => GeneralRole, generalRole => generalRole.Members)
    // @ts-ignore
    role: GeneralRole;
    createdAt: Date = new Date();

}