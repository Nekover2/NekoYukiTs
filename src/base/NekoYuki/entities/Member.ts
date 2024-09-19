import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import MemberStatus from "../enums/MemberStatus";
import Permission from "../enums/Permission";
import Role from "../enums/Role";
import IMember from "../interfaces/IMember";
import IProjectMember from "../interfaces/IProjectMember";
import ProjectMember from "./ProjectMember";


// TODO: Add builder pattern to this class
@Entity()
export default class Member implements IMember {
    @PrimaryColumn()
    discordId: string = "";

    @Column()
    status: MemberStatus = MemberStatus.ACTIVE;

    @Column()
    roles: number = 0;
    
    @Column()
    permissions: number = 0;
    
    @Column()
    joinDate: Date = new Date();
    
    @Column()
    gmail: string = "";

    @OneToMany(() => ProjectMember, projectMember => projectMember.member)
    // @ts-ignore
    joinedProjects: IProjectMember[];
    
    hasRole(role: Role): boolean {
        if ((this.roles & role) === role) {
            return true;
        }
        return false;
    }
    hasPermission(permission: Permission): boolean {
        if ((this.permissions & permission) === permission) {
            return true;
        }
        return false;
    }
    addRole(role: Role): void {
        this.roles |= role;
    }
    removeRole(role: Role): void {
        this.roles &= ~role;
    }
    addPermission(permission: Permission): void {
        this.permissions |= permission;
    }
    removePermission(permission: Permission): void {
        this.permissions &= ~permission;
    }
    getAllRoles(): Role[] {
        let roles: Role[] = [];
        const roleValues = Object.values(Role);
        for (let i = 0; i < roleValues.length; i++) {
            if ((this.roles & (roleValues[i] as Role)) === roleValues[i]) {
                roles.push(roleValues[i] as Role);
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
    permissionString(): Array<string> {
        const permissionValues = Object.values(Permission).filter((p) => !isNaN(Number(p)));
        const permissionKeys = Object.values(Permission).filter((p) => isNaN(Number(p)));
        //TODO : Correctly implement this method
        let permissions: Permission[] = this.getAllPermissions();
        let permissionArray: Array<string> = [];
        for (let i = 0; i < permissions.length; i++) {
            permissionArray.push(permissionKeys[permissionValues.indexOf(permissions[i])].toString());
        }
        return permissionArray;
    }

    addJoinedProject(joinedProjectInfo: IProjectMember): void {
        if(joinedProjectInfo.member.discordId !== this.discordId) {
            return;
        }
        if(this.joinedProjects.find((project) => project.id === joinedProjectInfo.project.id)) {
            return;
        }
        this.joinedProjects.push(joinedProjectInfo);
    }
}