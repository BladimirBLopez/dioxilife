import RegistroForm from "./RegistroForm";

type Props = {
  searchParams: Promise<{
    ref?: string | string[];
  }>;
};

export default async function RegistroPage({ searchParams }: Props) {
  const params = await searchParams;

  const codigoInicial = Array.isArray(params.ref)
    ? params.ref[0]
    : params.ref || "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <RegistroForm codigoInicial={codigoInicial} />
    </main>
  );
}
