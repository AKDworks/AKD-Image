(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const translate = value => window.AKDI18n?.t(value) || value;
  const startScreen = byId('editor-start');
  const editorScreen = byId('image-editor');
  const initialImageInput = byId('initial-image-input');
  const layerImageInput = byId('layer-image-input');
  const workspace = byId('editor-workspace');
  const stage = byId('editor-stage');
  const layersList = byId('editor-layers');
  const colorInput = byId('object-color');
  const strokeInput = byId('object-stroke-width');
  const opacityInput = byId('object-opacity');
  const angleInput = byId('object-angle');
  const snapToCenterInput = byId('editor-snap-to-center');
  const duplicateButton = byId('duplicate-object-btn');
  const deleteButton = byId('delete-object-btn');
  const zoomRange = byId('zoom-range');
  const zoomLabel = byId('zoom-label');
  const undoButton = byId('undo-btn');
  const redoButton = byId('redo-btn');
  const addLayerButton = byId('add-image-btn');
  const addLayerMenu = byId('add-layer-menu');
  const closeLayerDialogButton = byId('close-layer-dialog');
  const chooseLayerImageButton = byId('choose-layer-image');
  const createEmptyLayerButton = byId('create-empty-layer');
  const emptyLayerOverlay = byId('empty-layer-overlay');
  const closeEmptyLayerDialogButton = byId('close-empty-layer-dialog');
  const cancelEmptyLayerButton = byId('cancel-empty-layer');
  const confirmEmptyLayerButton = byId('confirm-empty-layer');
  const emptyLayerWidthInput = byId('empty-layer-width');
  const emptyLayerHeightInput = byId('empty-layer-height');
  const emptyLayerBackgroundInput = byId('empty-layer-background');
  const emptyLayerColorField = byId('empty-layer-color-field');
  const emptyLayerColorInput = byId('empty-layer-color');

  let canvas = null;
  let documentWidth = 1280;
  let documentHeight = 720;
  let lastEmptyLayerWidth = 1280;
  let lastEmptyLayerHeight = 720;
  let fitScale = 1;
  let tool = 'select';
  let objectSequence = 0;
  let history = [];
  let future = [];
  let restoringHistory = false;
  let historyTimer = 0;
  let syncingProperties = false;
  let snapGuideX = false;
  let snapGuideY = false;
  let snapGuideXElement = null;
  let snapGuideYElement = null;
  let brushLayer = null;
  let requestedBrushLayer = null;
  let shapeDraft = null;
  let shapeStart = null;
  const ANGLE_SNAP_THRESHOLD = 5;

  const objectLabels = {
    image: 'Изображение',
    text: 'Текст',
    rect: 'Рамка',
    ellipse: 'Овал',
    arrow: 'Стрелка',
    brush: 'Рисунок',
    blank: 'Пустой слой',
  };

  const fabricObjectClass = fabric.FabricObject || fabric.Object;
  if (fabricObjectClass) {
    const customProperties = Array.isArray(fabricObjectClass.customProperties)
      ? fabricObjectClass.customProperties
      : [];
    fabricObjectClass.customProperties = [...new Set([...customProperties, 'editorType', 'name'])];
  }

  const materialIconPaths = {
    image: 'M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z',
    text: 'M420-160v-520H200v-120h560v120H540v520H420Z',
    rect: 'M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0 0v-560 560Z',
    ellipse: 'M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z',
    arrow: 'M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z',
    brush: 'M240-120q-45 0-89-22t-71-58q26 0 53-20.5t27-59.5q0-50 35-85t85-35q50 0 85 35t35 85q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T320-280q0-17-11.5-28.5T280-320q-17 0-28.5 11.5T240-280q0 23-5.5 42T220-202q5 2 10 2h10Zm230-160L360-470l358-358q11-11 27.5-11.5T774-828l54 54q12 12 12 28t-12 28L470-360Zm-190 80Z',
    blank: 'M80-160v-640h800v640H80Zm80-80h640v-480H160v480Zm0 0v-480 480Z',
    down: 'M440-800v487L216-537l-56 57 320 320 320-320-56-57-224 224v-487h-80Z',
    up: 'M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z',
    lock: 'M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z',
    lockOpen: 'M240-640h360v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85h-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640Zm0 480h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM240-160v-400 400Z',
    visibility: 'M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z',
    visibilityOff: 'm644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z',
  };

  function materialIcon(path) {
    return `<svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
  }

  function containsBrushPath(object) {
    if (!object) return false;
    if (object.type === 'path') return true;
    const children = typeof object.getObjects === 'function' ? object.getObjects() : [];
    return children.some(containsBrushPath);
  }

  function inferEditorType(object) {
    if (!object) return '';
    if (object.editorType && objectLabels[object.editorType]) return object.editorType;
    if (object.type === 'image') return 'image';
    if (['i-text', 'textbox', 'text'].includes(object.type)) return 'text';
    if (object.type === 'ellipse') return 'ellipse';
    if (object.type === 'path') return 'brush';
    if (object.type === 'rect') return Number(object.strokeWidth) > 0 ? 'rect' : 'blank';
    if (object.type === 'group') {
      const children = typeof object.getObjects === 'function' ? object.getObjects() : [];
      const childTypes = children.map(child => child.type);
      if (childTypes.includes('line') && childTypes.includes('triangle')) return 'arrow';
      if (containsBrushPath(object)) return 'brush';
    }
    return 'blank';
  }

  function ensureEditorMetadata(object) {
    if (!object) return '';
    const type = inferEditorType(object);
    if (!object.editorType) object.set('editorType', type);
    if (!object.name) object.set('name', nextName(type));
    return type;
  }

  function reportError(error) {
    console.error(error);
    Toast.error(error?.message || 'Не удалось выполнить действие');
  }

  function normalizeDimension(value, fallback) {
    const parsed = Math.round(Number(value));
    return Number.isFinite(parsed) ? Math.min(8192, Math.max(64, parsed)) : fallback;
  }

  function nextName(type, preferredName = '') {
    objectSequence += 1;
    if (preferredName) return preferredName.replace(/\.[^.]+$/, '').slice(0, 42);
    return `${objectLabels[type] || 'Слой'} ${objectSequence}`;
  }

  function initializeCanvas(width, height, background = 'transparent') {
    documentWidth = normalizeDimension(width, 1280);
    documentHeight = normalizeDimension(height, 720);
    lastEmptyLayerWidth = documentWidth;
    lastEmptyLayerHeight = documentHeight;
    brushLayer = null;
    requestedBrushLayer = null;
    shapeDraft = null;
    shapeStart = null;

    if (!canvas) {
      canvas = new fabric.Canvas('editor-canvas', {
        width: documentWidth,
        height: documentHeight,
        backgroundColor: background === 'transparent' ? 'rgba(0,0,0,0)' : background,
        preserveObjectStacking: true,
        selection: true,
        enableRetinaScaling: false,
      });
      bindCanvasEvents();
    } else {
      canvas.clear();
      canvas.setDimensions({ width: documentWidth, height: documentHeight });
      canvas.backgroundColor = background === 'transparent' ? 'rgba(0,0,0,0)' : background;
    }
    ensureSnapGuides();

    startScreen.classList.add('hidden');
    editorScreen.classList.remove('hidden');
    byId('document-size-label').textContent = `${documentWidth} × ${documentHeight} px`;
    zoomRange.value = '100';
    setTool('select');
    requestAnimationFrame(() => {
      fitCanvasToWorkspace();
      resetHistory();
      renderLayers();
      syncProperties();
    });
  }

  function bindCanvasEvents() {
    canvas.on('selection:created', () => {
      syncProperties();
      renderLayers();
    });
    canvas.on('selection:updated', () => {
      syncProperties();
      renderLayers();
    });
    canvas.on('selection:cleared', () => {
      syncProperties();
      renderLayers();
    });
    canvas.on('object:modified', () => {
      clearSnapGuides();
      syncProperties();
      renderLayers();
      saveHistory();
    });
    canvas.on('object:moving', event => snapObjectToCenter(event.target));
    canvas.on('object:rotating', event => snapObjectAngle(event.target));
    canvas.on('mouse:down', beginShapeDrawing);
    canvas.on('mouse:move', updateShapeDrawing);
    canvas.on('mouse:up', event => {
      finishShapeDrawing(event);
      clearSnapGuides();
    });
    canvas.on('path:created', event => commitBrushPath(event.path));
    canvas.on('text:changed', scheduleHistory);
  }

  function fitCanvasToWorkspace() {
    if (!canvas || editorScreen.classList.contains('hidden')) return;
    const availableWidth = Math.max(260, workspace.clientWidth - 40);
    const availableHeight = Math.min(620, Math.max(340, window.innerHeight - 300));
    fitScale = Math.min(1, availableWidth / documentWidth, availableHeight / documentHeight);
    applyVisualScale();
  }

  function applyVisualScale() {
    if (!canvas) return;
    const selectedZoom = Number(zoomRange.value) / 100;
    const scale = fitScale * selectedZoom;
    const width = Math.max(1, Math.round(documentWidth * scale));
    const height = Math.max(1, Math.round(documentHeight * scale));
    canvas.setDimensions({ width, height }, { cssOnly: true });
    const canvasContainer = stage.querySelector('.canvas-container');
    if (canvasContainer) {
      canvasContainer.style.width = `${width}px`;
      canvasContainer.style.height = `${height}px`;
    }
    zoomLabel.textContent = `${zoomRange.value}%`;
    canvas.calcOffset();
  }

  function setTool(nextTool) {
    const active = activeObject();
    const explicitlySelectedBrush = requestedBrushLayer && canvas?.getObjects().includes(requestedBrushLayer)
      ? requestedBrushLayer
      : null;
    const selectedBrushLayer = nextTool === 'brush'
      ? explicitlySelectedBrush || (tool !== 'brush' && inferEditorType(active) === 'brush' ? active : null)
      : null;
    if (shapeDraft) canvas?.remove(shapeDraft);
    shapeDraft = null;
    shapeStart = null;
    brushLayer = selectedBrushLayer;
    requestedBrushLayer = null;
    tool = nextTool;
    document.querySelectorAll('[data-editor-tool]').forEach(button => {
      button.classList.toggle('is-active', button.dataset.editorTool === nextTool);
    });
    if (!canvas) return;

    const isDrawingTool = ['brush', 'rect', 'ellipse', 'arrow'].includes(nextTool);
    canvas.isDrawingMode = nextTool === 'brush';
    canvas.selection = nextTool === 'select';
    canvas.skipTargetFind = isDrawingTool;
    canvas.defaultCursor = isDrawingTool ? 'crosshair' : 'default';
    if (isDrawingTool) canvas.discardActiveObject();
    if (nextTool === 'brush') {
      canvas.freeDrawingBrush = canvas.freeDrawingBrush || new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = colorInput.value;
      canvas.freeDrawingBrush.width = Number(strokeInput.value);
    }
    canvas.requestRenderAll();
    renderLayers();
    syncProperties();
  }

  function scenePoint(event) {
    return canvas.getScenePoint(event.e);
  }

  function isShapeTool(value = tool) {
    return ['rect', 'ellipse', 'arrow'].includes(value);
  }

  function beginShapeDrawing(event) {
    if (!isShapeTool() || shapeStart) return;
    if (typeof event.e?.button === 'number' && event.e.button !== 0) return;
    canvas.discardActiveObject();
    shapeStart = scenePoint(event);
    shapeDraft = null;
  }

  function updateShapeDrawing(event) {
    if (!shapeStart || !isShapeTool()) return;
    const point = scenePoint(event);
    if (shapeDraft) canvas.remove(shapeDraft);
    shapeDraft = createShape(tool, shapeStart, point, true);
    canvas.add(shapeDraft);
    canvas.requestRenderAll();
  }

  function finishShapeDrawing(event) {
    if (!shapeStart || !isShapeTool()) return;
    const start = shapeStart;
    const end = scenePoint(event);
    const drawingTool = tool;
    shapeStart = null;
    if (shapeDraft) canvas.remove(shapeDraft);
    shapeDraft = null;
    if (Math.hypot(end.x - start.x, end.y - start.y) < 4) {
      canvas.requestRenderAll();
      return;
    }
    const object = createShape(drawingTool, start, end, false);
    object.set({ name: nextName(drawingTool) });
    canvas.add(object);
    object.setCoords();
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    renderLayers();
    syncProperties();
    saveHistory();
  }

  function createShape(type, start, end, draft) {
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.max(1, Math.abs(end.x - start.x));
    const height = Math.max(1, Math.abs(end.y - start.y));
    const common = {
      fill: 'rgba(0,0,0,0)',
      stroke: colorInput.value,
      strokeWidth: Number(strokeInput.value),
      strokeUniform: true,
      selectable: !draft,
      evented: !draft,
      editorType: type,
    };
    if (type === 'rect') return new fabric.Rect({ ...common, left, top, width, height });
    if (type === 'ellipse') return new fabric.Ellipse({
      ...common,
      left,
      top,
      rx: width / 2,
      ry: height / 2,
    });

    const length = Math.max(1, Math.hypot(end.x - start.x, end.y - start.y));
    const strokeWidth = Number(strokeInput.value);
    const headSize = Math.max(18, 24 + strokeWidth);
    const line = new fabric.Line([-length / 2, 0, length / 2 - headSize * .55, 0], {
      stroke: colorInput.value,
      strokeWidth,
      strokeUniform: true,
      originX: 'center',
      originY: 'center',
    });
    const head = new fabric.Triangle({
      width: headSize,
      height: headSize * 1.2,
      fill: colorInput.value,
      left: length / 2 - headSize * .25,
      top: 0,
      angle: 90,
      originX: 'center',
      originY: 'center',
    });
    return new fabric.Group([line, head], {
      left: (start.x + end.x) / 2,
      top: (start.y + end.y) / 2,
      originX: 'center',
      originY: 'center',
      angle: Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI,
      selectable: !draft,
      evented: !draft,
      editorType: 'arrow',
    });
  }

  function commitBrushPath(path) {
    requestedBrushLayer = null;
    const currentLayer = brushLayer && canvas.getObjects().includes(brushLayer) ? brushLayer : null;
    if (!currentLayer) {
      path.set({ editorType: 'brush', name: nextName('brush') });
      brushLayer = path;
    } else {
      const layerName = currentLayer.name;
      const layerIndex = canvas.getObjects().indexOf(currentLayer);
      canvas.remove(currentLayer);
      canvas.remove(path);
      brushLayer = new fabric.Group([currentLayer, path], {
        editorType: 'brush',
        name: layerName,
      });
      canvas.insertAt(layerIndex, brushLayer);
    }
    canvas.setActiveObject(brushLayer);
    canvas.requestRenderAll();
    renderLayers();
    syncProperties();
    saveHistory();
  }

  function snapObjectToCenter(object) {
    if (!object || !snapToCenterInput.checked) return clearSnapGuides();
    const center = object.getCenterPoint();
    const canvasCenter = new fabric.Point(documentWidth / 2, documentHeight / 2);
    const visualScale = fitScale * (Number(zoomRange.value) / 100);
    const threshold = 12 / Math.max(.05, visualScale);
    const nextGuideX = Math.abs(center.x - canvasCenter.x) <= threshold;
    const nextGuideY = Math.abs(center.y - canvasCenter.y) <= threshold;
    const guidesChanged = nextGuideX !== snapGuideX || nextGuideY !== snapGuideY;
    snapGuideX = nextGuideX;
    snapGuideY = nextGuideY;
    if (snapGuideX || snapGuideY) {
      object.setPositionByOrigin(new fabric.Point(
        snapGuideX ? canvasCenter.x : center.x,
        snapGuideY ? canvasCenter.y : center.y
      ), 'center', 'center');
      object.setCoords();
    }
    if (guidesChanged) syncSnapGuides();
  }

  function snapObjectAngle(object) {
    if (!object) return;
    const angle = ((Number(object.angle) % 360) + 360) % 360;
    const distanceFromZero = Math.min(angle, 360 - angle);
    if (distanceFromZero > ANGLE_SNAP_THRESHOLD) return;
    object.rotate(0);
    object.setCoords();
  }

  function ensureSnapGuides() {
    const container = canvas?.wrapperEl || stage.querySelector('.canvas-container');
    if (!container) return;
    if (!snapGuideXElement?.isConnected) {
      snapGuideXElement = document.createElement('div');
      snapGuideXElement.className = 'editor-snap-guide editor-snap-guide--x';
      snapGuideXElement.setAttribute('aria-hidden', 'true');
      container.append(snapGuideXElement);
    }
    if (!snapGuideYElement?.isConnected) {
      snapGuideYElement = document.createElement('div');
      snapGuideYElement.className = 'editor-snap-guide editor-snap-guide--y';
      snapGuideYElement.setAttribute('aria-hidden', 'true');
      container.append(snapGuideYElement);
    }
  }

  function syncSnapGuides() {
    ensureSnapGuides();
    snapGuideXElement?.classList.toggle('is-visible', snapGuideX);
    snapGuideYElement?.classList.toggle('is-visible', snapGuideY);
  }

  function clearSnapGuides() {
    snapGuideX = false;
    snapGuideY = false;
    syncSnapGuides();
  }

  function centerObject(object) {
    canvas.add(object);
    canvas.centerObject(object);
    object.setCoords();
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    renderLayers();
    syncProperties();
    saveHistory();
  }

  function addText() {
    const text = new fabric.IText('Текст', {
      fill: colorInput.value,
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: 48,
      fontWeight: 600,
      editorType: 'text',
      name: nextName('text'),
    });
    centerObject(text);
    text.enterEditing();
    text.selectAll();
    setTool('select');
  }

  function addEmptyLayer() {
    if (!canvas) return;
    const width = Math.round(Number(emptyLayerWidthInput.value));
    const height = Math.round(Number(emptyLayerHeightInput.value));
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 64 || height < 64) {
      Toast.error(translate('Укажите размер слоя от 64 px'));
      return;
    }
    if (width > documentWidth || height > documentHeight) {
      Toast.error(`${translate('Размер слоя не может превышать размер холста:')} ${documentWidth} × ${documentHeight} px`);
      return;
    }
    const background = emptyLayerBackgroundInput.value;
    const fill = background === 'transparent'
      ? 'rgba(0,0,0,0)'
      : background === 'white'
        ? '#ffffff'
        : background === 'custom'
          ? emptyLayerColorInput.value
          : '#000000';
    const layer = new fabric.Rect({
      width,
      height,
      fill,
      strokeWidth: 0,
      editorType: 'blank',
      name: nextName('blank'),
    });
    lastEmptyLayerWidth = width;
    lastEmptyLayerHeight = height;
    closeEmptyLayerDialog();
    setTool('select');
    centerObject(layer);
  }

  function openEmptyLayerDialog() {
    closeAddLayerDialog();
    emptyLayerWidthInput.max = String(documentWidth);
    emptyLayerHeightInput.max = String(documentHeight);
    emptyLayerWidthInput.value = String(Math.min(lastEmptyLayerWidth, documentWidth));
    emptyLayerHeightInput.value = String(Math.min(lastEmptyLayerHeight, documentHeight));
    emptyLayerOverlay.classList.remove('hidden');
    document.body.classList.add('modal-open');
    emptyLayerWidthInput.focus({ preventScroll: true });
  }

  function closeEmptyLayerDialog() {
    if (emptyLayerOverlay.classList.contains('hidden')) return;
    emptyLayerOverlay.classList.add('hidden');
    document.body.classList.remove('modal-open');
    addLayerButton.focus({ preventScroll: true });
  }

  function syncEmptyLayerColorField() {
    emptyLayerColorField.classList.toggle('hidden', emptyLayerBackgroundInput.value !== 'custom');
  }

  function openAddLayerDialog() {
    const shouldOpen = addLayerMenu.hidden;
    addLayerMenu.hidden = !shouldOpen;
    addLayerButton.setAttribute('aria-expanded', String(shouldOpen));
    if (!shouldOpen) return;
    chooseLayerImageButton?.focus({ preventScroll: true });
  }

  function closeAddLayerDialog() {
    if (addLayerMenu.hidden) return;
    addLayerMenu.hidden = true;
    addLayerButton.setAttribute('aria-expanded', 'false');
  }

  async function loadImageObject(file, asDocument = false) {
    try {
      FileUtils.validateFile(file);
      if (!FileUtils.isSupportedImage(file)) {
        throw new Error('Выберите изображение JPG, PNG, WebP, AVIF, HEIC, SVG, BMP или GIF');
      }
      const dataUrl = await FileUtils.readAsDataURL(file);
      const browserImage = await FileUtils.loadImage(dataUrl);
      if (asDocument) initializeCanvas(browserImage.naturalWidth, browserImage.naturalHeight, 'transparent');
      let editorSource = dataUrl;
      if (FileUtils.isGif(file)) {
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = browserImage.naturalWidth;
        frameCanvas.height = browserImage.naturalHeight;
        frameCanvas.getContext('2d').drawImage(browserImage, 0, 0);
        editorSource = frameCanvas.toDataURL('image/png');
        Toast.info('GIF добавлен как статичное изображение');
      }
      const image = await fabric.FabricImage.fromURL(editorSource);
      image.set({ editorType: 'image', name: nextName('image', file.name) });

      if (asDocument) {
        image.set({ left: 0, top: 0, selectable: true });
      } else {
        const maxWidth = documentWidth * 0.62;
        const maxHeight = documentHeight * 0.62;
        const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
        image.scale(scale);
      }
      centerObject(image);
      if (asDocument) resetHistory();
    } catch (error) {
      reportError(error);
    }
  }

  function activeObject() {
    return canvas?.getActiveObject() || null;
  }

  function isActiveSelection(object) {
    return object instanceof fabric.ActiveSelection || String(object?.type || '').toLowerCase() === 'activeselection';
  }

  function selectedObjects() {
    const active = activeObject();
    if (!active) return [];
    return isActiveSelection(active) ? active.getObjects() : [active];
  }

  function removeSelected() {
    const objects = selectedObjects();
    if (!objects.length) return;
    if (objects.includes(brushLayer)) brushLayer = null;
    if (objects.includes(requestedBrushLayer)) requestedBrushLayer = null;
    canvas.discardActiveObject();
    objects.forEach(object => canvas.remove(object));
    canvas.requestRenderAll();
    renderLayers();
    syncProperties();
    saveHistory();
  }

  async function duplicateSelected() {
    const source = activeObject();
    if (!source || isActiveSelection(source)) return;
    try {
      const clone = await source.clone(['editorType', 'name']);
      clone.set({
        left: (source.left || 0) + 24,
        top: (source.top || 0) + 24,
        name: nextName(inferEditorType(source) || source.type),
      });
      canvas.add(clone);
      clone.setCoords();
      canvas.setActiveObject(clone);
      canvas.requestRenderAll();
      renderLayers();
      syncProperties();
      saveHistory();
    } catch (error) {
      reportError(error);
    }
  }

  function syncProperties() {
    const active = activeObject();
    const isSingle = active && !isActiveSelection(active);
    const activeType = isSingle ? ensureEditorMetadata(active) : '';
    const isDrawingMode = ['brush', 'rect', 'ellipse', 'arrow'].includes(tool);
    const supportsColor = isDrawingMode || (isSingle && activeType !== 'image');
    const supportsStroke = isDrawingMode || (isSingle && ['rect', 'ellipse', 'arrow', 'brush'].includes(activeType));
    document.querySelector('.editor-properties')?.classList.toggle('is-disabled', !isSingle && !isDrawingMode);
    colorInput.disabled = !supportsColor;
    strokeInput.disabled = !supportsStroke;
    opacityInput.disabled = !isSingle;
    angleInput.disabled = !isSingle;
    duplicateButton.disabled = !isSingle;
    deleteButton.disabled = !active;
    if (!isSingle) return;

    const brushStroke = activeType === 'brush' ? firstBrushStroke(active) : null;
    const color = activeType === 'text'
      ? active.fill
      : activeType === 'blank'
        ? active.fill
      : activeType === 'arrow'
        ? active.item(0)?.stroke
        : brushStroke?.stroke || active.stroke;
    if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) && colorInput.value.toLowerCase() !== color.toLowerCase()) {
      syncingProperties = true;
      colorInput.value = color;
      colorInput.dispatchEvent(new Event('input', { bubbles: true }));
      syncingProperties = false;
    }
    angleInput.value = String(Math.round(active.angle || 0));
    opacityInput.value = String(Math.round((active.opacity ?? 1) * 100));
    const strokeWidth = activeType === 'arrow'
      ? active.item(0)?.strokeWidth
      : brushStroke?.strokeWidth || active.strokeWidth;
    if (strokeWidth) strokeInput.value = String(Math.round(strokeWidth));
  }

  function firstBrushStroke(object) {
    if (!object) return null;
    const children = typeof object.getObjects === 'function' ? object.getObjects() : [];
    if (!children.length) return object;
    return firstBrushStroke(children[0]);
  }

  function updateBrushStrokes(object, property, value) {
    const children = typeof object?.getObjects === 'function' ? object.getObjects() : [];
    if (!children.length) {
      object?.set(property, value);
      return;
    }
    children.forEach(child => updateBrushStrokes(child, property, value));
  }

  function updateSelectedProperty(kind, rawValue) {
    const active = activeObject();
    if (!active || isActiveSelection(active)) return;
    const activeType = ensureEditorMetadata(active);
    if (kind === 'color') {
      if (activeType === 'text') active.set('fill', rawValue);
      else if (activeType === 'blank') active.set('fill', rawValue);
      else if (activeType === 'arrow') {
        active.getObjects().forEach(part => part.set(part.type === 'triangle' ? 'fill' : 'stroke', rawValue));
      } else if (activeType === 'brush') updateBrushStrokes(active, 'stroke', rawValue);
      else active.set('stroke', rawValue);
    }
    if (kind === 'stroke') {
      const value = Number(rawValue);
      if (activeType === 'arrow') active.item(0)?.set('strokeWidth', value);
      else if (activeType === 'brush') updateBrushStrokes(active, 'strokeWidth', value);
      else active.set('strokeWidth', value);
    }
    if (kind === 'opacity') active.set('opacity', Number(rawValue) / 100);
    if (kind === 'angle') {
      const angle = Number(rawValue) || 0;
      active.set('angle', Math.abs(angle) <= ANGLE_SNAP_THRESHOLD ? 0 : angle);
    }
    active.setCoords();
    canvas.requestRenderAll();
    scheduleHistory();
  }

  function layerIcon(type) {
    return materialIcon(materialIconPaths[type] || materialIconPaths.blank);
  }

  function reorderLayer(draggedObject, targetObject, placeAfterTarget) {
    const visualOrder = canvas.getObjects().slice().reverse();
    const draggedIndex = visualOrder.indexOf(draggedObject);
    if (draggedIndex < 0 || draggedObject === targetObject) return;
    visualOrder.splice(draggedIndex, 1);
    const targetIndex = visualOrder.indexOf(targetObject);
    if (targetIndex < 0) return;
    visualOrder.splice(targetIndex + (placeAfterTarget ? 1 : 0), 0, draggedObject);
    visualOrder.slice().reverse().forEach((object, index) => canvas.moveObjectTo(object, index));
    if (draggedObject.selectable) canvas.setActiveObject(draggedObject);
    layersList._draggedLayer = null;
    canvas.requestRenderAll();
    renderLayers();
    syncProperties();
    saveHistory();
  }

  function renderLayers() {
    if (!canvas) return;
    const active = activeObject();
    const objects = canvas.getObjects().slice().reverse();
    layersList.replaceChildren();
    if (!objects.length) {
      const empty = document.createElement('p');
      empty.className = 'editor-layers__empty';
      empty.textContent = 'Добавьте первый слой';
      layersList.append(empty);
      return;
    }

    objects.forEach(object => {
      const objectType = ensureEditorMetadata(object);
      const row = document.createElement('div');
      row.className = `editor-layer${object === active ? ' is-active' : ''}`;
      row.tabIndex = 0;
      row.draggable = true;
      row.innerHTML = `
        <span class="editor-layer__type" aria-hidden="true">${layerIcon(objectType)}</span>
        <span class="editor-layer__name"></span>
        <button type="button" data-layer-action="down" title="Опустить слой" aria-label="Опустить слой">${materialIcon(materialIconPaths.down)}</button>
        <button type="button" data-layer-action="up" title="Поднять слой" aria-label="Поднять слой">${materialIcon(materialIconPaths.up)}</button>
        <button type="button" data-layer-action="lock" title="${object.selectable ? 'Заблокировать' : 'Разблокировать'}" aria-label="${object.selectable ? 'Заблокировать' : 'Разблокировать'}">${materialIcon(object.selectable ? materialIconPaths.lockOpen : materialIconPaths.lock)}</button>
        <button type="button" data-layer-action="visibility" title="${object.visible ? 'Скрыть' : 'Показать'}" aria-label="${object.visible ? 'Скрыть' : 'Показать'}">${materialIcon(object.visible ? materialIconPaths.visibility : materialIconPaths.visibilityOff)}</button>`;
      row.querySelector('.editor-layer__name').textContent = object.name || objectLabels[objectType] || 'Слой';
      const selectLayer = event => {
        if (event.target.closest('button')) return;
        if (!object.selectable) return;
        if (objectType === 'brush') {
          brushLayer = object;
          requestedBrushLayer = object;
        } else {
          brushLayer = null;
          requestedBrushLayer = null;
        }
        canvas.setActiveObject(object);
        canvas.requestRenderAll();
        syncProperties();
        renderLayers();
      };
      row.addEventListener('click', selectLayer);
      row.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') selectLayer(event);
      });
      row.addEventListener('dragstart', event => {
        if (event.target.closest('button')) {
          event.preventDefault();
          return;
        }
        row.classList.add('is-dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', object.name || 'layer');
        layersList._draggedLayer = object;
      });
      row.addEventListener('dragover', event => {
        const draggedObject = layersList._draggedLayer;
        if (!draggedObject || draggedObject === object) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const placeAfterTarget = event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
        layersList.querySelectorAll('.is-drop-before, .is-drop-after').forEach(item => {
          item.classList.remove('is-drop-before', 'is-drop-after');
        });
        row.classList.add(placeAfterTarget ? 'is-drop-after' : 'is-drop-before');
      });
      row.addEventListener('drop', event => {
        const draggedObject = layersList._draggedLayer;
        if (!draggedObject || draggedObject === object) return;
        event.preventDefault();
        const placeAfterTarget = event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
        reorderLayer(draggedObject, object, placeAfterTarget);
      });
      row.addEventListener('dragend', () => {
        layersList._draggedLayer = null;
        layersList.querySelectorAll('.is-dragging, .is-drop-before, .is-drop-after').forEach(item => {
          item.classList.remove('is-dragging', 'is-drop-before', 'is-drop-after');
        });
      });
      row.querySelectorAll('[data-layer-action]').forEach(button => {
        button.addEventListener('click', event => {
          event.stopPropagation();
          const action = button.dataset.layerAction;
          if (action === 'up') canvas.bringObjectForward(object);
          if (action === 'down') canvas.sendObjectBackwards(object);
          if (action === 'lock') {
            const unlocked = !object.selectable;
            object.set({ selectable: unlocked, evented: unlocked });
            if (!unlocked) canvas.discardActiveObject();
          }
          if (action === 'visibility') {
            object.set('visible', !object.visible);
            if (!object.visible) canvas.discardActiveObject();
          }
          canvas.requestRenderAll();
          renderLayers();
          syncProperties();
          saveHistory();
        });
      });
      layersList.append(row);
    });
  }

  function serializeCanvas() {
    canvas.getObjects().forEach(ensureEditorMetadata);
    return canvas.toJSON(['editorType', 'name']);
  }

  function resetHistory() {
    if (!canvas) return;
    history = [serializeCanvas()];
    future = [];
    updateHistoryButtons();
  }

  function saveHistory() {
    if (!canvas || restoringHistory) return;
    window.clearTimeout(historyTimer);
    history.push(serializeCanvas());
    if (history.length > 30) history.shift();
    future = [];
    updateHistoryButtons();
  }

  function scheduleHistory() {
    window.clearTimeout(historyTimer);
    historyTimer = window.setTimeout(saveHistory, 180);
  }

  async function restoreState(state) {
    if (!state || !canvas) return;
    restoringHistory = true;
    brushLayer = null;
    requestedBrushLayer = null;
    try {
      await canvas.loadFromJSON(state);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      renderLayers();
      syncProperties();
    } finally {
      restoringHistory = false;
      updateHistoryButtons();
    }
  }

  async function undo() {
    if (history.length < 2) return;
    future.push(history.pop());
    await restoreState(history.at(-1));
  }

  async function redo() {
    if (!future.length) return;
    const state = future.pop();
    history.push(state);
    await restoreState(state);
  }

  function updateHistoryButtons() {
    undoButton.disabled = history.length < 2;
    redoButton.disabled = !future.length;
  }

  function exportImage() {
    try {
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      const url = canvas.toDataURL({ format: 'png', multiplier: 1, enableRetinaScaling: false });
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'akd-image-editor.png';
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      Toast.success('Изображение сохранено');
    } catch (error) {
      reportError(error);
    }
  }

  function showStartScreen() {
    closeAddLayerDialog();
    closeEmptyLayerDialog();
    brushLayer = null;
    requestedBrushLayer = null;
    shapeDraft = null;
    shapeStart = null;
    if (canvas) {
      canvas.clear();
      canvas.requestRenderAll();
    }
    editorScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    history = [];
    future = [];
    initialImageInput.value = '';
    layerImageInput.value = '';
  }

  new Dropzone(byId('editor-dropzone'), {
    accept: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif', 'image/svg+xml', 'image/bmp', 'image/gif'],
    multiple: false,
    async onFiles(files) {
      const [file] = files;
      if (!file) return;
      await loadImageObject(file, editorScreen.classList.contains('hidden'));
    },
  });
  byId('create-canvas-btn').addEventListener('click', () => {
    initializeCanvas(
      byId('new-width').value,
      byId('new-height').value,
      byId('new-background').value
    );
  });
  byId('new-document-btn').addEventListener('click', showStartScreen);
  byId('export-btn').addEventListener('click', exportImage);
  undoButton.addEventListener('click', undo);
  redoButton.addEventListener('click', redo);
  deleteButton.addEventListener('click', removeSelected);
  duplicateButton.addEventListener('click', duplicateSelected);
  addLayerButton.addEventListener('click', openAddLayerDialog);
  closeLayerDialogButton.addEventListener('click', closeAddLayerDialog);
  chooseLayerImageButton.addEventListener('click', () => {
    closeAddLayerDialog();
    layerImageInput.click();
  });
  createEmptyLayerButton.addEventListener('click', openEmptyLayerDialog);
  closeEmptyLayerDialogButton.addEventListener('click', closeEmptyLayerDialog);
  cancelEmptyLayerButton.addEventListener('click', closeEmptyLayerDialog);
  confirmEmptyLayerButton.addEventListener('click', addEmptyLayer);
  emptyLayerBackgroundInput.addEventListener('change', syncEmptyLayerColorField);
  emptyLayerOverlay.addEventListener('click', event => {
    if (event.target === emptyLayerOverlay) closeEmptyLayerDialog();
  });
  document.addEventListener('pointerdown', event => {
    if (addLayerMenu.hidden || addLayerMenu.contains(event.target) || addLayerButton.contains(event.target)) return;
    closeAddLayerDialog();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!emptyLayerOverlay.classList.contains('hidden')) return closeEmptyLayerDialog();
    if (!addLayerMenu.hidden) {
      closeAddLayerDialog();
      addLayerButton.focus({ preventScroll: true });
    }
  });
  layerImageInput.addEventListener('change', () => {
    const [file] = layerImageInput.files;
    if (file) loadImageObject(file, false);
    layerImageInput.value = '';
  });

  document.querySelectorAll('[data-editor-tool]').forEach(button => {
    button.addEventListener('click', () => {
      const selectedTool = button.dataset.editorTool;
      if (selectedTool === 'text') return addText();
      if (selectedTool === 'image') return layerImageInput.click();
      setTool(selectedTool);
    });
  });

  colorInput.addEventListener('input', () => {
    if (syncingProperties) return;
    if (canvas?.isDrawingMode && canvas.freeDrawingBrush) canvas.freeDrawingBrush.color = colorInput.value;
    updateSelectedProperty('color', colorInput.value);
  });
  strokeInput.addEventListener('input', () => {
    if (canvas?.isDrawingMode && canvas.freeDrawingBrush) canvas.freeDrawingBrush.width = Number(strokeInput.value);
    updateSelectedProperty('stroke', strokeInput.value);
  });
  opacityInput.addEventListener('input', () => updateSelectedProperty('opacity', opacityInput.value));
  angleInput.addEventListener('change', () => updateSelectedProperty('angle', angleInput.value));
  snapToCenterInput.addEventListener('change', clearSnapGuides);
  window.addEventListener('pointerup', clearSnapGuides);
  window.addEventListener('blur', clearSnapGuides);
  zoomRange.addEventListener('input', applyVisualScale);
  byId('zoom-out-btn').addEventListener('click', () => {
    zoomRange.value = String(Math.max(Number(zoomRange.min), Number(zoomRange.value) - 10));
    applyVisualScale();
  });
  byId('zoom-in-btn').addEventListener('click', () => {
    zoomRange.value = String(Math.min(Number(zoomRange.max), Number(zoomRange.value) + 10));
    applyVisualScale();
  });

  window.addEventListener('resize', fitCanvasToWorkspace);
  document.addEventListener('keydown', event => {
    const target = event.target;
    const isFormField = target.matches?.('input, textarea, select') || activeObject()?.isEditing;
    if (isFormField) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      redo();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      duplicateSelected();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      removeSelected();
    }
  });
})();
