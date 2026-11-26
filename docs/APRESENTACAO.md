Vídeo técnico disponível: [demonstração legendada de 3min30s](demonstracao.mp4). Revisem as legendas e complementem com desenhos reais e explicação da dupla, se necessário.

# Roteiros de demonstração e apresentação

Estes roteiros organizam os entregáveis do enunciado. Não são um vídeo já gravado nem substituem a apresentação da equipe.

## Preparação

- Separar desenhos próprios de casa, árvore e carro, além de uma foto com perspectiva inclinada e um caso que falha.
- Guardar algumas imagens exclusivamente para teste. Explicar quais exemplos são sintéticos e quais foram coletados pela equipe.
- Verificar `npm install`, `npm run dev`, `npm run build` e `npm run preview` na versão entregue.
- Testar a URL publicada e a permissão de webcam em HTTPS.
- Conferir FPS no computador do laboratório e preencher a ficha de desempenho em [REQUISITOS.md](REQUISITOS.md).
- Fechar notificações e remover informações pessoais antes de gravar a tela.

## Vídeo de demonstração — duração planejada: 4 minutos

| Tempo | O que mostrar | O que explicar |
| --- | --- | --- |
| 0:00–0:25 | Equipe, tema e interface | Um desenho no papel é convertido em uma extrusão 3D, inteiramente no navegador |
| 0:25–1:05 | Upload de foto inclinada e definição dos quatro cantos | Homografia retifica o plano da folha; não recupera profundidade física |
| 1:05–1:50 | Máscara, ajuste da janela / constante e contornos | Cinza, Gaussiano, limiarização adaptativa, morfologia e simplificação dos contornos |
| 1:50–2:35 | Exemplos rotulados, treinamento e nova imagem | TensorFlow.js aprende no navegador; confiança não é certeza e imagem de teste não entrou no treino |
| 2:35–3:20 | Cena, navegação, mudança de classe e profundidade | Contornos definem `ExtrudeGeometry`; classe controla material e animação; canvas atualiza a textura |
| 3:20–3:45 | Webcam, FPS e um caso difícil | Captura contínua, renderização independente, desempenho medido e limites de segmentação |
| 3:45–4:00 | Repositório e aplicação publicada | Mostrar links e encerrar com as contribuições da equipe |

Se o treino levar mais tempo, preparar uma coleta anterior e mostrar o início e o resultado. Identificar cortes ou aceleração; não apresentar um resultado pré-gravado como inferência ao vivo. Manter o vídeo final entre **3 e 5 minutos** e conferir áudio, legibilidade e reprodução do arquivo antes de enviar.

## Apresentação no laboratório — 10 minutos

| Tempo | Conteúdo |
| --- | --- |
| 0:00–0:50 | Problema, tema, equipe e tecnologias obrigatórias |
| 0:50–2:00 | Pipeline e responsabilidades dos módulos |
| 2:00–4:00 | Demonstração de foto própria, homografia, máscara e contornos; alterar parâmetros ao vivo |
| 4:00–5:30 | Treinamento e inferência em desenho separado; explicar conjunto de dados e limitações |
| 5:30–7:00 | Malha extrudada, câmera, luzes, textura, materiais e animação por classe |
| 7:00–8:00 | FPS medido, liberação de memória, build e publicação |
| 8:00–9:00 | Caso difícil, diagnóstico e divisão real de contribuições |
| 9:00–10:00 | Perguntas e margem para pequenos imprevistos |

Dividir a fala entre os integrantes sem dividir o entendimento: qualquer pessoa deve conseguir explicar qualquer parte do código. Manter imagens locais como alternativa se a câmera não estiver disponível, deixando claro quando a fonte mudou.

## Perguntas para ensaiar

1. Por que quatro pontos permitem corrigir a perspectiva de uma folha plana? Que ordem precisam ter?
2. Qual é a diferença entre limiar global e adaptativo? Como janela e constante C alteram o resultado?
3. O que o Gaussiano resolve e o que pode apagar quando seu kernel é excessivo?
4. Como o fechamento morfológico afeta pequenos espaços entre traços?
5. Como área mínima e tolerância de simplificação afetam ruído, detalhes e quantidade de vértices?
6. Quais dados saem do OpenCV e entram no Three.js? Onde essa transferência acontece?
7. Por que esse resultado é uma extrusão 2,5D, e não reconstrução volumétrica do objeto real?
8. Quais entradas e saídas o modelo de classificação usa? O que significa a confiança exibida?
9. Por que testar com os próprios exemplos de treino é uma avaliação inadequada?
10. Quais são os limites dos exemplos sintéticos e como melhorar o conjunto de dados?
11. Como a classe altera material e animação? O que acontece com um desenho fora das três classes?
12. O que é uma `CanvasTexture` e quando ela precisa ser atualizada?
13. Por que renderização e processamento de imagem não precisam rodar na mesma frequência?
14. Quais objetos exigem `delete()`, `dispose()` ou `tf.tidy()`? O que aconteceria sem isso?
15. Como o build do Vite é publicado sem um servidor de aplicação? Por que a webcam exige HTTPS?
16. Que partes tiveram assistência de IA generativa e como a equipe verificou seu funcionamento?

## Registro da avaliação do classificador

Preencher com resultados reais antes da apresentação. Não estimar acurácia a partir da aparência dos exemplos.

| Classe | Exemplos de treino reais | Exemplos de teste separados | Acertos | Erros frequentes |
| --- | ---: | ---: | ---: | --- |
| Casa | A medir | A medir | A medir | A medir |
| Árvore | A medir | A medir | A medir | A medir |
| Carro | A medir | A medir | A medir | A medir |

Registrar também os parâmetros de PDI usados, a presença de exemplos sintéticos no treinamento e a diversidade de autores e iluminação. Se houver baixo desempenho, apresentar o resultado observado e suas causas possíveis; não ocultar erros.

## Checklist antes de enviar

- [ ] Nomes corretos, turma e contribuições no README.
- [ ] Repositório acessível e histórico de contribuições reais.
- [ ] Aplicação publicada a partir do build e testada na URL final.
- [ ] Capturas de tela correspondem à versão entregue.
- [ ] Vídeo de 3–5 minutos reproduz normalmente e seu link está acessível ao professor.
- [ ] Apresentação ensaiada em até 10 minutos.
- [ ] Todos os integrantes conseguem responder às perguntas sobre o pipeline e o código.
- [ ] Datas e canal de entrega confirmados com o professor.
