import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import MemberStatus from "../enums/MemberStatus";
import Permission from "../enums/Permission";
import ProjectStatus from "../enums/ProjectStatus";
import Position from "../enums/Position";
import IMember from "../interfaces/IMember";
import IProject from "../interfaces/IProject";
import IProjectMember from "../interfaces/IProjectMember";
import ProjectMember from "./ProjectMember";
import IChapter from "../interfaces/IChapter";
import Chapter from "./Chapter";

// TODO: Add builder pattern to this class

@Entity()
export default class Project implements IProject {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column()
    name: string = "";

    @Column()
    lastUpdated: Date = new Date();

    @Column()
    creationDate: Date = new Date();

    @Column()
    status: ProjectStatus = ProjectStatus.InProgress;
    @Column()
    ownerId: string = "";

    @Column()
    postChannelId: string = "";

    @Column()
    wordCount: number = 0;
    
    @OneToMany(() => ProjectMember, projectMember => projectMember.project)
    // @ts-ignore
    members: IProjectMember[];

    @OneToMany(() => Chapter, chapter => chapter.project)
    //@ts-ignore
    chapters: IChapter[]
    addMember(member: IMember, roles: Position[], permissions: Permission[]): IProjectMember | undefined {
        // find the member in the members array
        const oldMember = this.members.find((m) => m.member.discordId === member.discordId);
        if (oldMember) {
            return;
        }

        const newMember = new ProjectMember();
        newMember.member = member;
        newMember.project = this;
        newMember.joinDate = new Date();
        newMember.status = MemberStatus.ACTIVE;
        newMember.lastActive = new Date();
        newMember.isOwner = false;


        roles.forEach((role) => {
            newMember.addPosition(role);
        });
        permissions.forEach((permission) => {
            newMember.addPermission(permission);
        });
        this.members.push(newMember);
        return newMember;
        // create a new project member
        // TODO: wait for the IProjectMember interface to be implemented
    }
    removeMember(member: IMember): void {
        const index = this.members.findIndex((m) => m.member.discordId === member.discordId);
        if (index > -1) {
            this.members.splice(index, 1);
        }
    }
    hasMember(member: IMember): boolean {
        throw new Error("Method not implemented.");
    }
    hasProjectPermission(member: IMember, permission: Permission): boolean {
        if(member.hasPermission(permission)){
            return true;
        }
        if(this.members.find((m) => m.member.discordId === member.discordId)?.hasPermission(permission)){
            return true;
        }
        return false;
    }
    hasProjectRole(member: IMember, role: Position): boolean {
        if(member.hasRole(role)){
            return true;
        }
        if(this.members.find((m) => m.member.discordId === member.discordId)?.hasRole(role)){
            return true;
        }
        return false;
    }
    addPosition(member: IMember, role: Position): void {
        const projectMember = this.members.find((m) => m.member.discordId === member.discordId);
        if(projectMember){
            if(!projectMember.hasRole(role))
                projectMember.addPosition(role);
        }
    }
    removePosition(member: IMember, role: Position): void {
        const projectMember = this.members.find((m) => m.member.discordId === member.discordId);
        if(projectMember){
            if(projectMember.hasRole(role))
                projectMember.removePosition(role);
        }
    }
    addPermission(member: IMember, permission: Permission): void {
        const projectMember = this.members.find((m) => m.member.discordId === member.discordId);
        if(projectMember){
            if(!projectMember.hasPermission(permission))
                projectMember.addPermission(permission);
        }
    }
    removePermission(member: IMember, permission: Permission): void {
        const projectMember = this.members.find((m) => m.member.discordId === member.discordId);
        if(projectMember){
            if(projectMember.hasPermission(permission))
                projectMember.removePermission(permission);
        }
    }
    getAllPositions(member: IMember): Position[] {
        let roles: Position[] = [];
        const projectMember = this.members.find((m) => m.member.discordId === member.discordId);
        if(projectMember) {
            let enumValues = Object.values(Position);
            for(let i = 0; i < enumValues.length; i++){
                if(projectMember.hasRole(enumValues[i] as Position)){
                    roles.push(enumValues[i] as Position);
                }
            }
        }
        return roles;
    }
    getAllPermissions(member: IMember): Permission[] {
        let permissions: Permission[] = [];
        const projectMember = this.members.find((m) => m.member.discordId === member.discordId);
        if(projectMember) {
            let enumValues = Object.values(Permission);
            for(let i = 0; i < enumValues.length; i++){
                if(projectMember.hasPermission(enumValues[i] as Permission)){
                    permissions.push(enumValues[i] as Permission);
                }
            }
        }
        return permissions;
    }
    permissionString(member: IMember): string {
        //TODO : Correctly implement this method
        throw new Error("Method not implemented.");
    }

}