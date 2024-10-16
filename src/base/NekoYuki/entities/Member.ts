import { Column, Entity, JoinTable, OneToMany, PrimaryColumn } from "typeorm";
import MemberStatus from "../enums/MemberStatus";
import Permission from "../enums/Permission";
import IMember from "../interfaces/IMember";
import IProjectMember from "../interfaces/IProjectMember";
import ProjectMember from "./ProjectMember";
import MemberGeneralRole from "./GeneralMemberRole";
import ChapterMember from "./ChapterMember";


@Entity()
export default class Member implements IMember {
    @PrimaryColumn()
    discordId: string = "";

    @Column()
    status: MemberStatus = MemberStatus.ACTIVE;

    @Column()
    permissions: number = 0;

    @Column()
    joinDate: Date = new Date();

    @Column()
    gmail: string = "";

    @OneToMany(() => ProjectMember, projectMember => projectMember.member, {onDelete: "CASCADE"})
    // @ts-ignore
    joinedProjects: IProjectMember[];

    @OneToMany(() => MemberGeneralRole, generalMemerRole => generalMemerRole.member, {onDelete: "CASCADE"})
    // @ts-ignore
    generalRoles : MemberGeneralRole[];

    @OneToMany(() => ChapterMember, chapterMember => chapterMember.member, {onDelete: "CASCADE"})
    // @ts-ignore
    chapterAttended: ChapterMember[];
    joinedProjectCount : number = -1;

    hasPermission(permission: Permission): boolean {
        if ((this.permissions & permission) === permission) {
            return true;
        }
        for (let i = 0; i < this.generalRoles.length; i++) {
            if (this.generalRoles[i].role.hasPermission(permission)) {
                return true;
            }
        }
        return false;
    }

    hasOwnPermission(permission: Permission): boolean {
        return (this.permissions & permission) === permission;
    }
    addPermission(permission: Permission): void {
        this.permissions |= permission;
    }
    removePermission(permission: Permission): void {
        this.permissions &= ~permission;
    }
    getAllPermissions(): Permission[] {
        let permissions: Permission[] = [];
        const permissionValues = Object.values(Permission);
        for (let i = 0; i < permissionValues.length; i++) {
            if ((this.permissions & (permissionValues[i] as Permission)) === permissionValues[i]) {
                permissions.push(permissionValues[i] as Permission);
            }
        }
        return permissions;
    }
    permissionString(): Array<string> {
        let permissions: Permission[] = this.getAllPermissions();
        let permissionArray: Array<string> = [];
        for (let i = 0; i < permissions.length; i++) {
            permissionArray.push(this.getPermissionString(permissions[i]));
        }
        return permissionArray;
    }

    allRoleString(): string {
        let res = "";
        this.generalRoles.forEach((role) => {
            res += role.role.Name + ", ";
        });
        if (res.length === 0) {
            return "No role";
        }
        return res;
    }
    getPermissionString(permission: Permission) {
        const permissionLabel = Object.keys(Permission).filter((p) => isNaN(Number(p)));
        const permissionValue = Object.values(Permission).filter((p) => !isNaN(Number(p)));
        return permissionLabel[permissionValue.indexOf(permission)];
    }
    addJoinedProject(joinedProjectInfo: IProjectMember): void {
        if (joinedProjectInfo.member.discordId !== this.discordId) {
            return;
        }
        if (this.joinedProjects.find((project) => project.id === joinedProjectInfo.project.id)) {
            return;
        }
        this.joinedProjects.push(joinedProjectInfo);
    }
}