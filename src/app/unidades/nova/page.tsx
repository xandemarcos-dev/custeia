import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewUnitForm } from "./NewUnitForm";

export default function NovaUnidadePage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Nova unidade</CardTitle>
            <p className="text-sm text-muted-foreground">
              Cadastre uma unidade de medida. Exemplos: kg (1000g), L (1000ml), dúzia (12 un).
            </p>
          </CardHeader>
          <CardContent>
            <NewUnitForm />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
