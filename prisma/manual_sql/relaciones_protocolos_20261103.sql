-- APLICADO MANUALMENTE EN NEON EL 2026-11-03.
-- REGISTRO HISTORICO: NO EJECUTAR DE NUEVO.

-- PROPUESTA: NO EJECUTAR TODAVIA
-- Tabla independiente de relaciones entre protocolos.
-- No altera el contenido de los 26 protocolos.

CREATE TABLE "RelacionProtocolo" (
  "protocoloId" TEXT NOT NULL,
  "relacionadoId" TEXT NOT NULL,
  "orden" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RelacionProtocolo_pkey"
    PRIMARY KEY ("protocoloId", "relacionadoId"),

  CONSTRAINT "RelacionProtocolo_sin_autorelacion"
    CHECK ("protocoloId" <> "relacionadoId")
);

CREATE INDEX "RelacionProtocolo_relacionadoId_idx"
  ON "RelacionProtocolo"("relacionadoId");

ALTER TABLE "RelacionProtocolo"
  ADD CONSTRAINT "RelacionProtocolo_protocoloId_fkey"
  FOREIGN KEY ("protocoloId")
  REFERENCES "Protocolo"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RelacionProtocolo"
  ADD CONSTRAINT "RelacionProtocolo_relacionadoId_fkey"
  FOREIGN KEY ("relacionadoId")
  REFERENCES "Protocolo"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
