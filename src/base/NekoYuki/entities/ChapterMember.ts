import { Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import Chapter from "./Chapter";
import GeneralRole from "./GeneralRole";
import Member from "./Member";

@Entity()
export default class ChapterMember{
    @PrimaryGeneratedColumn()
    // @ts-ignore
    id: number;

    @ManyToOne(() =>Chapter, chapter => chapter.chapterMembers)
    // @ts-ignore
    chapter: Chapter;
    @ManyToOne(() => GeneralRole, generalRole => generalRole.Members)
    @JoinColumn()
    // @ts-ignore
    role: GeneralRole;
    @ManyToOne(() => Member, member => member.chapterAttended)
    // @ts-ignore
    member: Member;
}