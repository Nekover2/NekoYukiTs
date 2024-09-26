enum Role {
    NovelTranslator = 1 << 0,
    NovelEditor = 1 << 1,
    NovelProofreader = 1 << 2,
    MangaTranslator = 1 << 3,
    MangaEditor = 1 << 4,
    MangaQualityChecker = 1 << 5,
}

export default Role;

export class RoleHelper {
    static getRoleLabel(role: Role): string {
        const roleValue = Object.values(Role).filter((r) => !isNaN(Number(r)));
        const roleLabel = Object.keys(Role).filter((r) => isNaN(Number(r)));
        return roleLabel[roleValue.indexOf(role)]; 
    }
    static getRoleString(role: Role[]): string {
        if(role.length === 0) {
            return "No role";
        }
        return role.map((r) => RoleHelper.getRoleLabel(r)).join(", ");
    }
}