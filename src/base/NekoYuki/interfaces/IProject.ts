import Permission from "../enums/Permission";
import ProjectStatus from "../enums/ProjectStatus";
import Position from "../enums/Position";
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
    addMember(member: IMember, roles: Position[], permissions : Permission[]) : IProjectMember | undefined;
    removeMember(member: IMember) : void;
    hasMember(member: IMember) : boolean;
    
    hasProjectPermission(member: IMember, permission: Permission) : boolean;
    hasProjectRole(member: IMember, role: Position) : boolean;
    
    addPosition(member: IMember, role: Position) : void;
    removePosition(member: IMember, role: Position) : void;

    addPermission(member: IMember, permission: Permission) : void;
    removePermission(member: IMember, permission: Permission) : void;

    getAllPositions(member: IMember) : Position[];
    getAllPermissions(member: IMember) : Permission[];
    permissionString(member: IMember) : string;
}