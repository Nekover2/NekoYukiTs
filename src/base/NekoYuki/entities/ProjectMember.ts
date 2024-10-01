import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

import MemberStatus from "../enums/MemberStatus";
import Permission from "../enums/Permission";
import Position from "../enums/Position";
import IMember from "../interfaces/IMember";
import IProject from "../interfaces/IProject";
import IProjectMember from "../interfaces/IProjectMember";
import Member from './Member';
import Project from './Project';

// TODO: Add builder pattern to this class
@Entity()
export default class ProjectMember implements IProjectMember {

    @PrimaryGeneratedColumn()
    id: number = 0;

    @ManyToOne(() => Member, member => member.joinedProjects)
    member: IMember = new Member();

    @ManyToOne(() => Project, project => project.members)
    project: IProject = new Project();

    @Column()
    roles: number = 0;

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

    hasRole(role: Position): boolean {
        if ((this.roles & role) === role) {
            return true;
        }
        return false
    }
    hasPermission(permission: Permission): boolean {
        if ((this.permissions & permission) === permission) {
            return true;
        }
        return false
    }
    addPosition(role: Position): void {
        if(!this.hasRole(role)){
            this.roles |= role;
        }
    }
    removePosition(role: Position): void {
        if(this.hasRole(role)){
            this.roles &= ~role;
        }
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
    getAllPositions(): Position[] {
        let roles: Position[] = [];
        const roleValues = Object.values(Position);
        for (let i = 0; i < roleValues.length; i++) {
            if ((this.roles & (roleValues[i] as Position)) === roleValues[i]) {
                roles.push(roleValues[i] as Position);
            }
        }
        return roles;
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