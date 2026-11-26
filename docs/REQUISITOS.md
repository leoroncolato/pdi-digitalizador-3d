# Matriz de requisitos e evidências

Referência: PDF **N2 — Processamento Digital de Imagens e Computação Gráfica**, atividade de laboratório de Daniel Corrêa Da Silva, tema **1 — Digitalizador de desenhos 3D**. O documento estabelece trabalho em dupla ou trio, execução no navegador e quatro tecnologias obrigatórias. As datas de entrega e apresentação não estão definidas no PDF.

Esta matriz liga os critérios ao código e à verificação necessária. A presença de um arquivo não prova, sozinha, que o requisito funciona. Resultados de testes devem ser obtidos executando a versão entregue; não tratar os procedimentos abaixo como testes já aprovados.

## Requisitos eliminatórios e tema

| Requisito | Implementação / localização | Como verificar |
| --- | --- | --- |
| Vite, template vanilla | `package.json`, `index.html`, `vite.config.js` | Instalação limpa; executar `npm run dev`, `npm run build` e `npm run preview` |
| Dependências via npm | `package.json`, `package-lock.json` | Executar `npm ci`; conferir versões no lockfile |
| Execução 100% no navegador | `src/`, build estático em `dist/` | Abrir produção e testar o fluxo sem API de processamento |
| Captura por arquivo ou webcam | `src/capture.js` | Importar uma imagem própria; permitir webcam em HTTPS ou localhost |
| Homografia da folha | `src/vision/opencv.js` | Usar uma foto inclinada, ajustar quatro cantos e comparar a imagem retificada em formato quadrado |
| Três ou mais categorias de PDI | `src/vision/opencv.js` | Conferir homografia, cinza, suavização, limiarização, morfologia e contornos |
| Parâmetros de PDI ajustáveis | Interface e integração em `src/main.js` / `src/ui.js` | Mudar janela, constante, kernels, área ou simplificação e observar máscara e malha |
| Modelo treinado no navegador | `src/vision/model.js` | Adicionar exemplos rotulados, treinar e prever uma imagem não usada no treino |
| Inferência integrada | `src/main.js`, `src/vision/model.js` | Observar saída da rede após trocar a imagem; usar webcam para uma fonte contínua |
| Extrusão dos contornos | `src/scene/objects.js` | Importar um desenho diferente e verificar mudança na silhueta externa da geometria; furos internos não são extrudados |
| Material e animação por classe | `src/scene/scene.js`, `src/scene/objects.js` | Comparar objetos classificados como casa, árvore e carro |
| Câmera e controles de navegação | `src/scene/scene.js`, `OrbitControls` | Orbitar, aproximar e deslocar a câmera |
| Ao menos duas fontes de luz | `src/scene/scene.js` | Inspecionar a criação das luzes e a iluminação das faces |
| Geometrias, materiais e textura dinâmica | `ExtrudeGeometry`, materiais e `CanvasTexture` | Trocar o desenho e verificar atualização da geometria e textura |
| Animação no loop gráfico | `renderer.setAnimationLoop` | Observar movimento contínuo e opção de pausar animação |
| Fluxo real PDI → IA / CG | Integração dos módulos em `src/main.js` | Alterar entrada e parâmetros; a cena deve mudar conforme contornos e classe |
| FPS visível | Indicador da cena | Observar atualização do valor durante uso, sem número fixo de demonstração |
| Mínimo de 15 FPS no laboratório | Validação presencial pendente | Medir no equipamento real com o pipeline ativo; registrar ficha abaixo |
| Liberação de memória | `delete()`, `tf.tidy()` / `dispose()`, descarte do Three.js | Inspecionar código e repetir processamento para investigar crescimento contínuo |

## Critérios de avaliação

