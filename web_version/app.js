/**
 * Undergrowth Algorithmic Visualizer - Core Application Script
 */

// --- Global Utilities & State ---
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let activeTab = 'pathfinding';
let isRunning = false;
let interruptFlag = false;
const ALGO_DETAILS = {
  astar: {
    name: "A* Search Algorithm",
    desc: "Imagine you're using Google Maps. A* looks at how far you've already traveled and also estimates how close you are to your destination. By combining these two pieces of information, it usually finds the shortest route very quickly without checking every possible path.",
    time: "O(E log V)",
    space: "O(V)"
  },

  dijkstra: {
    name: "Dijkstra's Algorithm",
    desc: "Imagine you're trying to visit every road from your house while always choosing the closest place you haven't visited yet. Dijkstra checks every possible route carefully to guarantee the shortest path, even if it has to explore many more locations than A*.",
    time: "O((V + E) log V)",
    space: "O(V)"
  },

  bfs: {
    name: "Breadth-First Search (BFS)",
    desc: "Think of dropping a stone into water. The ripples spread outward evenly in all directions. BFS explores nearby locations first, then moves farther away. Because of this, it always finds the shortest path when every move costs the same.",
    time: "O(V + E)",
    space: "O(V)"
  },

  dfs: {
    name: "Depth-First Search (DFS)",
    desc: "Imagine exploring a maze by always taking the first path you see until you hit a dead end. Then you walk back and try another path. DFS works the same way. It may find the destination, but not necessarily the shortest route.",
    time: "O(V + E)",
    space: "O(V)"
  },

  bubble: {
    name: "Bubble Sort",
    desc: "Imagine arranging books on a shelf by comparing only two neighboring books at a time. If they're in the wrong order, you swap them. After repeating this many times, the largest books gradually 'bubble' to the end.",
    time: "O(N²)",
    space: "O(1)"
  },

  insertion: {
    name: "Insertion Sort",
    desc: "Think about sorting playing cards in your hand. Every time you pick up a new card, you place it into the correct position among the cards you're already holding. That's exactly how Insertion Sort works.",
    time: "O(N²)",
    space: "O(1)"
  },

  selection: {
    name: "Selection Sort",
    desc: "Imagine looking through a pile of exam papers to find the lowest score. You place it first, then repeat the process for the remaining papers until everything is sorted.",
    time: "O(N²)",
    space: "O(1)"
  },

  quick: {
    name: "Quick Sort",
    desc: "Imagine choosing one person in a line as the reference point. Everyone shorter stands on one side, everyone taller stands on the other. Then each group repeats the same process until everyone is in order. This is why Quick Sort is usually very fast.",
    time: "O(N log N) avg / O(N²) worst",
    space: "O(log N)"
  },

  merge: {
    name: "Merge Sort",
    desc: "Imagine splitting a messy stack of papers into smaller piles until each pile has only one paper. Then you combine the piles back together in the correct order. Breaking the problem into smaller pieces makes sorting much more efficient.",
    time: "O(N log N)",
    space: "O(N)"
  },

  nqueens: {
    name: "N-Queens Solver",
    desc: "Imagine placing queens on a chessboard. Since queens can attack in every direction, each new queen must be placed where it cannot attack any others. If you get stuck, you remove the last queen and try a different spot until you find a solution.",
    time: "O(N!)",
    space: "O(N)"
  }
};

// --- DOM Initialisation & Tab Switching ---
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  initPanelToggles();
  initTabNavigation();
  initPathfinding();
  initSorting();
  initBacktracking();
  updateEducationalContent('astar');

  // Rebuild grid on resize 
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (activeTab === 'pathfinding' && !isRunning) buildGrid();
      if (activeTab === 'backtracking' && !isRunning) buildChessboard();
    }, 250);
  });
});


function initPanelToggles() {
  [['controls-toggle', 'controls-body', 'controls-chevron'],
   ['legend-toggle',   'legend-body',   'legend-chevron']].forEach(([btnId, bodyId, chevId]) => {
    const btn  = document.getElementById(btnId);
    const body = document.getElementById(bodyId);
    const chev = document.getElementById(chevId);
    if (!btn || !body) return;

    // Only activate collapse behaviour on mobile
    const isMobile = () => window.innerWidth <= 768;

    btn.addEventListener('click', () => {
      if (!isMobile()) return;  // desktop: always open
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      body.style.display = open ? 'none' : 'block';
      if (chev) chev.style.transform = open ? 'rotate(-90deg)' : 'rotate(0deg)';
    });

    // On resize back to desktop, always show panels
    window.addEventListener('resize', () => {
      if (!isMobile()) {
        body.style.display = 'block';
        btn.setAttribute('aria-expanded', 'true');
        if (chev) chev.style.transform = 'rotate(0deg)';
      }
    });
  });
}

