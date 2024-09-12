enum Permission {
    CreateProject = 1 << 0,
    DeleteProject = 1 << 1,
    UpdateProject = 1 << 2,

    MangeMember = 1 << 3,
    MangePermission = 1 << 4,
    MangeProject = 1 << 5,


}

export default Permission;