| Critério | Pontos | Evidência a apresentar |
| --- | ---: | --- |
| Integração PDI + CG | 2,5 | Imagem diferente gera contornos diferentes; classe afeta material e animação |
| Processamento de imagens | 2,0 | Mostrar pelo menos três categorias e o efeito dos parâmetros |
| Computação gráfica | 2,0 | Cena navegável, iluminação, extrusão, textura dinâmica e animação |
| Aprendizado de máquina | 1,5 | Treinamento real, inferência em nova imagem e efeito da saída na cena |
| Código e projeto Vite | 1,0 | Build, modularização, liberação de memória e FPS medido |
| Documentação e apresentação | 1,0 | README, capturas, vídeo, demonstração e domínio do código |

O enunciado admite até +1,0 de bônus, incluindo modelo treinado pela equipe no navegador. A presença da funcionalidade de treino não garante o bônus; coletar e documentar dados próprios e explicar os resultados.

Resultados automatizados já executados estão em [VALIDACAO.md](VALIDACAO.md). A medição presencial continua pendente.

## Verificação funcional sugerida

1. Fazer uma instalação limpa com `npm ci` e executar o aplicativo.
2. Carregar uma imagem de casa. Conferir original, retificação, máscara e objeto 3D.
3. Carregar uma foto inclinada da folha. Definir os cantos em ordem e conferir a homografia.
4. Alterar a limiarização e a área mínima. Verificar impacto na segmentação e nos contornos extrudados.
5. Treinar com exemplos das três classes. Separar novas imagens e registrar erros e acertos da inferência.
6. Comparar os materiais e os movimentos controlados pelas classes.
7. Testar captura contínua pela webcam e interrompê-la; conferir encerramento do acesso à câmera.
8. Abrir uma imagem vazia ou sem contraste. Verificar mensagem e estado da cena; não confundir ausência de contorno com falha da câmera.
9. Testar rotação, zoom, profundidade, pausa da animação e exportação quando disponível.
10. Executar `npm test` e `npm run build`; testar também o resultado com `npm run preview`.
11. No computador do laboratório, medir FPS e observar memória durante vários minutos.

Os testes automatizados não substituem a webcam física, a diversidade dos desenhos nem o hardware real do laboratório.

## Ficha de desempenho do laboratório

Preencher após medição real. Até lá, o requisito de desempenho no laboratório permanece **não validado**.

| Campo | Resultado |
| --- | --- |
| Data e responsável | A medir |
| CPU / GPU / memória | A medir |
| Sistema e navegador | A medir |
| Resolução de processamento | A medir |
| Entrada e duração do teste | A medir |
| FPS típico / mínimo observado | A medir |
| Inferência e captura ativas? | A medir |
| Crescimento de memória após aquecimento | A medir |
| Ajustes necessários | A medir |

Separar FPS de renderização da taxa de processamento/inferência: a cena pode renderizar mais quadros do que a câmera é processada. Registrar ambos se disponíveis, sem chamar a taxa de renderização de taxa da IA.

## Entregáveis externos e pendências

- [ ] Confirmar a escolha do tema com o professor; o enunciado limita um tema por equipe.
- [x] Registrar Leonardo Felipe Roncolato e Mickael Lopes Mendes como integrantes no README.
- [ ] Revisar o código e manter histórico real de contribuições de todos.
- [ ] Registrar a validação da versão final, incluindo a medição no laboratório.
- [ ] Coletar exemplos próprios e documentar a avaliação do classificador.
- [ ] Publicar o build e acrescentar a URL de produção no README.
- [ ] Gravar vídeo de 3–5 minutos e incluir o link.
- [ ] Preparar apresentação de 10 minutos e ensaiar perguntas para todos os integrantes.
- [ ] Entregar os links do repositório, da aplicação publicada e do vídeo pelo canal solicitado pelo professor.

O roteiro de vídeo e apresentação está em [APRESENTACAO.md](APRESENTACAO.md). Nenhum item externo é marcado como concluído apenas porque o código foi desenvolvido.
