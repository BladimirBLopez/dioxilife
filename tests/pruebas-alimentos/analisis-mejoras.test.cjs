const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (mod, archivo) => {
  const js = ts.transpileModule(
    fs.readFileSync(archivo, "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }
  ).outputText;

  mod._compile(js, archivo);
};

const {
  calcularCambioGlucosa,
  evaluarMedicion,
  ordenarAlimentosPorAumento,
} = require(
  "../../src/lib/pruebas-alimentos/analisis-mejoras.ts"
);

test("Calcula un aumento correctamente", () => {
  assert.equal(calcularCambioGlucosa(90, 130), 40);
});

test("Calcula una disminucion correctamente", () => {
  assert.equal(calcularCambioGlucosa(150, 120), -30);
});

test("Medicion pendiente no genera diferencia", () => {
  assert.equal(calcularCambioGlucosa(90, null), null);
});

test("Sin parametros no clasifica glucosa", () => {
  assert.equal(
    evaluarMedicion(150, null),
    "sin_parametros"
  );
});

test("Medicion pendiente no genera alerta", () => {
  assert.equal(
    evaluarMedicion(null, null),
    "sin_medicion"
  );
});

test("Compara con rangos simulados", () => {
  // Solo valores matematicos de prueba.
  // No constituyen parametros clinicos.
  const rango = { minimo: 100, maximo: 200 };

  assert.equal(
    evaluarMedicion(90, rango),
    "por_debajo"
  );
  assert.equal(
    evaluarMedicion(150, rango),
    "dentro_del_rango"
  );
  assert.equal(
    evaluarMedicion(210, rango),
    "por_encima"
  );
});

test("Rechaza rangos incorrectos", () => {
  assert.throws(() =>
    evaluarMedicion(150, {
      minimo: 200,
      maximo: 100,
    })
  );
});

test("Ordena por aumento sin alterar origen", () => {
  const datos = [
    {
      alimento: "Alimento A",
      pruebas: 2,
      promedioAntes: 100,
      promedioDespues: 120,
      diferencia: 20,
    },
    {
      alimento: "Alimento B",
      pruebas: 1,
      promedioAntes: 100,
      promedioDespues: 150,
      diferencia: 50,
    },
  ];

  const ordenados = ordenarAlimentosPorAumento(datos);

  assert.equal(ordenados[0].alimento, "Alimento B");
  assert.equal(datos[0].alimento, "Alimento A");
});

test("Sin alimentos no inventa datos", () => {
  assert.deepEqual(
    ordenarAlimentosPorAumento([]),
    []
  );
});
