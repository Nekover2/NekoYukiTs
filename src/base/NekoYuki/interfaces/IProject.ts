import Permission from "../enums/Permission";
import ProjectStatus from "../enums/ProjectStatus";
import Role from "../enums/Role";
import IMember from "./IMember";
import IProjectMember from "./IProjectMember";
export default interface IProject {
    id : number;
    name : string;
    lastUpdated : Date;
    creationDate : Date;
    status : ProjectStatus;
    ownerId : string;
    postChannelId? : string;
    members : IProjectMember[];

    // Methods
    addMember(member: IMember, roles: Role[], permissions : Permission[]) : IProjectMember | undefined;
    removeMember(member: IMember) : void;
    hasMember(member: IMember) : boolean;
    
    hasProjectPermission(member: IMember, permission: Permission) : boolean;
    hasProjectRole(member: IMember, role: Role) : boolean;
    
    addRole(member: IMember, role: Role) : void;
    removeRole(member: IMember, role: Role) : void;

    addPermission(member: IMember, permission: Permission) : void;
    removePermission(member: IMember, permission: Permission) : void;

    getAllRoles(member: IMember) : Role[];
    getAllPermissions(member: IMember) : Permission[];
    permissionString(member: IMember) : string;
}