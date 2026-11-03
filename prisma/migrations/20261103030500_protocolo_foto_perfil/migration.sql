-- Foto de perfil independiente de la portada.
-- Se conserva la información existente.

ALTER TABLE "Protocolo"
ADD COLUMN IF NOT EXISTS "fotoPerfilUrl" TEXT;

-- Copiar miniaturas antiguas al nuevo campo.
UPDATE "Protocolo"
SET "fotoPerfilUrl" = "imagenUrl"
WHERE "fotoPerfilUrl" IS NULL
  AND "imagenUrl" IS NOT NULL;
