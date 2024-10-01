import MemberStatus from "../enums/MemberStatus";
import Position from "../enums/Position";
import Permission from "../enums/Permission";
import IProjectMember from "./IProjectMember";
export default interface IMember{
    discordId : string;
    status : MemberStatus;
    positions : number;
    permissions: number;
    joinDate : Date;
    gmail : string;
    joinedProjects : IProjectMember[];
    // Methods
    hasRole(position : Position)  : boolean;
    hasPermission(permission : Permission) : boolean;

    addPosition(position: Position) : void;
    removePosition(position : Position) : void;

    addPermission(permission : Permission) : void;
    removePermission(permission : Permission) : void;

    getAllPositions() : Position[];
    getAllPermissions() : Permission[];
    permissionString() : Array<string>;
    
    allRoleString() : string;

    addJoinedProject(joinedProjectInfo : IProjectMember) : void;
}