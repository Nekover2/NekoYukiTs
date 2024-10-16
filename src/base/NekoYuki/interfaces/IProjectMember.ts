import GeneralRole from "../entities/GeneralRole";
import Member from "../entities/Member";
import Project from "../entities/Project";
import MemberStatus from "../enums/MemberStatus";
import Permission from "../enums/Permission";
import IMember from "./IMember";
import IProject from "./IProject";

export default interface IProjectMember {
    id : number;
    member: Member;
    project: Project;
    permissions: number;
    joinDate : Date;
    status : MemberStatus;
    lastActive : Date;
    isOwner : boolean;
    role: GeneralRole;

    hasPermission(permission : Permission) : boolean;
    addPermission(permission : Permission) : void;
    removePermission(permission : Permission) : void;
    getAllPermissions() : Permission[];
    permissionString() : string;

    setRole(role: GeneralRole) : void;
    updateLastActive() : void;
    setStatus(status : MemberStatus) : void;
    setOwner(isOwner : boolean) : void;
}