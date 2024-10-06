import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export default class GuildConfig {
    @PrimaryColumn()
    guildId: string = "";
    @Column()
    rootNovelChannelId: string = "";
    @Column()
    rootMangaChannelId: string = "";
    @Column()
    rootOLNChannelId: string = "";
}