function initTabNavigation() {
  const tabs = document.querySelectorAll('.nav-tabs .tab-btn');
  const controls = document.querySelectorAll('.algo-controls');
  const legends = document.querySelectorAll('.legend > div, .legend');
  const views = document.querySelectorAll('.algo-view');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', async () => {
      if (isRunning) {
        await stopActiveVisualisation();
      }
      
      const targetTab = tab.getAttribute('data-tab');
      activeTab = targetTab;
      
      // Update Tab UI
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      
      // Update Controls Panel
      controls.forEach(c => c.style.display = 'none');
      document.getElementById(`controls-${targetTab}`).style.display = 'block';
      
      // Update Legend Panel
      document.getElementById('legend-pathfinding').style.display = targetTab === 'pathfinding' ? 'flex' : 'none';
      document.getElementById('legend-sorting').style.display = targetTab === 'sorting' ? 'flex' : 'none';
      document.getElementById('legend-backtracking').style.display = targetTab === 'backtracking' ? 'flex' : 'none';
      
      // Update Views
      views.forEach(v => v.classList.remove('active'));
      document.getElementById(`view-${targetTab}`).classList.add('active');
      
      // Update Educational Content based on select value
      if (targetTab === 'pathfinding') {
        updateEducationalContent(document.getElementById('select-path-algo').value);
      } else if (targetTab === 'sorting') {
        updateEducationalContent(document.getElementById('select-sort-algo').value);
      } else if (targetTab === 'backtracking') {
        updateEducationalContent(document.getElementById('select-backtrack-algo').value);
      }
    });
  });
}

function updateEducationalContent(algoKey) {
  const details = ALGO_DETAILS[algoKey];
  if (!details) return;

  document.getElementById('algo-name').innerText = details.name;
  document.getElementById('algo-desc').innerText = details.desc;
  document.getElementById('algo-time-complexity').innerHTML  = `Time: <strong>${details.time}</strong>`;
  document.getElementById('algo-space-complexity').innerHTML = `Space: <strong>${details.space}</strong>`;
}

async function stopActiveVisualisation() {
  interruptFlag = true;
  await sleep(100);
  isRunning = false;
  resetButtonStates();
}

function resetButtonStates() {
  const startBtns = [
    { id: 'btn-start-path', text: 'Start Pathfinding', icon: 'play' },
    { id: 'btn-start-sort', text: 'Start Sorting', icon: 'play' },
    { id: 'btn-start-backtrack', text: 'Solve N-Queens', icon: 'play' }
  ];
  
  startBtns.forEach(btnInfo => {
    const el = document.getElementById(btnInfo.id);
    if (el) {
      el.innerHTML = `<i data-lucide="${btnInfo.icon}"></i> ${btnInfo.text}`;
      el.classList.remove('btn-accent');
      el.classList.add('btn-primary');
      el.disabled = false;
    }
  });
  
  enableControls(true);
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function setVisualisingState(btnId) {
  isRunning = true;
  interruptFlag = false;
  
  const el = document.getElementById(btnId);
  if (el) {
    el.innerHTML = `<i data-lucide="square"></i> Stop Visualisation`;
    el.classList.remove('btn-primary');
    el.classList.add('btn-accent');
  }
  
  enableControls(false);
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function enableControls(enable) {
  const selectElements = document.querySelectorAll('select, input[type="range"]');
  selectElements.forEach(el => {
    if (el.id !== 'slider-path-speed' && el.id !== 'slider-sort-speed' && el.id !== 'slider-backtrack-speed') {
      el.disabled = !enable;
    }
  });
  
  const secondaryButtons = document.querySelectorAll('.btn-secondary');
  secondaryButtons.forEach(btn => {
    btn.disabled = !enable;
  });
}



// Responsive grid dimensions
function getGridDimensions() {
  const w = window.innerWidth;
  if (w <= 480)  return { rows: 16, cols: 26 };
  if (w <= 768)  return { rows: 20, cols: 34 };
  if (w <= 1100) return { rows: 20, cols: 38 };
  return { rows: 22, cols: 45 };
}

let GRID_ROWS = 22;
let GRID_COLS = 45;
let grid = [];
let startNode = { row: 5, col: 3 };
let endNode   = { row: 5, col: 20 };
let isMouseDown = false;
let dragNode = null;

function initPathfinding() {
  const gridContainer = document.getElementById('grid');
  const pathSpeedSlider = document.getElementById('slider-path-speed');
  const pathSpeedVal = document.getElementById('path-speed-val');
  
  pathSpeedSlider.addEventListener('input', (e) => {
    pathSpeedVal.innerText = e.target.value;
  });
  
  document.getElementById('select-path-algo').addEventListener('change', (e) => {
    updateEducationalContent(e.target.value);
  });
  
  buildGrid();
  
  document.getElementById('select-maze').addEventListener('change', async (e) => {
    const mazeType = e.target.value;
    if (mazeType === 'random') {
      generateRandomMaze();
    } else if (mazeType === 'recursive') {
      await generateRecursiveMaze();
    }
    e.target.value = "";
  });
  
  document.getElementById('btn-start-path').addEventListener('click', async () => {
    if (isRunning) {
      await stopActiveVisualisation();
      return;
    }
    
    clearPathfindingVisited();
    setVisualisingState('btn-start-path');
    
    const algo = document.getElementById('select-path-algo').value;
    let found = false;
    
    if (algo === 'astar') {
      found = await runAStar();
    } else if (algo === 'dijkstra') {
      found = await runDijkstra();
    } else if (algo === 'bfs') {
      found = await runBFS();
    } else if (algo === 'dfs') {
      found = await runDFS();
    }
    
    isRunning = false;
    resetButtonStates();
  });
  
  document.getElementById('btn-clear-path-walls').addEventListener('click', () => {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (!grid[r][c].isStart && !grid[r][c].isEnd && grid[r][c].isWall) {
          grid[r][c].isWall = false;
          grid[r][c].element.className = 'node';
        }
      }
    }
  });
  
  document.getElementById('btn-clear-path-all').addEventListener('click', () => {
    buildGrid();
  });
}

