enum Permission {
    CreateProject = 1 << 0,
    DeleteProject = 1 << 1,
    UpdateProject = 1 << 2,

    ManageMember = 1 << 3,
    ManagePermission = 1 << 4,
    ManageProject = 1 << 5,
}

export default Permission;

export class PermissionHelper {
    static getPermissionLabel(permission: Permission) : string {
        const permissionValue = Object.values(Permission).filter((p) => !isNaN(Number(p)));
        const permissionLabel = Object.keys(Permission).filter((p) => isNaN(Number(p)));
        return permissionLabel[permissionValue.indexOf(permission)];
    }
    static getPermissionString(permission: Permission[]) : string {
        if(permission.length === 0) {
            return "No permission";
        }
        return permission.map((p) => PermissionHelper.getPermissionLabel(p)).join(", ");
    }
}