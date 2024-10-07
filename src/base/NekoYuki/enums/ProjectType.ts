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
        return Object.values(ProjectType);
    }
    static getProjectTypeLabel(type: ProjectType) : string {
        return Object.keys(ProjectType).filter((p) => isNaN(Number(p)))[Object.values(ProjectType).indexOf(type)];
    }
    static getProjectTypeValue(type: string) : ProjectType {
        return ProjectType[type as keyof typeof ProjectType];
    }
}

export default ProjectType;
export { ProjectTypeHelper };