/**
 * Indica que el cliente autorizado ya tiene
 * una prueba alimentaria pendiente.
 *
 * No almacena nombres, glucosa, tokens
 * ni información médica.
 *
 * El flujo público transforma este error
 * en una respuesta HTTP 409.
 */
export class PruebaPendienteExistente extends Error {
  constructor() {
    super("Existe una prueba pendiente");

    this.name = "PruebaPendienteExistente";
  }
}
