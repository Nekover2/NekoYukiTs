import { Column, Entity, JoinTable, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import IChapter from "../interfaces/IChapter";
import IProject from "../interfaces/IProject";
import IProjectMember from "../interfaces/IProjectMember";
import Project from "./Project";
import ProjectMember from "./ProjectMember";

@Entity()
export default class Chapter implements IChapter {
    @PrimaryGeneratedColumn()
    // @ts-ignore
    id: number;
    @Column()
    title: string = "";
    @Column()
    link: string = "";
    @Column()
    creationDate: Date = new Date();
    @Column()
    verified: boolean = false;
    @ManyToOne(() => Project, project => project.chapters)
    //@ts-ignore
    project: IProject;
}