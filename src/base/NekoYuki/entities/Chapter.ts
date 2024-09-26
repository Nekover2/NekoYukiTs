import { Column, Entity, JoinTable, OneToMany, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import IChapter from "../interfaces/IChapter";
import IProject from "../interfaces/IProject";
import IProjectMember from "../interfaces/IProjectMember";
import Project from "./Project";
import ProjectMember from "./ProjectMember";

@Entity()
export default class Chapter implements IChapter {
    @PrimaryGeneratedColumn()
    id: number = 0;
    @Column()
    title: string = "";
    @Column()
    creationDate: Date = new Date();
    @Column()
    verified: boolean = false;
    @OneToOne(() => Project, project => project.chapters)
    //@ts-ignore
    project: IProject;
    @OneToMany(() => ProjectMember, projectMember => projectMember.project)
    //@ts-ignore
    members: IProjectMember[];
}