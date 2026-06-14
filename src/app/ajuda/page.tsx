import { Header } from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
import { ChevronDown } from "lucide-react";

const sections = [
  { id: "comecando", label: "Começando" },
  { id: "visao-geral", label: "Visão geral" },
  { id: "insumos", label: "Insumos" },
  { id: "compras", label: "Compras" },
  { id: "produtos", label: "Produtos" },
  { id: "producao", label: "Produção" },
  { id: "margem", label: "Margem" },
  { id: "simulador", label: "Simulador" },
  { id: "reposicao", label: "Reposição" },
  { id: "unidades", label: "Unidades" },
];

function Detalhe({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="group mt-4 overflow-hidden rounded-xl border border-[#e8ebef] bg-[#f8fafb]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-[#0f9b8e]">
        Entenda melhor: {titulo}
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-2 px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

function Secao({
  id,
  titulo,
  intro,
  children,
}: {
  id: string;
  titulo: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-extrabold tracking-tight text-[#16202b]">{titulo}</h2>
      {intro && <p className="mt-1.5 text-[15px] text-muted-foreground">{intro}</p>}
      <div className="mt-3 text-[15px] leading-relaxed text-[#2a3540]">{children}</div>
    </section>
  );
}

export default function AjudaPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <PageHeader
          title="Ajuda"
          description="Manual do BatchFlow — como usar cada tela. Dica: use Ctrl+P para salvar em PDF."
        />

        <div className="grid gap-8 lg:grid-cols-[210px_1fr]">
          <nav className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#9aa4ae]">
              Conteúdo
            </p>
            <ul className="space-y-0.5">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#2a3540] transition-colors hover:bg-[#e6faf6] hover:text-[#0f9b8e]"
                  >
                    <span className="w-4 text-right text-xs tabular-nums text-[#9aa4ae]">
                      {i + 1}
                    </span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-10">
            <Secao
              id="comecando"
              titulo="Começando"
              intro="O BatchFlow controla custo, estoque e margem dos seus doces. Você alimenta o sistema com compras e produtos, e ele calcula sozinho quanto custa cada doce e se o preço está dando a margem certa."
            >
              <p className="font-semibold text-[#16202b]">O fluxo do dia a dia:</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5">
                <li>Registre as compras de insumos — isso atualiza o custo de cada ingrediente.</li>
                <li>Monte seus produtos (a ficha técnica: quais insumos e quanto de cada).</li>
                <li>Acompanhe a Margem para ver quem está abaixo da meta de lucro.</li>
                <li>Registre a produção para o estoque dos insumos baixar automaticamente.</li>
              </ol>
            </Secao>

            <Secao
              id="visao-geral"
              titulo="Visão geral"
              intro="O retrato do negócio agora. É a primeira tela ao entrar."
            >
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <b>Cards do topo:</b> produtos abaixo da meta (em vermelho, é onde agir), insumos
                  para repor, e os totais. Clique em cada um para ir à tela.
                </li>
                <li>
                  <b>Capital parado em estoque:</b> quanto dinheiro está parado em insumos hoje.
                </li>
                <li>
                  <b>Atenção primeiro:</b> os produtos com a margem mais distante da meta — os que
                  pedem reajuste de preço.
                </li>
              </ul>
              <Detalhe titulo="o card da direita">
                <p>
                  Ele muda conforme a situação: se algum insumo subiu de preço na última compra,
                  mostra o alerta; se há ganho a capturar, mostra o ganho por mês; senão, convida a
                  informar o volume de vendas para estimar esse ganho.
                </p>
              </Detalhe>
            </Secao>

            <Secao
              id="insumos"
              titulo="Insumos"
              intro="Seus ingredientes e embalagens — a matéria-prima dos doces."
            >
              <p className="font-semibold text-[#16202b]">Para cadastrar:</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5">
                <li>Vá em Insumos → Novo insumo.</li>
                <li>Informe nome, categoria e a unidade base (g, ml, unidade).</li>
                <li>O custo médio aparece sozinho depois da primeira compra registrada.</li>
              </ol>
              <Detalhe titulo="custo médio ponderado">
                <p>
                  Cada compra recalcula a média do custo, ponderada pelo estoque que você já tinha.
                  Assim o custo reflete o que você realmente paga ao longo do tempo — não só o preço
                  da última compra. É esse custo que entra no cálculo de todos os produtos.
                </p>
              </Detalhe>
            </Secao>

            <Secao
              id="compras"
              titulo="Compras"
              intro="Toda entrada de insumo. É o que mantém o custo atualizado."
            >
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>Vá em Insumos → Nova compra (ou pelo atalho da Visão geral).</li>
                <li>Escolha o insumo, a unidade de compra, a quantidade, o preço total e o frete.</li>
                <li>Ao salvar, o custo médio do insumo é recalculado automaticamente.</li>
              </ol>
              <Detalhe titulo="por que o frete importa">
                <p>
                  O frete é somado e rateado no custo. Assim o custo efetivo do insumo reflete o que
                  ele custou de verdade até chegar na sua cozinha — e a margem dos doces fica honesta.
                </p>
              </Detalhe>
            </Secao>

            <Secao
              id="produtos"
              titulo="Produtos"
              intro="Seus doces e suas fichas técnicas (a receita de custo de cada um)."
            >
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>Vá em Produtos → Novo produto.</li>
                <li>Informe nome, rendimento (porções) e preço de venda.</li>
                <li>Adicione os insumos da ficha técnica com a quantidade de cada um.</li>
                <li>Venda/mês é opcional — informe para o sistema estimar o ganho na tela de Margem.</li>
              </ol>
              <Detalhe titulo="margem, custos fixos e preço sugerido">
                <p>
                  <b>Margem</b> é quanto sobra do preço depois de tirar o custo. A{" "}
                  <b>margem alvo</b> é a meta que você quer atingir.
                </p>
                <p>
                  <b>Custos fixos (%)</b> incidem sobre insumos + embalagem — uma forma de embutir
                  gás, energia, etc. no custo de cada lote.
                </p>
                <p>
                  <b>Preço sugerido</b> é o preço que daria a sua margem alvo com o custo atual. Se
                  você vende abaixo dele, está abaixo da meta.
                </p>
              </Detalhe>
            </Secao>

            <Secao
              id="producao"
              titulo="Produção"
              intro="Registre o que você produziu para o estoque acompanhar."
            >
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>Vá em Produção → escolha o produto e quantos lotes você fez.</li>
                <li>
                  O estoque dos insumos é baixado automaticamente conforme a ficha técnica do
                  produto.
                </li>
              </ol>
            </Secao>

            <Secao
              id="margem"
              titulo="Margem"
              intro="A margem real de cada produto comparada com a meta. A tela de decisão de preço."
            >
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Cada produto mostra a margem atual, a meta, o preço sugerido e o ganho/mês.</li>
                <li>O banner no topo soma quanto você ganharia ajustando os produtos abaixo da meta.</li>
              </ul>
              <Detalhe titulo="o que as cores significam">
                <p>
                  <b className="text-[#c8323c]">Vermelho</b> — o produto vende no prejuízo (margem
                  negativa).
                </p>
                <p>
                  <b className="text-[#b3741a]">Âmbar</b> — abaixo da meta, mas ainda com lucro.
                </p>
                <p>
                  <b className="text-[#1f9d6b]">Verde</b> — na meta ou a até 5 pontos dela.
                </p>
                <p>
                  O ganho/mês só aparece quando o volume de vendas do produto está informado — sem
                  ele, clique em &ldquo;definir&rdquo; para preencher.
                </p>
              </Detalhe>
            </Secao>

            <Secao
              id="simulador"
              titulo="Simulador"
              intro="Teste uma compra antes de fazer — sem registrar nada."
            >
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Escolha o insumo e preencha um ou dois fornecedores (com frete).</li>
                <li>
                  O sistema mostra qual sai mais barato, o novo custo médio e o impacto na margem dos
                  produtos que usam aquele insumo.
                </li>
              </ul>
            </Secao>

            <Secao
              id="reposicao"
              titulo="Reposição"
              intro="A lista de compras: insumos abaixo do estoque mínimo."
            >
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Mostra só os insumos que estão abaixo do mínimo, do mais crítico ao menos.</li>
                <li>O estoque mínimo de cada insumo é definido no cadastro dele.</li>
              </ul>
            </Secao>

            <Secao
              id="unidades"
              titulo="Unidades"
              intro="As unidades de medida e como elas se convertem."
            >
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Cada unidade tem um fator de conversão para a unidade base (ex.: kg = 1000 g, L =
                  1000 ml, dúzia = 12 un).
                </li>
                <li>São usadas nas compras e no cadastro de insumos para o sistema converter tudo certo.</li>
              </ul>
            </Secao>
          </div>
        </div>
      </main>
    </>
  );
}
