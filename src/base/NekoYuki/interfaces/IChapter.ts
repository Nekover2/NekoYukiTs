import IMember from "./IMember";
import IProject from "./IProject";
import IProjectMember from "./IProjectMember";

export default interface IChapter {
    id: number;
    title: string;

    creationDate: Date;
    verified: boolean;
    project: IProject;
}