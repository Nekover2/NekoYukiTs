import MemberStatus from "../enums/MemberStatus";
import Permission from "../enums/Permission";
import Role from "../enums/Role";
import IProjectMember from "../interfaces/IProjectMember";

export default class ProjectMember implements IProjectMember {
    discordId: string;
    projectId: number;
    roles: number;
    permissions: number;
    joinDate: Date;
    status: MemberStatus;
    lastActive: Date;
    isOwner: boolean;

    constructor(
        discordId: string,
        projectId: number,
        joinDate: Date,
        status: MemberStatus,
        isOwner: boolean
    ) {
        this.discordId = discordId;
        this.projectId = projectId;
        this.roles = 0;
        this.permissions = 0;
        this.joinDate = joinDate;
        this.status = status;
        this.lastActive = joinDate;
        this.isOwner = isOwner;
    }

    hasRole(role: Role): boolean {
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
    addRole(role: Role): void {
        if(!this.hasRole(role)){
            this.roles |= role;
        }
    }
    removeRole(role: Role): void {
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