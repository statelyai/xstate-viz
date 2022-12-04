export const registryLinks = {
  viewUserById: (id: string) =>
    `${process.env.NEXT_PUBLIC_REGISTRY_PUBLIC_URL}/user/${id}`,
  editSystem: (id: string) =>
    `${process.env.NEXT_PUBLIC_REGISTRY_PUBLIC_URL}/projects/${id}/edit`,
  sourceFileOgImage: (id: string) =>
    `${process.env.NEXT_PUBLIC_REGISTRY_PUBLIC_URL}/viz/machines/${id}.png`,
};
