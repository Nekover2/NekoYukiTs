import MemberStatus from "../enums/MemberStatus";
import Permission from "../enums/Permission";
import Role from "../enums/Role";
import IMember from "../interfaces/IMember";
import IProjectMember from "../interfaces/IProjectMember";
export default class Member implements IMember {
    discordId: string;
    status: MemberStatus;
    roles: number;
    permissions: number;
    joinDate: Date;
    gmail: string;
    joinedProjects: IProjectMember[];

    constructor(discordId: string, gmail: string) {
        this.discordId = discordId;
        this.gmail = gmail;
        this.status = MemberStatus.ACTIVE;
        this.roles = 0;
        this.permissions = 0;
        this.joinDate = new Date();
        this.joinedProjects = [];
    }
    
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
    permissionString(): string {
        //TODO : Correctly implement this method
        let permissions: Permission[] = this.getAllPermissions();
        let permissionString: string = "";
        for (let i = 0; i < permissions.length; i++) {
            permissionString += Permission[permissions[i]] + ", ";
        }
        return permissionString;
    }

    addJoinedProject(joinedProjectInfo: IProjectMember): void {
        if(joinedProjectInfo.discordId !== this.discordId) {
            return;
        }
        if(this.joinedProjects.find((project) => project.projectId === joinedProjectInfo.projectId)) {
            return;
        }
        this.joinedProjects.push(joinedProjectInfo);
    }
}