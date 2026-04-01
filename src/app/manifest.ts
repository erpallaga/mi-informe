import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mi Informe",
    short_name: "Mi Informe",
    description: "Registro de actividad y progreso de servicio del campo",
    start_url: "/panel",
    display: "standalone",
    background_color: "#f9f9fb",
    theme_color: "#f9f9fb",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
