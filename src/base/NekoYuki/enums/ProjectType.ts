enum ProjectType {
    Novel = "Novel",
    Manga = "Manga",
    OLN = "OLN",
    VisualNovel = "Visual Novel",
    Anime = "Anime",
}

class ProjectTypeHelper {
    static getProjectTypeLabels() : string [] {
        return Object.keys(ProjectType).filter((p) => isNaN(Number(p)));
    }
    static getProjectTypeValues() : string [] {
        return Object.values(ProjectType).filter((p) => !isNaN(Number(p)));
    }
    static getProjectTypeLabel(type: ProjectType) : string {
        return Object.keys(ProjectType).filter((p) => isNaN(Number(p)))[Object.values(ProjectType).indexOf(type)];
    }
}

export default ProjectType;
export { ProjectTypeHelper };