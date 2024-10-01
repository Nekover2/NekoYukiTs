import MemberStatus from "../enums/MemberStatus";
import Permission from "../enums/Permission";
import Position from "../enums/Position";
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
    hasRole(role : Position)  : boolean;
    hasPermission(permission : Permission) : boolean;

    addPosition(role : Position) : void;
    removePosition(role : Position) : void;
    
    addPermission(permission : Permission) : void;
    removePermission(permission : Permission) : void;

    getAllPositions() : Position[];
    getAllPermissions() : Permission[];
    permissionString() : string;

    updateLastActive() : void;
    setStatus(status : MemberStatus) : void;
    setOwner(isOwner : boolean) : void;
}