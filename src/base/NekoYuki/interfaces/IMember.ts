import MemberStatus from "../enums/MemberStatus";
import Role from "../enums/Role";
import Permission from "../enums/Permission";
import IProject from "./IProject";
import IProjectMember from "./IProjectMember";
export default interface IMember{
    discordId : string;
    status : MemberStatus;
    roles : number;
    permissions: number;
    joinDate : Date;
    gmail : string;
    joinedProjects : IProjectMember[];
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

    addJoinedProject(joinedProjectInfo : IProjectMember) : void;
}