function buildGrid() {
  // Recalculate responsive dimensions on every build
  const dims = getGridDimensions();
  GRID_ROWS = dims.rows;
  GRID_COLS = dims.cols;

  // Clamp start/end nodes within new bounds
  startNode.row = Math.min(startNode.row, GRID_ROWS - 1);
  startNode.col = Math.min(startNode.col, GRID_COLS - 1);
  endNode.row   = Math.min(endNode.row, GRID_ROWS - 1);
  endNode.col   = Math.min(Math.max(endNode.col, 0), GRID_COLS - 1);
  // Keep end node away from start
  if (endNode.col <= startNode.col + 2) endNode.col = Math.min(GRID_COLS - 2, startNode.col + 5);

  const gridContainer = document.getElementById('grid');
  gridContainer.innerHTML = '';

  // Calculate cell pixel size to fill available space
  const wrapper = document.getElementById('grid-wrapper');
  const availW  = wrapper ? wrapper.clientWidth  : window.innerWidth - 32;
  // On mobile, clientHeight is set by the CSS vh rule; fall back to 80% of viewport
  const wrapH   = wrapper ? wrapper.clientHeight : 0;
  const availH  = wrapH > 80 ? wrapH : window.innerHeight * 0.80;
  const cellW   = Math.floor(availW  / GRID_COLS);
  const cellH   = Math.floor(availH  / GRID_ROWS);
  const cellSize = Math.max(10, Math.min(cellW, cellH));

  gridContainer.style.gridTemplateRows    = `repeat(${GRID_ROWS}, ${cellSize}px)`;
  gridContainer.style.gridTemplateColumns = `repeat(${GRID_COLS}, ${cellSize}px)`;
  gridContainer.style.width  = `${cellSize * GRID_COLS}px`;
  gridContainer.style.height = `${cellSize * GRID_ROWS}px`;

  grid = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    const row = [];
    for (let c = 0; c < GRID_COLS; c++) {
      const nodeEl = document.createElement('div');
      nodeEl.className = 'node';
      nodeEl.dataset.row = r;
      nodeEl.dataset.col = c;

      const isStart = (r === startNode.row && c === startNode.col);
      const isEnd   = (r === endNode.row   && c === endNode.col);

      if (isStart) { nodeEl.classList.add('node-start'); nodeEl.innerText = 'S'; }
      else if (isEnd) { nodeEl.classList.add('node-end'); nodeEl.innerText = 'E'; }

      const node = {
        row: r, col: c,
        isStart, isEnd,
        isWall: false, isVisited: false,
        previousNode: null,
        distance: Infinity, gScore: Infinity, fScore: Infinity,
        element: nodeEl
      };

      // ---- Mouse events ----
      nodeEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isMouseDown = true;
        if      (node.isStart) { dragNode = 'start'; }
        else if (node.isEnd)   { dragNode = 'end'; }
        else if (node.isWall)  { dragNode = 'erase'; toggleWall(node, false); }
        else                   { dragNode = 'wall';  toggleWall(node, true); }
      });

      nodeEl.addEventListener('mouseenter', () => {
        if (!isMouseDown) return;
        if      (dragNode === 'start' && !node.isEnd   && !node.isWall) moveStartNode(node);
        else if (dragNode === 'end'   && !node.isStart && !node.isWall) moveEndNode(node);
        else if (dragNode === 'wall'  && !node.isStart && !node.isEnd)  toggleWall(node, true);
        else if (dragNode === 'erase' && !node.isStart && !node.isEnd)  toggleWall(node, false);
      });

      gridContainer.appendChild(nodeEl);
      row.push(node);
    }
    grid.push(row);
  }


  const onMouseUp = () => { isMouseDown = false; dragNode = null; };
  window.removeEventListener('mouseup', onMouseUp);
  window.addEventListener('mouseup', onMouseUp);

  
  const getNodeFromTouch = (touch) => {
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el || !el.classList.contains('node')) return null;
    const r = parseInt(el.dataset.row);
    const c = parseInt(el.dataset.col);
    if (isNaN(r) || isNaN(c)) return null;
    return grid[r][c];
  };

  gridContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isMouseDown = true;
    const node = getNodeFromTouch(e.touches[0]);
    if (!node) return;
    if      (node.isStart) dragNode = 'start';
    else if (node.isEnd)   dragNode = 'end';
    else if (node.isWall)  { dragNode = 'erase'; toggleWall(node, false); }
    else                   { dragNode = 'wall';  toggleWall(node, true); }
  }, { passive: false });

  gridContainer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const node = getNodeFromTouch(e.touches[0]);
    if (!node) return;
    if      (dragNode === 'start' && !node.isEnd   && !node.isWall) moveStartNode(node);
    else if (dragNode === 'end'   && !node.isStart && !node.isWall) moveEndNode(node);
    else if (dragNode === 'wall'  && !node.isStart && !node.isEnd)  toggleWall(node, true);
    else if (dragNode === 'erase' && !node.isStart && !node.isEnd)  toggleWall(node, false);
  }, { passive: false });

  gridContainer.addEventListener('touchend', () => {
    isMouseDown = false;
    dragNode = null;
  });
}

