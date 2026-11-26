import {
  createIcons,
  Upload,
  Camera,
  Box,
  ArrowUpRight,
  RotateCcw,
  Download,
  ChevronRight,
  Layers,
  ScanLine,
  Sparkles,
  Check,
  X,
  Plus,
  Play,
  Square,
  SlidersHorizontal,
  Move,
  Code2,
  Info,
} from "lucide";
export function icons() {
  createIcons({
    icons: {
      Upload,
      Camera,
      Box,
      ArrowUpRight,
      RotateCcw,
      Download,
      ChevronRight,
      Layers,
      ScanLine,
      Sparkles,
      Check,
      X,
      Plus,
      Play,
      Square,
      SlidersHorizontal,
      Move,
      Code2,
      Info,
    },
    attrs: { "stroke-width": 1.7 },
  });
}
export function mountUI() {
  document.querySelector("#app").innerHTML = `
 <header class="header"><a class="brand" href="./" aria-label="Forma, início"><span class="brand-mark"><i data-lucide="box"></i></span>forma<span class="brand-dot">.</span></a><span class="brand-description">DO PAPEL AO 3D</span><nav><a href="#studio" class="active">Estúdio</a><button id="about">Como funciona <i data-lucide="arrow-up-right"></i></button><a href="https://github.com/leoroncolato/pdi-digitalizador-3d" target="_blank" rel="noreferrer" class="github-link"><i data-lucide="code-2"></i><span>Projeto</span></a></nav></header>
 <main id="studio"><section class="intro"><div><div class="eyebrow"><span></span> LABORATÓRIO DE VISÃO COMPUTACIONAL</div><h1>Seu desenho. Uma nova dimensão<span>.</span></h1><p>Do traço no papel a um objeto que você pode explorar.</p></div><div class="local-badge"><span class="status-dot"></span>100% no seu navegador<small>Suas imagens ficam com você</small></div></section>
 <div class="workflow"><span class="current"><b>01</b> Capture o desenho</span><i data-lucide="chevron-right"></i><span><b>02</b> Revele os contornos</span><i data-lucide="chevron-right"></i><span><b>03</b> Explore em 3D</span><div class="engine-state" id="engine-state">Inicializando OpenCV…</div></div>
 <section class="workspace"><article class="panel source-panel"><div class="panel-heading"><h2><i data-lucide="scan-line"></i> Seu desenho</h2><span class="subtle-tag" id="source-tag">EXEMPLO</span></div><div class="capture-actions"><button id="upload" class="primary"><i data-lucide="upload"></i> Enviar imagem</button><button id="camera"><i data-lucide="camera"></i> Usar webcam</button><input id="file" type="file" accept="image/png,image/jpeg,image/webp" hidden/></div><div class="source-stage" id="drop-zone"><div class="paper-wrap"><canvas id="source" aria-label="Imagem original do desenho"></canvas><svg id="corners" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Cantos da folha"></svg></div><video id="camera-preview" hidden autoplay muted playsinline></video><span class="paper-label" id="paper-label">CASA · EXEMPLO ILUSTRATIVO</span><div id="corner-help" class="corner-help" hidden>Clique nos 4 cantos: superior esquerdo → superior direito → inferior direito → inferior esquerdo.</div></div><div class="source-toolbar"><button id="perspective" class="text-button"><i data-lucide="move"></i> Corrigir perspectiva</button><button id="reset-corners" class="icon-button" title="Restaurar cantos" aria-label="Restaurar cantos"><i data-lucide="rotate-ccw"></i></button><span>PNG, JPG, WebP · até 20 MB</span></div><div class="samples"><span>Experimente</span><button class="sample active" data-sample="casa">⌂ <span>Casa</span></button><button class="sample" data-sample="arvore">♧ <span>Árvore</span></button><button class="sample" data-sample="carro">▱ <span>Carro</span></button></div></article>
 <article class="panel result-panel"><div class="panel-heading"><h2><i data-lucide="box"></i> Sua criação em 3D</h2><span class="live-tag"><span></span> AO VIVO</span></div><div class="scene-wrap"><div id="scene" aria-label="Cena tridimensional interativa"></div><div class="scene-top"><span class="classification" id="classification"><i data-lucide="sparkles"></i> IA aguardando treinamento</span><span class="fps" id="fps">— FPS</span></div><div class="scene-bottom"><span><i data-lucide="move"></i> Arraste para girar · role para aproximar</span><button id="reset-view" class="dark-button" title="Restaurar câmera" aria-label="Restaurar câmera"><i data-lucide="rotate-ccw"></i></button></div><div id="scene-loading" class="scene-loading"><span class="spinner"></span> Preparando seu estúdio…</div></div><div class="result-footer"><span><span class="status-dot"></span><span id="geometry-info">Aguardando contornos</span></span><button id="export" class="text-button" disabled><i data-lucide="download"></i> Exportar STL</button></div></article></section>
 <section class="controls-grid"><article class="panel control-card"><div class="card-title"><span class="step-number">01</span><h2>Revele os traços</h2><i data-lucide="sliders-horizontal"></i></div><p class="card-description">Ajuste a leitura do papel e acompanhe o resultado.</p><label class="slider-label" for="threshold">Sensibilidade do traço <output id="threshold-value">8</output></label><input id="threshold" type="range" min="-5" max="25" step="1" value="8"/><div class="two-fields"><label>Janela adaptativa<select id="block-size"><option value="11">11 px · detalhe</option><option value="21" selected>21 px · equilibrado</option><option value="41">41 px · amplo</option></select></label><label>Suavização<select id="blur"><option value="1">Sem filtro</option><option value="3" selected>Suave · 3 px</option><option value="5">Média · 5 px</option></select></label></div><details><summary>Mais ajustes de PDI</summary><label>Fechamento morfológico<select id="morph"><option value="1">Desligado</option><option value="3" selected>3 px</option><option value="5">5 px</option></select></label><label class="slider-label">Área mínima <output id="area-value">100 px²</output></label><input id="min-area" type="range" min="20" max="1500" step="20" value="100"/><label class="slider-label">Simplificação <output id="epsilon-value">2 px</output></label><input id="epsilon" type="range" min="0.5" max="5" step="0.5" value="2"/></details><div class="pdi-preview"><canvas id="mask" width="80" height="80" aria-label="Máscara binária após processamento"></canvas><div><strong id="contour-count">— contornos encontrados</strong><span id="processing-time">Limiarização adaptativa + morfologia</span></div><i data-lucide="check"></i></div></article>
 <article class="panel control-card"><div class="card-title"><span class="step-number">02</span><h2>Ensine a reconhecer</h2><i data-lucide="sparkles"></i></div><p class="card-description">Uma IA que aprende aqui, com os seus exemplos.</p><div class="class-scores" id="class-scores"><div>Casa <span>—</span><b style="--score:0%"></b></div><div>Árvore <span>—</span><b style="--score:0%"></b></div><div>Carro <span>—</span><b style="--score:0%"></b></div></div><div class="training-actions"><select id="training-label" aria-label="Classe do exemplo"><option value="casa">Casa</option><option value="arvore">Árvore</option><option value="carro">Carro</option></select><button id="add-example" title="Adicionar imagem atual ao conjunto de treino"><i data-lucide="plus"></i> Exemplo</button></div><button id="train" class="train-button"><i data-lucide="play"></i> Treinar modelo no navegador</button><span class="training-note" id="training-status">Base didática: preparando exemplos sintéticos…</span></article>
 <article class="panel control-card"><div class="card-title"><span class="step-number">03</span><h2>Dê forma à ideia</h2><i data-lucide="layers"></i></div><p class="card-description">O contorno vira volume. A classe define o movimento.</p><label class="slider-label" for="depth">Profundidade <output id="depth-value">0,35</output></label><input id="depth" type="range" min="0.05" max="1.2" step="0.05" value="0.35"/><div class="material-row"><span>Material por classe</span><div class="swatches"><span style="--swatch:#87d7bc" title="Casa: menta"></span><span style="--swatch:#a4c17e" title="Árvore: verde"></span><span style="--swatch:#efb479" title="Carro: âmbar"></span></div></div><label class="toggle-row"><span>Animação da classe<small>Casa flutua · árvore balança · carro desliza</small></span><input id="animate" type="checkbox" checked role="switch"/></label><label class="toggle-row"><span>Exibir malha<small>Explore a geometria do seu desenho</small></span><input id="wireframe" type="checkbox" role="switch"/></label><div class="tip"><i data-lucide="info"></i><span>Use papel claro e um traço escuro e fechado para um contorno mais definido.</span></div></article></section>
 <footer><span class="footer-brand">forma. <span>Um experimento entre imagem e dimensão.</span></span><span>Vite <b>·</b> OpenCV.js <b>·</b> TensorFlow.js <b>·</b> Three.js</span></footer></main><div id="toast" role="status" aria-live="polite" hidden></div>
 <dialog id="about-dialog"><button id="close-about" class="icon-button" aria-label="Fechar"><i data-lucide="x"></i></button><div class="eyebrow">DO PAPEL AO 3D</div><h2>Um pipeline. Quatro etapas.</h2><ol><li><strong>Capture.</strong> Envie uma imagem ou use a webcam. Para fotos inclinadas, marque os quatro cantos da folha em ordem.</li><li><strong>Processe.</strong> OpenCV.js corrige a perspectiva, converte para cinza, suaviza, aplica limiarização adaptativa, fechamento e extrai contornos.</li><li><strong>Ensine.</strong> Adicione exemplos rotulados e treine a rede TensorFlow.js no navegador. A base sintética é apenas uma demonstração; fotos reais exigem exemplos variados.</li><li><strong>Explore.</strong> Three.js extruda os contornos reais e usa a classe para mudar material e animação. Arraste a cena, ajuste a profundidade ou exporte STL.</li></ol><p>Nenhuma imagem é enviada a servidores. O treinamento fica nesta sessão. Webcam: HTTPS ou localhost. Um desenho por folha funciona melhor; a extrusão é um relevo 2,5D, não uma reconstrução volumétrica completa.</p></dialog>`;
  icons();
}
export function toast(message, isError = false) {
  const e = document.querySelector("#toast");
  e.textContent = message;
  e.classList.toggle("error", isError);
  e.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (e.hidden = true), 6500);
}
