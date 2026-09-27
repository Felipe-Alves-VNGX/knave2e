# Fichas como documentos físicos

As 12 fichas existentes recebem papel de fibras, encadernação de couro, campos manuscritos, carimbos ilustrados e marca-páginas laterais de tecido. A ficha de personagem conserva a organização da referência: atributos à esquerda, proteção e saúde ao centro, experiência e retrato à direita. Inventário e descrição continuam em abas próprias.

## Instalação e revisão

Esta alteração faz parte do sistema `knave2e`, não é um módulo separado. Para uma instalação manual, copie os arquivos desta branch para `Data/systems/knave2e`, com o Foundry desligado, preservando o nome da pasta. Faça backup da instalação anterior. Reinicie o Foundry e recarregue o navegador. Nenhuma migração de dados é necessária.

Os links de atualização do manifesto ainda apontam para o projeto original: uma atualização pelo instalador pode substituir estas fichas. Esta branch não modifica canais de distribuição nem publica uma release.

- `npm ci && npm run build`: compila o SCSS.
- `npm run preview:sheets`: renderiza os 12 templates reais com dados fictícios, compara os campos e comandos com a revisão anterior e grava `docs/sheets-preview.html`.
- Abra `docs/sheets-preview.html` no navegador para navegar entre as fichas e suas abas.

A prévia usa uma aproximação mínima do CSS base do Foundry. Não executa o Foundry, não salva dados e não realiza rolagens. Os exemplos não são personagens pré-gerados prontos para jogar.

## Validação

O manifesto existente declara Foundry 10–14 e verificação em 14. Foram preservados as classes de sheet V1, os tipos de documento, os caminhos dos campos, os comandos e a lógica do sistema. Isto não substitui um teste dentro do Foundry; nenhuma verificação em uma sessão licenciada foi realizada neste ambiente.

Antes de usar na campanha, verificar em um mundo de teste:

1. Editar e reabrir nome, atributos, PV, ferimentos e XP; comparar configurações automáticas ligadas/desligadas.
2. Abrir inventário, arrastar um item, criar/editar/apagar item, equipar armadura, atacar, rolar dano, conjurar, preparar poção e descansar.
3. Abrir as cinco categorias de atores e sete de itens, incluindo descrições longas e nomes extensos.
4. Abrir ficha com usuário observador; confirmar que a permissão continua impedindo edição.
5. Redimensionar janelas, usar zoom de 125% e navegar pelos campos com Tab.

## Arquivos e materiais

- `scss/components/_document.scss`: tema limitado a `.knave2e.document-sheet`.
- `css/knave2e.css`: compilação já incluída; não é necessário Node para instalar.
- `assets/document-paper.webp`: papel gerado por IA (aprox. 266 KiB).
- `assets/document-leather.webp`: couro gerado por IA (aprox. 571 KiB).
- Cabeçalhos novos usam chaves de localização em `lang/en.json`; o idioma existente do sistema foi preservado.

Os materiais foram criados com a ferramenta integrada de geração de imagens e convertidos para WebP. Nenhuma página, tabela, ilustração ou texto de regras do PDF foi incorporada ao repositório. O logo já existente permanece com seus créditos originais. As texturas não contêm texto: nomes, valores e controles são HTML editável.

### Prompts dos materiais

**Papel:** “Production background texture for a skeuomorphic medieval RPG character sheet in Foundry VTT. One portrait 2:3 full-bleed flat scan of antique handmade rag paper. Entire canvas is paper, no surrounding tabletop and no perspective. Pale warm ivory and muted oat coloration, detailed natural cotton fibers and subtle tooth, softly worn ochre edges, tiny foxing mainly in the outer 8%, faint horizontal and vertical folds, handling patina. Central 80% very light and low contrast for legible overlaid dark text. No excessive yellow, burnt edges, dramatic stains, objects, drawings, symbols, text, borders or watermarks. Even scanner lighting.”

**Couro:** “Full-bleed material background texture for a medieval expedition journal UI. Square orthographic macro scan of aged dark umber vegetable-tanned leather, fine irregular grain, pores and shallow wrinkles, hand-rubbed patina, subtle warm brown highlights. Quiet low-contrast mottling, distributed wear, diffuse scanner lighting. No central subject, vignette, page, frame, stitching, embossing, symbols, text, objects or perspective. Entire canvas is material. Tactile and old but well cared for.”


## Revisão visual: manuscrito e marca-páginas