function toggleWall(node, makeWall) {
  node.isWall = makeWall;
  if (makeWall) {
    node.element.className = 'node node-wall';
  } else {
    node.element.className = 'node';
  }
}

function moveStartNode(node) {
  const oldNode = grid[startNode.row][startNode.col];
  oldNode.isStart = false;
  oldNode.element.className = 'node';
  oldNode.element.innerText = '';
  
  startNode = { row: node.row, col: node.col };
  node.isStart = true;
  node.element.className = 'node node-start';
  node.element.innerText = 'S';
}

function moveEndNode(node) {
  const oldNode = grid[endNode.row][endNode.col];
  oldNode.isEnd = false;
  oldNode.element.className = 'node';
  oldNode.element.innerText = '';
  
  endNode = { row: node.row, col: node.col };
  node.isEnd = true;
  node.element.className = 'node node-end';
  node.element.innerText = 'E';
}

function clearPathfindingVisited() {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const node = grid[r][c];
      node.isVisited = false;
      node.previousNode = null;
      node.distance = Infinity;
      node.gScore = Infinity;
      node.fScore = Infinity;
      
      if (!node.isStart && !node.isEnd && !node.isWall) {
        node.element.className = 'node';
      }
    }
  }
}

function getPathDelay() {
  const speed = parseInt(document.getElementById('slider-path-speed').value);
  return Math.max(5, 250 - (speed * 2.45));
}

function getNeighbors(node) {
  const neighbors = [];
  const { row, col } = node;
  
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < GRID_ROWS - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < GRID_COLS - 1) neighbors.push(grid[row][col + 1]);
  
  return neighbors.filter(neighbor => !neighbor.isWall);
}

async function animateShortestPath(endNodeInstance) {
  const path = [];
  let current = endNodeInstance.previousNode;
  
  while (current && !current.isStart) {
    path.push(current);
    current = current.previousNode;
  }
  
  path.reverse();
  
  for (let i = 0; i < path.length; i++) {
    if (interruptFlag) return;
    path[i].element.className = 'node node-shortest-path';
    await sleep(25);
  }
}

// 1. A* Search
async function runAStar() {
  const start = grid[startNode.row][startNode.col];
  const end = grid[endNode.row][endNode.col];
  
  start.gScore = 0;
  start.fScore = manhattanDistance(start, end);
  
  const openSet = [start];
  const openSetHash = new Set([start]);
  
  while (openSet.length > 0) {
    if (interruptFlag) return false;
    
    openSet.sort((a, b) => a.fScore - b.fScore);
    const current = openSet.shift();
    openSetHash.delete(current);
    
    if (current === end) {
      await animateShortestPath(end);
      return true;
    }
    
    if (current !== start) {
      current.isVisited = true;
      current.element.className = 'node node-visited';
      await sleep(getPathDelay());
    }
    
    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      const tempG = current.gScore + 1;
      
      if (tempG < neighbor.gScore) {
        neighbor.previousNode = current;
        neighbor.gScore = tempG;
        neighbor.fScore = tempG + manhattanDistance(neighbor, end);
        
        if (!openSetHash.has(neighbor)) {
          openSet.push(neighbor);
          openSetHash.add(neighbor);
        }
      }
    }
  }
  return false;
}

function manhattanDistance(nodeA, nodeB) {
  return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
}

// 2. Dijkstra's Algorithm
async function runDijkstra() {
  const start = grid[startNode.row][startNode.col];
  const end = grid[endNode.row][endNode.col];
  
  start.distance = 0;
  const unvisitedNodes = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      unvisitedNodes.push(grid[r][c]);
    }
  }
  
  while (unvisitedNodes.length > 0) {
    if (interruptFlag) return false;
    
    unvisitedNodes.sort((a, b) => a.distance - b.distance);
    const current = unvisitedNodes.shift();
    
    if (current.isWall) continue;
    if (current.distance === Infinity) break;
    
    if (current === end) {
      await animateShortestPath(end);
      return true;
    }
    
    if (current !== start) {
      current.isVisited = true;
      current.element.className = 'node node-visited';
      await sleep(getPathDelay());
    }
    
    const neighbors = getNeighbors(current).filter(n => unvisitedNodes.includes(n));
    for (const neighbor of neighbors) {
      const altDistance = current.distance + 1;
      if (altDistance < neighbor.distance) {
        neighbor.distance = altDistance;
        neighbor.previousNode = current;
      }
    }
  }
  return false;
}

