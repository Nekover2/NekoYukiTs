import MemberGeneralRole from "../entities/GeneralMemberRole";
import MemberStatus from "../enums/MemberStatus";
import Permission from "../enums/Permission";
import IProjectMember from "./IProjectMember";
export default interface IMember{
    discordId : string;
    status : MemberStatus;
    permissions: number;
    joinDate : Date;
    gmail : string;
    joinedProjects : IProjectMember[];
    generalRoles : MemberGeneralRole[];
    hasPermission(permission : Permission) : boolean;

    addPermission(permission : Permission) : void;
    removePermission(permission : Permission) : void;
    getAllPermissions() : Permission[];
    permissionString() : Array<string>;
    
    allRoleString() : string;

    addJoinedProject(joinedProjectInfo : IProjectMember) : void;
}