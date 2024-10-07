import "reflect-metadata"
import CustomClient from "./base/classes/CustomClient";
import Permission from "./base/NekoYuki/enums/Permission";
import ProjectType, { ProjectTypeHelper } from "./base/NekoYuki/enums/ProjectType";

(async () => {
    const projectTypeLabels = ProjectTypeHelper.getProjectTypeLabels();
    const projectTypeValues = ProjectTypeHelper.getProjectTypeValues(); 
    const projectTypeLabel = ProjectTypeHelper.getProjectTypeLabel(ProjectType.Novel);
    console.log(projectTypeLabels);
    console.log(projectTypeValues);
    console.log(projectTypeLabel);
    
})();

(new CustomClient()).Init();
