// =======================================
// ABAS ACEITAS
// =======================================

export const INVENTORY_SHEET_NAMES = [
  "Mapeamento",
  "Inventário de dados Cliente",
  "Inventario Cliente",
  "Inventário",
  "Inventario",
  "Inventario LGPD",
];

// =======================================
// COLUNAS OBRIGATÓRIAS
// =======================================

export const INVENTORY_REQUIRED_FIELDS = ["id","area","processo"];
// =======================================
// MAPEAMENTO DE COLUNAS
// =======================================

export const COLUMN_MAP={

id:[
"ID",
"id",
"idsubprocesso"
],

empresa:[
"Empresa"
],

area:[
"Nome da área de negócio",
"Área de negócio"
],

responsavel:[
"Nome e e-mail do responsável pelo processo"
],

processo:[
"Nome do processo"
],

subprocesso:[
"Subprocesso",
"Descrição do sub-processo"
],

descricao:[
"Descrição do sub-processo"
],

dados:[
"Quais dados?"
],

titular:[
"Tipo do Titular?"
],

sensivel:[
"Dado Sensível?",
`Utiliza dado sensível?
Se o dado revela saúde, biometria, crença, política, origem racial, sindicato, genética ou vida sexual, trate como sensível.`
],

dadosSensivel:[
"Quais dados sensíveis?"
],

menor:[
"Utiliza algum tipo de dado de menores de 18 anos?"
],

dadosMenor:[
"Quais os dados de menores de 18 anos?"
],

baseLegal:[
"Base Legal",
"Base Legal de Tratamento"
],

armazenamento:[
"Como e onde são armazenado os dados físicos e digitais do processo?"
],

formacompartilhamento:[
"De que forma o dado é compartilhado?"
],

terceiros:[
"Há compartilhamento de dados com Terceiros e/ou Prestadores de Serviços?"
],

nomeTerceiro:[
"Informe o nome do Terceiro e/ou Prestador de Serviço que recebe os dados."
],

transferencia:[
"Há transferência internacional de dados?"
],

paises:[
"Caso sim, informe quais os Países e Estados que recebem estes dados."
]

};

// =======================================
// NORMALIZA TEXTO
// =======================================

export function normalize(text) {
  return String(text || "")
    .toLowerCase()

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g, "")

    .trim();
}

// =======================================
// ENCONTRA ABA
// =======================================

export function findInventorySheet(workbook) {
  if (!workbook || !workbook.SheetNames) {
    throw new Error("Arquivo inválido");
  }

  const found = workbook.SheetNames.find((sheet) =>
    INVENTORY_SHEET_NAMES.some(
      (valid) => normalize(sheet) === normalize(valid),
    ),
  );

  if (!found) {
    throw new Error(
      `Nenhuma aba de inventário encontrada.

Abas aceitas:

${INVENTORY_SHEET_NAMES.join(", ")}`,
    );
  }

  return found;
}

// =======================================
// VALIDA COLUNAS
// =======================================


export function validateInventoryColumns(headers) {

    const missing=[];

    INVENTORY_REQUIRED_FIELDS.forEach(field=>{

        // campo interno existe?
        if(!COLUMN_MAP[field]){

            console.error(
                `[ERRO MAPEAMENTO] Campo interno "${field}" não encontrado`
            );

            missing.push(
                `${field} (campo interno inexistente)`
            );

            return;
        }

        // procura se o campo interno recebido existe
        const exists=headers.includes(field);

        if(!exists){

            missing.push(field);

        }

    });

    if(missing.length){

        throw new Error(

`Colunas obrigatórias ausentes:

${missing.join("\n")}

Colunas encontradas:

${headers.join("\n")}`

        );

    }

    return true;

}