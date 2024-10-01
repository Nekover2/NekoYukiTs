import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, OneToMany } from 'typeorm';

import MemberStatus from "../enums/MemberStatus";
import Permission from "../enums/Permission";
import IMember from "../interfaces/IMember";
import IProject from "../interfaces/IProject";
import IProjectMember from "../interfaces/IProjectMember";
import Member from './Member';
import Project from './Project';
import GeneralRole from './GeneralRole';

// TODO: Add builder pattern to this class
@Entity()
export default class ProjectMember implements IProjectMember {
    

    @PrimaryGeneratedColumn()
    // @ts-ignore
    id: number;

    @ManyToOne(() => Member, member => member.joinedProjects)
    member: IMember = new Member();

    @ManyToOne(() => Project, project => project.members)
    project: IProject = new Project();

    @ManyToOne(() => GeneralRole, generalRole => generalRole.Members)
    @JoinColumn()
    // @ts-ignore
    role: GeneralRole;

    @Column()
    permissions: number = 0;
    
    @Column()
    joinDate: Date = new Date();
    
    @Column()
    status: MemberStatus = MemberStatus.ACTIVE;
    
    @Column()
    lastActive: Date = new Date();
    
    @Column()
    isOwner: boolean = false;

    hasPermission(permission: Permission): boolean {
        if ((this.permissions & permission) === permission) {
            return true;
        }
        return false
    }
    addPermission(permission: Permission): void {
        if(!this.hasPermission(permission)){
            this.permissions |= permission;
        }
    }
    removePermission(permission: Permission): void {
        if(this.hasPermission(permission)){
            this.permissions &= ~permission;
        }
    }
    getAllPermissions(): Permission[] {
        let permissions: Permission[] = [];
        const permissionValues = Object.values(Permission);
        for (let i = 0; i < permissionValues.length; i++) {
            if ((this.permissions & (permissionValues[i] as Permission)) === permissionValues[i]) {
                permissions.push(permissionValues[i] as Permission);
            }
        }
        return permissions;
    }
    permissionString(): string {
        throw new Error("Method not implemented.");
    }

    setRole(role: GeneralRole): void {
        this.role = role;
    }

    updateLastActive(): void {
        this.lastActive = new Date();
    }
    setStatus(status: MemberStatus): void {
        this.status = status;
    }
    setOwner(isOwner: boolean): void {
        this.isOwner = isOwner;
    }

}