// 3. BFS (Breadth-First Search)
async function runBFS() {
  const start = grid[startNode.row][startNode.col];
  const end = grid[endNode.row][endNode.col];
  
  const queue = [start];
  const visited = new Set([start]);
  
  while (queue.length > 0) {
    if (interruptFlag) return false;
    
    const current = queue.shift();
    
    if (current === end) {
      await animateShortestPath(end);
      return true;
    }
    
    if (current !== start) {
      current.isVisited = true;
      current.element.className = 'node node-visited';
      await sleep(getPathDelay());
    }
    
    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        neighbor.previousNode = current;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return false;
}

// 4. DFS (Depth-First Search)
async function runDFS() {
  const start = grid[startNode.row][startNode.col];
  const end = grid[endNode.row][endNode.col];
  
  const stack = [start];
  const visited = new Set([start]);
  
  while (stack.length > 0) {
    if (interruptFlag) return false;
    
    const current = stack.pop();
    
    if (current === end) {
      await animateShortestPath(end);
      return true;
    }
    
    if (current !== start) {
      current.isVisited = true;
      current.element.className = 'node node-visited';
      await sleep(getPathDelay());
    }
    
    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        neighbor.previousNode = current;
        visited.add(neighbor);
        stack.push(neighbor);
      }
    }
  }
  return false;
}

// --- Maze Generation ---

function generateRandomMaze() {
  clearPathfindingVisited();
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const node = grid[r][c];
      if (!node.isStart && !node.isEnd) {
        if (Math.random() < 0.3) {
          toggleWall(node, true);
        } else {
          toggleWall(node, false);
        }
      }
    }
  }
}

// Recursive Backtracking Maze Generator (DFS-based)
async function generateRecursiveMaze() {
  clearPathfindingVisited();
  
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const node = grid[r][c];
      if (!node.isStart && !node.isEnd) {
        toggleWall(node, true);
      }
    }
  }
  
  const visited = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(false));
  const stack = [];
  
  let currRow = 1;
  let currCol = 1;
  visited[currRow][currCol] = true;
  toggleWall(grid[currRow][currCol], false);
  stack.push({ r: currRow, c: currCol });
  
  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = [];
    
    const dirs = [
      { dr: -2, dc: 0, rDir: -1, cDir: 0 },
      { dr: 2, dc: 0, rDir: 1, cDir: 0 },
      { dr: 0, dc: -2, rDir: 0, cDir: -1 },
      { dr: 0, dc: 2, rDir: 0, cDir: 1 }
    ];
    
    for (const d of dirs) {
      const nr = current.r + d.dr;
      const nc = current.c + d.dc;
      
      if (nr > 0 && nr < GRID_ROWS - 1 && nc > 0 && nc < GRID_COLS - 1) {
        if (!visited[nr][nc]) {
          neighbors.push({ r: nr, c: nc, d });
        }
      }
    }
    
    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      
      const interRow = current.r + next.d.rDir;
      const interCol = current.c + next.d.cDir;
      
      toggleWall(grid[interRow][interCol], false);
      toggleWall(grid[next.r][next.c], false);
      
      visited[next.r][next.c] = true;
      stack.push({ r: next.r, c: next.c });
      
      await sleep(5);
    } else {
      stack.pop();
    }
  }
  
  toggleWall(grid[startNode.row][startNode.col], false);
  toggleWall(grid[endNode.row][endNode.col], false);
  
  const startNeighbors = [
    grid[startNode.row + 1] ? grid[startNode.row + 1][startNode.col] : null,
    grid[startNode.row - 1] ? grid[startNode.row - 1][startNode.col] : null,
    grid[startNode.row][startNode.col + 1],
    grid[startNode.row][startNode.col - 1]
  ].filter(n => n);
  
  if (startNeighbors.every(n => n.isWall)) {
    toggleWall(startNeighbors[0], false);
  }
  
  const endNeighbors = [
    grid[endNode.row + 1] ? grid[endNode.row + 1][endNode.col] : null,
    grid[endNode.row - 1] ? grid[endNode.row - 1][endNode.col] : null,
    grid[endNode.row][endNode.col + 1],
    grid[endNode.row][endNode.col - 1]
  ].filter(n => n);
  
  if (endNeighbors.every(n => n.isWall)) {
    toggleWall(endNeighbors[0], false);
  }
}



let sortingArray = [];
let sortingBars = [];

function initSorting() {
  const sortSizeSlider = document.getElementById('slider-sort-size');
  const sortSizeVal = document.getElementById('sort-size-val');
  const sortSpeedSlider = document.getElementById('slider-sort-speed');
  const sortSpeedVal = document.getElementById('sort-speed-val');
  
  sortSizeSlider.addEventListener('input', (e) => {
    sortSizeVal.innerText = e.target.value;
    generateSortingArray();
  });
  
  sortSpeedSlider.addEventListener('input', (e) => {
    sortSpeedVal.innerText = e.target.value;
  });
  
  document.getElementById('select-sort-algo').addEventListener('change', (e) => {
    updateEducationalContent(e.target.value);
  });
  
  generateSortingArray();
  
  document.getElementById('btn-reset-sort').addEventListener('click', () => {
    generateSortingArray();
  });
  
  document.getElementById('btn-start-sort').addEventListener('click', async () => {
    if (isRunning) {
      await stopActiveVisualisation();
      return;
    }
    
    setVisualisingState('btn-start-sort');
    
    const algo = document.getElementById('select-sort-algo').value;
    const direction = document.getElementById('select-sort-direction').value;
    
    if (algo === 'bubble') {
      await runBubbleSort(direction);
    } else if (algo === 'insertion') {
      await runInsertionSort(direction);
    } else if (algo === 'selection') {
      await runSelectionSort(direction);
    } else if (algo === 'quick') {
      await runQuickSort(0, sortingArray.length - 1, direction);
      if (!interruptFlag) {
        await highlightAllBarsSorted();
      }
    } else if (algo === 'merge') {
      await runMergeSort(0, sortingArray.length - 1, direction);
      if (!interruptFlag) {
        await highlightAllBarsSorted();
      }
    }
    
    isRunning = false;
    resetButtonStates();
  });
}