- Fontes locais: IM FELL English / English SC para impressão antiga; Caveat para anotações e valores. Licenças OFL e fontes incluídas em `assets/fonts/`.
- Marca-páginas coloridos na margem direita da ficha de personagem, com espaço reservado dentro da janela. Navegação com clique, Tab, Enter ou Espaço.
- Atributos e nível usam um carimbo de tinta; CA usa um escudo desenhado. Todos os números continuam campos HTML, sem texto embutido nas imagens.
- PV em anotação ao lado de um coração ilustrado; ferimentos registrados como atual / máximo. Os valores continuam nos campos originais.
- Descrição e inventário usam a ilustração de um diário; tabelas parecem registros manuscritos. Descanso e rolagens recebem molduras de carimbo.
- Retrato como recorte de papel fixado por cantos; checkboxes como marcas de tinta e sliders como escalas riscadas.
- Janela de personagem padrão de 900 × 860; em 600 px a disposição passa para duas colunas, mantendo os marca-páginas acessíveis. Há rolagem vertical quando necessário.

Novas artes geradas com a ferramenta integrada de IA, com transparência real, convertidas para WebP de 384 px. Arquivos: `assets/ink-seal.webp`, `assets/ink-heart.webp`, `assets/ink-shield.webp`, `assets/ink-journal.webp`.

Prompts de produção: (1) círculo de carimbo irregular em tinta sépia, anel duplo com hachura e 70% do centro transparente para números; (2) coração anatomicamente reconhecível em tinta sépia com aguada vermelho-tijolo, ilustração de caderno médico sem gore; (3) contorno de escudo medieval à pena, hachura apenas na borda e centro vazio para número editável; (4) diário aberto e pena, desenho marginal em tinta sépia, hachuras e rabiscos sem palavras legíveis. Todos isolados em transparência, sem texto, moldura de página ou sombra.

Verificações desta revisão: compilação SCSS; 24 comparações de campos/comandos com o sistema original; 12 fichas renderizadas em 900 e 600 px; fontes carregadas localmente; marca-páginas clicáveis e acionáveis por teclado na prévia. A validação de rolagens, persistência e permissões dentro do Foundry continua pendente.


## Virada de página em 3D

Ao selecionar um marca-páginas, a folha anterior gira em perspectiva com sombra e mudança de iluminação. Ao avançar, a folha atual sai pela lombada esquerda; ao voltar, a folha anterior retorna pela mesma lombada sobre a atual. A volta inverte o movimento e a iluminação, sem trocar o eixo para a borda direita. Duração: 480 ms. É uma aproximação de folha rígida em CSS 3D, sem a simulação de curvatura do DearFlip. Nenhum código do DearFlip foi incorporado.

A implementação está em `module/sheets/document-motion.mjs` e `scss/components/_page-turn.scss`. A mesma função é executada pela prévia HTML. Durante a transição há uma cópia visual sem nomes de campos, IDs ou edição, marcada como `inert` e `aria-hidden`. O formulário real permanece no lugar, e o controlador de abas original continua responsável pela navegação.

A animação é cancelada ao trocar rapidamente de aba, redimensionar a largura, fechar ou renderizar novamente a ficha. Não roda quando a preferência do sistema é reduzir movimento. Não é ativada por alterações comuns de atributos ou PV.

Verificado na prévia: ativação da aba correta, preservação dos valores de formulário, ausência de campos e IDs duplicados na cópia visual, trocas rápidas, redução de movimento e limpeza no redimensionamento. Teste dentro do Foundry permanece pendente.

Demonstração animada: `docs/page-turn-preview.gif`. Para experimentar com cliques, abra `docs/sheets-preview.html`.


## Páginas de tamanho comum e inventário dividido

As três páginas participam da mesma medição de layout, inclusive quando inativas. A maior altura natural define a folha de todas elas. Não há altura fixa em pixels nem rolagem interna obrigatória; se a janela for menor, a janela pode rolar normalmente. A proporção A5 (148 × 210 mm, aproximadamente 1:1,42) serve como referência mínima. Em janelas estreitas ou com anotações extensas, a necessidade de espaço prevalece sobre essa proporção.

Referência de formato: https://www.adobe.com/uk/creativecloud/design/discover/a5-format.html

O inventário contém as seções All, Arms & armour, Magic e Equipment, com seis entradas por subpágina. Armas e armaduras ficam juntas; livros de magia e poções ficam em Magic; equipamentos e fontes de luz ficam em Equipment. All inclui todos os itens. As setas percorrem as subpáginas. O espaço de linhas é reservado conforme o total de itens, evitando que a última subpágina, mais curta, diminua a folha. A seção e subpágina são mantidas quando o Foundry renderiza novamente a mesma janela.

Verificações: igualdade das três alturas em larguras de 900 e 600 px; 36 itens acessíveis em seis subpáginas, sem mudança de altura; categorias e limites das setas; crescimento conjunto diante de anotações longas; animação e preservação de valores continuam passando na prévia. Não houve sessão de teste dentro do Foundry.
