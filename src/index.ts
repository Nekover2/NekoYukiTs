import "reflect-metadata"
import CustomClient from "./base/classes/CustomClient";
import Permission from "./base/NekoYuki/enums/Permission";

(async () => {
    const permissionLabel = Object.keys(Permission).filter((p) => isNaN(Number(p)));
    const permissionValue = Object.values(Permission).filter((p) => !isNaN(Number(p)));
    console.log(permissionLabel);
    console.log(permissionValue);
    
    console.log(permissionLabel[permissionValue.indexOf(Permission.CreateProject)]);
})();

(new CustomClient()).Init();
