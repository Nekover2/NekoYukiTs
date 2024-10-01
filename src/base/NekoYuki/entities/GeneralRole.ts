import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import IGeneralRole from "../interfaces/IGeneralRole";
import Permission, { PermissionHelper } from "../enums/Permission";
import Member from "./Member";
import MemberGeneralRole from "./GeneralMemberRole";

@Entity()
export default class GeneralRole implements IGeneralRole {
    @PrimaryGeneratedColumn()
    // @ts-ignore
    Id: number;
    @Column()
    Name: string = "";
    @Column()
    Permissions: number = 0;
    @Column()
    CreatedAt: Date = new Date();
    @OneToMany(() => MemberGeneralRole, generalMemerRole => generalMemerRole.role)
    // @ts-ignore
    Members: Member[];
    hasPermission(permission: Permission) {
        return (this.Permissions & permission) === permission;
    }
    addPermission(permission: Permission) {
        this.Permissions |= permission;
    }
    removePermission(permission: Permission) {
        this.Permissions &= ~permission;
    }
    addPermissions(permissions: Permission[]) {
        permissions.forEach((p) => this.addPermission(p));
    }
    removePermissions(permissions: Permission[]) {
        permissions.forEach((p) => this.removePermission(p));
    }
    setPermissions(permissions: Permission[]) {
        this.Permissions = 0;
        this.addPermissions(permissions);
    }
    getPermissions() : Permission[] {
        const permissions: Permission[] = [];
        let permissionEnum = Object.values(Permission).filter((v) => typeof v === "number") as Permission[];
        permissionEnum.forEach((p) => {
            if (this.hasPermission(p)) {
                permissions.push(p);
            }
        });
        return permissions;
    }

    getPermissionString() : string {
        const str =  PermissionHelper.getPermissionString(this.getPermissions());
        if(str.length === 0) {
            return "No permission";
        }
        return str;
    }
}