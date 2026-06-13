import { Header } from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { NewUnitForm } from "./NewUnitForm";

export default function NovaUnidadePage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-10">
        <PageHeader
          title="Nova unidade"
          description="Cadastre uma unidade de medida. Exemplos: kg (1000g), L (1000ml), dúzia (12 un)."
        />
        <Card>
          <CardContent>
            <NewUnitForm />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
