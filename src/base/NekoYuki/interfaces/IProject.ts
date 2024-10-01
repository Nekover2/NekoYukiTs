import Permission from "../enums/Permission";
import ProjectStatus from "../enums/ProjectStatus";
import IMember from "./IMember";
import IProjectMember from "./IProjectMember";
import GeneralRole from "../entities/GeneralRole";
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
    addMember(member: IMember, roles: GeneralRole, permissions : Permission[]) : IProjectMember | undefined;
    removeMember(member: IMember) : void;
    hasMember(member: IMember) : boolean;
    
    hasProjectPermission(member: IMember, permission: Permission) : boolean;

    addPermission(member: IMember, permission: Permission) : void;
    removePermission(member: IMember, permission: Permission) : void;

    getAllPermissions(member: IMember) : Permission[];
    permissionString(member: IMember) : string;
}