enum Position {
    NovelTranslator = 1 << 0,
    NovelEditor = 1 << 1,
    NovelProofreader = 1 << 2,
    MangaTranslator = 1 << 3,
    MangaEditor = 1 << 4,
    MangaQualityChecker = 1 << 5,
}

export default Position;

export class PositionHelper {
    static getRoleLabel(role: Position): string {
        const roleValue = Object.values(Position).filter((r) => !isNaN(Number(r)));
        const roleLabel = Object.keys(Position).filter((r) => isNaN(Number(r)));
        return roleLabel[roleValue.indexOf(role)]; 
    }
    static getPositionString(role: Position[]): string {
        if(role.length === 0) {
            return "No role";
        }
        return role.map((r) => PositionHelper.getRoleLabel(r)).join(", ");
    }
}