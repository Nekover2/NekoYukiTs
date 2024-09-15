import "reflect-metadata";
import { DataSource } from "typeorm";

export const NekoYukiDataSource = new DataSource({
    type: "sqlite",
    database: "db.sqlite",
    synchronize: true,
    logging: false,
    entities: [
        `${process.cwd()}/build/base/NekoYuki/entities/*.{js,ts}`
    ],
})  