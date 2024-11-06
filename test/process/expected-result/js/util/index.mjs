export * from "../main/index.js";
export const fn = () => {
    import("../main/index.js").then(({ qualifier }) => {
        return qualifier;
    });
    return import("../main/index.js");
};
