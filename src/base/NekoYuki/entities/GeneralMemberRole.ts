import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import GeneralRole from "./GeneralRole";
import Member from "./Member";

@Entity()
export default class MemberGeneralRole {
    @PrimaryGeneratedColumn()
    // @ts-ignore
    id: number;
    @ManyToOne(() => Member, member => member.generalRoles)
    // @ts-ignore
    member: Member;
    @ManyToOne(() => GeneralRole, generalRole => generalRole.Members)
    // @ts-ignore
    role: GeneralRole;
    @Column()
    createdAt: Date = new Date();
}