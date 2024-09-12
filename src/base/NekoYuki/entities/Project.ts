import Permission from "../enums/Permission";
import ProjectStatus from "../enums/ProjectStatus";
import Role from "../enums/Role";
import IMember from "../interfaces/IMember";
import IProject from "../interfaces/IProject";
import IProjectMember from "../interfaces/IProjectMember";
export default class Project implements IProject {
    id: number;
    name: string;
    lastUpdated: Date;
    creationDate: Date;
    status: ProjectStatus;
    postChannelId?: string | undefined;
    members: IProjectMember[];

    constructor(
        id: number,
        name: string,
        creationDate: Date,
        status: ProjectStatus,
        postChannelId: string | undefined
    ) {
        this.id = id;
        this.name = name;
        this.creationDate = creationDate;
        this.lastUpdated = creationDate;
        this.status = status;
        this.postChannelId = postChannelId;
        this.members = [];
    }

    addMember(member: IMember, roles: Role[], permissions: Permission[]): IProjectMember | undefined {
        // find the member in the members array
        const oldMember = this.members.find((m) => m.discordId === member.discordId);
        if (oldMember) {
            return;
        }

        // create a new project member
        // TODO: wait for the IProjectMember interface to be implemented
    }
    removeMember(member: IMember): void {
        throw new Error("Method not implemented.");
    }
    hasMember(member: IMember): boolean {
        throw new Error("Method not implemented.");
    }
    hasProjectPermission(member: IMember, permission: Permission): boolean {
        if(member.hasPermission(permission)){
            return true;
        }
        if(this.members.find((m) => m.discordId === member.discordId)?.hasPermission(permission)){
            return true;
        }
        return false;
    }
    hasProjectRole(member: IMember, role: Role): boolean {
        if(member.hasRole(role)){
            return true;
        }
        if(this.members.find((m) => m.discordId === member.discordId)?.hasRole(role)){
            return true;
        }
        return false;
    }
    addRole(member: IMember, role: Role): void {
        const projectMember = this.members.find((m) => m.discordId === member.discordId);
        if(projectMember){
            if(!projectMember.hasRole(role))
                projectMember.addRole(role);
        }
    }
    removeRole(member: IMember, role: Role): void {
        const projectMember = this.members.find((m) => m.discordId === member.discordId);
        if(projectMember){
            if(projectMember.hasRole(role))
                projectMember.removeRole(role);
        }
    }
    addPermission(member: IMember, permission: Permission): void {
        const projectMember = this.members.find((m) => m.discordId === member.discordId);
        if(projectMember){
            if(!projectMember.hasPermission(permission))
                projectMember.addPermission(permission);
        }
    }
    removePermission(member: IMember, permission: Permission): void {
        const projectMember = this.members.find((m) => m.discordId === member.discordId);
        if(projectMember){
            if(projectMember.hasPermission(permission))
                projectMember.removePermission(permission);
        }
    }
    getAllRoles(member: IMember): Role[] {
        let roles: Role[] = [];
        const projectMember = this.members.find((m) => m.discordId === member.discordId);
        if(projectMember) {
            let enumValues = Object.values(Role);
            for(let i = 0; i < enumValues.length; i++){
                if(projectMember.hasRole(enumValues[i] as Role)){
                    roles.push(enumValues[i] as Role);
                }
            }
        }
        return roles;
    }
    getAllPermissions(member: IMember): Permission[] {
        let permissions: Permission[] = [];
        const projectMember = this.members.find((m) => m.discordId === member.discordId);
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