function generateSortingArray() {
  const container = document.getElementById('sorting-container');
  container.innerHTML = '';
  
  const size = parseInt(document.getElementById('slider-sort-size').value);
  sortingArray = [];
  sortingBars = [];
  
  for (let i = 0; i < size; i++) {
    const heightPercent = Math.floor(Math.random() * 93) + 5;
    sortingArray.push(heightPercent);
    
    const bar = document.createElement('div');
    bar.className = 'sorting-bar';
    bar.style.height = `${heightPercent}%`;
    
    container.appendChild(bar);
    sortingBars.push(bar);
  }
}

function getSortDelay() {
  const speed = parseInt(document.getElementById('slider-sort-speed').value);
  return Math.max(1, 400 - (speed * 3.99));
}

function highlightBar(index, className) {
  if (sortingBars[index]) {
    sortingBars[index].classList.add(className);
  }
}

function unhighlightBar(index, className) {
  if (sortingBars[index]) {
    if (className) {
      sortingBars[index].classList.remove(className);
    } else {
      sortingBars[index].className = 'sorting-bar';
    }
  }
}

function updateBarHeight(index) {
  if (sortingBars[index]) {
    sortingBars[index].style.height = `${sortingArray[index]}%`;
  }
}

async function highlightAllBarsSorted() {
  for (let i = 0; i < sortingBars.length; i++) {
    sortingBars[i].className = 'sorting-bar bar-sorted';
    await sleep(Math.min(15, 300 / sortingBars.length));
  }
}

// --- Sorting Algorithms ---

// 1. Bubble Sort
async function runBubbleSort(direction) {
  const n = sortingArray.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (interruptFlag) return;
      
      highlightBar(j, 'bar-compare');
      highlightBar(j + 1, 'bar-compare');
      await sleep(getSortDelay());
      
      const shouldSwap = direction === 'asc'
        ? (sortingArray[j] > sortingArray[j + 1])
        : (sortingArray[j] < sortingArray[j + 1]);
        
      if (shouldSwap) {
        const temp = sortingArray[j];
        sortingArray[j] = sortingArray[j + 1];
        sortingArray[j + 1] = temp;
        
        updateBarHeight(j);
        updateBarHeight(j + 1);
        
        highlightBar(j, 'bar-swap');
        highlightBar(j + 1, 'bar-swap');
        await sleep(getSortDelay());
        swapped = true;
      }
      
      unhighlightBar(j);
      unhighlightBar(j + 1);
    }
    
    highlightBar(n - i - 1, 'bar-sorted');
    if (!swapped) break;
  }
  
  await highlightAllBarsSorted();
}

// 2. Insertion Sort
async function runInsertionSort(direction) {
  const n = sortingArray.length;
  highlightBar(0, 'bar-sorted');
  
  for (let i = 1; i < n; i++) {
    let key = sortingArray[i];
    let j = i - 1;
    
    highlightBar(i, 'bar-compare');
    await sleep(getSortDelay());
    
    while (j >= 0) {
      if (interruptFlag) return;
      
      highlightBar(j, 'bar-compare');
      await sleep(getSortDelay());
      
      const shouldShift = direction === 'asc'
        ? (sortingArray[j] > key)
        : (sortingArray[j] < key);
        
      if (shouldShift) {
        sortingArray[j + 1] = sortingArray[j];
        updateBarHeight(j + 1);
        highlightBar(j + 1, 'bar-swap');
        highlightBar(j, 'bar-swap');
        await sleep(getSortDelay());
        unhighlightBar(j + 1);
        unhighlightBar(j);
        j--;
      } else {
        unhighlightBar(j);
        break;
      }
    }
    
    sortingArray[j + 1] = key;
    updateBarHeight(j + 1);
    unhighlightBar(i);
    
    for (let k = 0; k <= i; k++) {
      highlightBar(k, 'bar-sorted');
    }
  }
}

