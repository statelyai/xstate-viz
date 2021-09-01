export const registryLinks = {
  viewUserById: (id: string) =>
    `${process.env.NEXT_PUBLIC_REGISTRY_PUBLIC_URL}/user/${id}`,
  editSourceFile: (id: string) =>
    `${process.env.NEXT_PUBLIC_REGISTRY_PUBLIC_URL}/file/${id}/edit`,
  sourceFileOgImage: (id: string) =>
    `${process.env.NEXT_PUBLIC_REGISTRY_PUBLIC_URL}/machines/${id}.png`,
};
