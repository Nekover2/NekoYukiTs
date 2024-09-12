enum Role {
    NovelTranslator = 1 << 0,
    NovelEditor = 1 << 1,
    NovelProofreader = 1 << 2,
    MangaTranslator = 1 << 3,
    MangaEditor = 1 << 4,
    MangaQualityChecker = 1 << 5,
}

export default Role;