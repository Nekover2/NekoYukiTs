import MemberStatus from "../enums/MemberStatus";
import Permission from "../enums/Permission";
import Role from "../enums/Role";
import IMember from "./IMember";
import IProject from "./IProject";

export default interface IProjectMember {
    id : number;
    member: IMember;
    project: IProject;
    roles : number;
    permissions: number;
    joinDate : Date;
    status : MemberStatus;
    lastActive : Date;
    isOwner : boolean;

    // Methods
    hasRole(role : Role)  : boolean;
    hasPermission(permission : Permission) : boolean;

    addRole(role : Role) : void;
    removeRole(role : Role) : void;
    
    addPermission(permission : Permission) : void;
    removePermission(permission : Permission) : void;

    getAllRoles() : Role[];
    getAllPermissions() : Permission[];
    permissionString() : string;

    updateLastActive() : void;
    setStatus(status : MemberStatus) : void;
    setOwner(isOwner : boolean) : void;
}