// 3. Selection Sort
async function runSelectionSort(direction) {
  const n = sortingArray.length;
  
  for (let i = 0; i < n - 1; i++) {
    let extremeIndex = i;
    highlightBar(i, 'bar-compare');
    
    for (let j = i + 1; j < n; j++) {
      if (interruptFlag) return;
      
      highlightBar(j, 'bar-compare');
      await sleep(getSortDelay());
      
      const isMoreExtreme = direction === 'asc'
        ? (sortingArray[j] < sortingArray[extremeIndex])
        : (sortingArray[j] > sortingArray[extremeIndex]);
        
      if (isMoreExtreme) {
        unhighlightBar(extremeIndex);
        extremeIndex = j;
        highlightBar(extremeIndex, 'bar-swap');
      } else {
        unhighlightBar(j);
      }
    }
    
    if (extremeIndex !== i) {
      const temp = sortingArray[i];
      sortingArray[i] = sortingArray[extremeIndex];
      sortingArray[extremeIndex] = temp;
      
      updateBarHeight(i);
      updateBarHeight(extremeIndex);
      
      highlightBar(i, 'bar-swap');
      highlightBar(extremeIndex, 'bar-swap');
      await sleep(getSortDelay());
      unhighlightBar(extremeIndex);
    }
    
    unhighlightBar(i);
    highlightBar(i, 'bar-sorted');
  }
  
  highlightBar(n - 1, 'bar-sorted');
}

// 4. Quick Sort
async function runQuickSort(low, high, direction) {
  if (low < high) {
    const pi = await partition(low, high, direction);
    if (interruptFlag) return;
    await runQuickSort(low, pi - 1, direction);
    await runQuickSort(pi + 1, high, direction);
  }
}

async function partition(low, high, direction) {
  const pivot = sortingArray[high];
  highlightBar(high, 'bar-compare');
  
  let i = low - 1;
  
  for (let j = low; j < high; j++) {
    if (interruptFlag) return low;
    
    highlightBar(j, 'bar-compare');
    await sleep(getSortDelay());
    
    const shouldSwap = direction === 'asc'
      ? (sortingArray[j] < pivot)
      : (sortingArray[j] > pivot);
      
    if (shouldSwap) {
      i++;
      const temp = sortingArray[i];
      sortingArray[i] = sortingArray[j];
      sortingArray[j] = temp;
      
      updateBarHeight(i);
      updateBarHeight(j);
      highlightBar(i, 'bar-swap');
      highlightBar(j, 'bar-swap');
      await sleep(getSortDelay());
      unhighlightBar(i);
    }
    unhighlightBar(j);
  }
  
  const temp = sortingArray[i + 1];
  sortingArray[i + 1] = sortingArray[high];
  sortingArray[high] = temp;
  
  updateBarHeight(i + 1);
  updateBarHeight(high);
  
  highlightBar(i + 1, 'bar-swap');
  highlightBar(high, 'bar-swap');
  await sleep(getSortDelay());
  
  unhighlightBar(i + 1);
  unhighlightBar(high);
  
  return i + 1;
}

// 5. Merge Sort
async function runMergeSort(l, r, direction) {
  if (l < r) {
    const m = Math.floor((l + r) / 2);
    await runMergeSort(l, m, direction);
    if (interruptFlag) return;
    await runMergeSort(m + 1, r, direction);
    if (interruptFlag) return;
    await merge(l, m, r, direction);
  }
}

async function merge(l, m, r, direction) {
  const n1 = m - l + 1;
  const n2 = r - m;
  
  const L = [];
  const R = [];
  
  for (let i = 0; i < n1; i++) L.push(sortingArray[l + i]);
  for (let j = 0; j < n2; j++) R.push(sortingArray[m + 1 + j]);
  
  let i = 0, j = 0, k = l;
  
  while (i < n1 && j < n2) {
    if (interruptFlag) return;
    
    highlightBar(k, 'bar-compare');
    await sleep(getSortDelay());
    
    const condition = direction === 'asc'
      ? (L[i] <= R[j])
      : (L[i] >= R[j]);
      
    if (condition) {
      sortingArray[k] = L[i];
      i++;
    } else {
      sortingArray[k] = R[j];
      j++;
    }
    
    updateBarHeight(k);
    highlightBar(k, 'bar-swap');
    await sleep(getSortDelay());
    unhighlightBar(k);
    k++;
  }
  
  while (i < n1) {
    if (interruptFlag) return;
    sortingArray[k] = L[i];
    updateBarHeight(k);
    highlightBar(k, 'bar-swap');
    await sleep(getSortDelay());
    unhighlightBar(k);
    i++;
    k++;
  }
  
  while (j < n2) {
    if (interruptFlag) return;
    sortingArray[k] = R[j];
    updateBarHeight(k);
    highlightBar(k, 'bar-swap');
    await sleep(getSortDelay());
    unhighlightBar(k);
    j++;
    k++;
  }
}



let backtrackBoard = [];
let btCells = [];
let btSteps = 0;
let btSolutions = 0;

function initBacktracking() {
  const sizeSlider = document.getElementById('slider-backtrack-size');
  const sizeVal = document.getElementById('backtrack-size-val');
  const speedSlider = document.getElementById('slider-backtrack-speed');
  const speedVal = document.getElementById('backtrack-speed-val');
  
  sizeSlider.addEventListener('input', (e) => {
    sizeVal.innerText = e.target.value;
    buildChessboard();
  });
  
  speedSlider.addEventListener('input', (e) => {
    speedVal.innerText = e.target.value;
  });
  
  document.getElementById('select-backtrack-algo').addEventListener('change', (e) => {
    updateEducationalContent(e.target.value);
  });
  
  buildChessboard();
  
  document.getElementById('btn-reset-backtrack').addEventListener('click', () => {
    buildChessboard();
  });
  
  document.getElementById('btn-start-backtrack').addEventListener('click', async () => {
    if (isRunning) {
      await stopActiveVisualisation();
      return;
    }
    
    buildChessboard();
    setVisualisingState('btn-start-backtrack');
    
    const size = parseInt(document.getElementById('slider-backtrack-size').value);
    
    backtrackBoard = Array(size).fill(-1);
    btSteps = 0;
    btSolutions = 0;
    
    document.getElementById('steps-count').innerText = 0;
    document.getElementById('solutions-count').innerText = 0;
    
    await runNQueensSolver(0, size);
    
    isRunning = false;
    resetButtonStates();
  });
}

