enum Permission {
    CreateProject = 1 << 0,
    DeleteProject = 1 << 1,
    UpdateProject = 1 << 2,

    MangeMember = 1 << 3,
    MangePermission = 1 << 4,
    MangeProject = 1 << 5,
}

export default Permission;

export class PermissionHelper {
    static getPermissionLabel(permission: Permission) : string {
        return Object.keys(Permission).filter((p) => isNaN(Number(p)))[Object.values(Permission).indexOf(permission)];
    }
    static getPermissionString(permission: Permission[]) : string {
        return permission.map((p) => PermissionHelper.getPermissionLabel(p)).join(", ");
    }
}