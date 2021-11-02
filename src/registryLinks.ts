export const registryLinks = {
  viewUserById: (id: string) =>
    `${process.env.NEXT_PUBLIC_REGISTRY_PUBLIC_URL}/user/${id}`,
  editSystem: (id: string) =>
    `${process.env.NEXT_PUBLIC_REGISTRY_PUBLIC_URL}/systems/${id}/edit`,
  sourceFileOgImage: (id: string) =>
    `${process.env.NEXT_PUBLIC_REGISTRY_PUBLIC_URL}/machines/${id}.png`,
};
