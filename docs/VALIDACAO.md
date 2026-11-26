# Validação técnica

Verificações executadas no ambiente de desenvolvimento em 25/11/2026 (America/Sao_Paulo), com Node 24.22.3, Chromium Linux e renderização de software SwiftShader.

| Verificação | Resultado observado |
| --- | --- |
| `npm ci` | Reinstalação com lockfile aprovada |
| `npm run build` | Aprovado; build estático Vite |
| `npm run test:geometry` | 5 testes aprovados |
| Suíte de interface em desenvolvimento | 2 testes aprovados: upload, exemplos, controles, STL, responsividade e webcam simulada |
| `npm run test:production` | 6 testes aprovados contra o build servido por `npm run preview` |
| Capturas desktop e móvel | Geradas a partir do build de produção e inspecionadas |

## O que os testes verificam

- Extrusão: dimensões, volume, posição relativa, inversão do eixo Y e UVs.
- Alteração de animações conforme a classe e liberação de recursos Three.js.
- Homografia: uma folha trapezoidal recupera posições analiticamente conhecidas de dois traços.
- Folha branca: não produz geometria; cantos inválidos são rejeitados.
- TensorFlow.js: treinamento real e classificação de variações sintéticas das três classes. Inferências repetidas não aumentam a contagem de tensores.
- Interface: alteração de fonte, upload PNG, profundidade, malha, pausa, exportação STL e ausência de overflow horizontal em tela de 390 px.
- Webcam simulada: vídeo real proveniente de `canvas.captureStream`, processamento e encerramento dos tracks. Não é uma validação de câmera física.
- Concorrência: uma câmera cancelada antes da permissão não reaparece; mudança de imagem durante inferência termina exibindo a fonte mais recente.

## Correção específica de produção

O carregamento direto do export UMD Promise de OpenCV.js funcionava no modo de desenvolvimento, mas falhava após o empacotamento. O módulo agora carrega o arquivo npm como asset local via `?url` e aguarda a inicialização. A suíte de produção foi adicionada ao workflow para detectar essa classe de regressão.

## Limites da evidência

Não foram avaliados desenhos de um conjunto real independente nem a webcam física. A confiança e os acertos nos exemplos sintéticos não representam precisão sobre fotografias reais. Na captura automatizada com renderização de software houve amostras de aproximadamente 13–18 FPS; isso não comprova o mínimo de 15 FPS no computador do laboratório. A ficha em REQUISITOS.md deve ser preenchida no equipamento da apresentação, com webcam e inferência ativas.

Publicação no GitHub Pages, contribuições individuais no histórico e apresentação presencial dependem das etapas de entrega da dupla. Um workflow preparado não é evidência de publicação.

## Vídeo de demonstração

[demonstracao.mp4](demonstracao.mp4): H.264, 1280 × 900, 210,16 segundos (3min30s), cerca de 3,3 MB, sem áudio e com legendas explicativas. Gravado por automação de interações reais no build de produção. Decodificação integral validada com FFmpeg e quadros do início, meio e fim inspecionados. A gravação não comprova desempenho no laboratório nem substitui a apresentação da dupla.