function buildChessboard() {
  const boardContainer = document.getElementById('chessboard');
  boardContainer.innerHTML = '';

  const size = parseInt(document.getElementById('slider-backtrack-size').value);

  // Fit the board to the available viewport width with a max cap
  const visualCard = document.querySelector('.visualizer-card');
  const availPx = visualCard ? visualCard.clientWidth - 32 : Math.min(window.innerWidth - 48, 420);
  const maxBoardPx = Math.min(availPx, 420);
  const cellSize = Math.max(28, Math.floor(maxBoardPx / size));

  boardContainer.style.width  = `${cellSize * size}px`;
  boardContainer.style.height = `${cellSize * size}px`;
  boardContainer.style.gridTemplateRows    = `repeat(${size}, 1fr)`;
  boardContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  btCells = [];

  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      const cell = document.createElement('div');
      cell.className = `board-cell ${((r + c) % 2 === 0) ? 'cell-light' : 'cell-dark'}`;
      cell.style.width  = `${cellSize}px`;
      cell.style.height = `${cellSize}px`;
      // Scale queen icon font/svg relative to cell
      cell.style.fontSize = `${Math.max(12, cellSize * 0.55)}px`;

      boardContainer.appendChild(cell);
      row.push(cell);
    }
    btCells.push(row);
  }

  document.getElementById('steps-count').innerText = '0';
  document.getElementById('solutions-count').innerText = '0';
}

function getBacktrackDelay() {
  const speed = parseInt(document.getElementById('slider-backtrack-speed').value);
  return Math.max(5, 1000 - (speed * 9.9));
}

function placeQueenVisual(row, col) {
  if (btCells[row] && btCells[row][col]) {
    const cell = btCells[row][col];
    cell.classList.add('cell-queen');
    cell.innerHTML = `
      <svg class="queen-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 4L16 9L21 6L19 18H5L3 6L8 9L12 4Z" fill="var(--accent-clay)"/>
        <circle cx="12" cy="3" r="1.5" fill="var(--accent-clay)"/>
        <circle cx="21" cy="5" r="1.5" fill="var(--accent-clay)"/>
        <circle cx="3" cy="5" r="1.5" fill="var(--accent-clay)"/>
      </svg>
    `;
  }
}

function removeQueenVisual(row, col) {
  if (btCells[row] && btCells[row][col]) {
    const cell = btCells[row][col];
    cell.classList.remove('cell-queen');
    cell.innerHTML = '';
  }
}

function highlightCell(row, col, className) {
  if (btCells[row] && btCells[row][col]) {
    btCells[row][col].classList.add(className);
  }
}

function unhighlightCell(row, col) {
  if (btCells[row] && btCells[row][col]) {
    btCells[row][col].classList.remove('cell-threatened', 'cell-success');
  }
}

async function highlightSuccessBoard() {
  const size = btCells.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (backtrackBoard[r] === c) {
        highlightCell(r, c, 'cell-success');
      }
    }
  }
  await sleep(1500);
}

function isQueenSafe(row, col, size) {
  for (let i = 0; i < row; i++) {
    const qCol = backtrackBoard[i];
    if (qCol === col) return false;
    if (Math.abs(qCol - col) === Math.abs(i - row)) return false;
  }
  return true;
}

async function runNQueensSolver(row, size) {
  if (interruptFlag) return false;
  
  if (row === size) {
    btSolutions++;
    document.getElementById('solutions-count').innerText = btSolutions;
    await highlightSuccessBoard();
    return true;
  }
  
  for (let col = 0; col < size; col++) {
    if (interruptFlag) return false;
    
    btSteps++;
    document.getElementById('steps-count').innerText = btSteps;
    
    placeQueenVisual(row, col);
    await sleep(getBacktrackDelay());
    
    if (isQueenSafe(row, col, size)) {
      backtrackBoard[row] = col;
      highlightCell(row, col, 'cell-success');
      await sleep(getBacktrackDelay() / 2);
      
      const foundSolution = await runNQueensSolver(row + 1, size);
      if (foundSolution) return true;
      
      backtrackBoard[row] = -1;
      removeQueenVisual(row, col);
      highlightCell(row, col, 'cell-threatened');
      await sleep(getBacktrackDelay() / 2);
      unhighlightCell(row, col);
    } else {
      highlightCell(row, col, 'cell-threatened');
      await sleep(getBacktrackDelay());
      removeQueenVisual(row, col);
      unhighlightCell(row, col);
    }
  }
  
  return false;
}
