let currentStage = 3;
let selectedCellIndex = null;
let currentDifficulty = 'medium';

const puzzleDatabase = {
    easy: [
        {
            puzzle: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
            solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
        }
    ],
    medium: [
        {
            puzzle: "000000010400000000020000000000050407008000300001090000300400200050100000000806000",
            solution: "693784512487512936125963874932651487568247391741398625319475268856129743274836159"
        },
        {
            puzzle: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
            solution: "435269781682571493197834562826195347374682915951743628219356874548957236763418259"
        }
    ],
    hard: [
        {
            puzzle: "000000000000003085001020000000507000004000100090000000500000073002010000000040009",
            solution: "98765432124617398535192846713859724672483615969541273851926487347231956486374519"
        }
    ]
};

let initialBoard = [];
let currentBoard = [];
let solutionBoard = [];

let sudokuGridEl;
let stageButtonsContainer;
let inputButtonsContainer;
let difficultySelect;
let btnNewGame;
let btnErase;
let btnCheck;
let victoryModal;
let btnModalNext;

function initApp() {
    sudokuGridEl = document.getElementById('sudokuGrid');
    stageButtonsContainer = document.getElementById('stageButtonsContainer');
    inputButtonsContainer = document.getElementById('inputButtonsContainer');
    difficultySelect = document.getElementById('difficultySelect');
    btnNewGame = document.getElementById('btnNewGame');
    btnErase = document.getElementById('btnErase');
    btnCheck = document.getElementById('btnCheck');
    victoryModal = document.getElementById('victoryModal');
    btnModalNext = document.getElementById('btnModalNext');

    renderStageButtons();
    renderInputButtons();
    setupEventListeners();
    loadNewGame();
}

function renderStageButtons() {
    if (!stageButtonsContainer) return;
    stageButtonsContainer.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = `px-2.5 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap transition active:scale-95 flex-1 ${
            i === currentStage 
                ? 'bg-amber-500 text-white shadow' 
                : 'bg-amber-100/70 text-amber-900 hover:bg-amber-200'
        }`;
        btn.innerText = `${i}の段`;
        btn.addEventListener('click', () => setStage(i));
        stageButtonsContainer.appendChild(btn);
    }
}

function setStage(stage) {
    currentStage = stage;
    renderStageButtons();
    renderInputButtons();
    renderGrid();
}

function renderInputButtons() {
    if (!inputButtonsContainer) return;
    inputButtonsContainer.innerHTML = '';
    for (let multiplier = 1; multiplier <= 9; multiplier++) {
        const btn = document.createElement('button');
        btn.className = 'bg-slate-100 hover:bg-amber-100 active:bg-amber-200 border border-slate-200 hover:border-amber-300 rounded-lg py-2 font-extrabold text-sm text-slate-800 transition text-center shadow-sm active:scale-95';
        btn.innerText = `${currentStage}×${multiplier}`; // 式のみ表記
        btn.addEventListener('click', () => handleInputNumber(multiplier));
        inputButtonsContainer.appendChild(btn);
    }
}

function loadNewGame() {
    const diff = difficultySelect ? difficultySelect.value : 'medium';
    currentDifficulty = diff;
    const puzzles = puzzleDatabase[diff] || puzzleDatabase['medium'];
    const selected = puzzles[Math.floor(Math.random() * puzzles.length)];

    initialBoard = selected.puzzle.split('').map(v => parseInt(v, 10));
    currentBoard = [...initialBoard];
    solutionBoard = selected.solution.split('').map(v => parseInt(v, 10));

    selectedCellIndex = null;
    renderGrid();
}

function renderGrid() {
    if (!sudokuGridEl) return;
    sudokuGridEl.innerHTML = '';

    const selectedVal = selectedCellIndex !== null ? currentBoard[selectedCellIndex] : null;
    const selectedRow = selectedCellIndex !== null ? Math.floor(selectedCellIndex / 9) : null;
    const selectedCol = selectedCellIndex !== null ? selectedCellIndex % 9 : null;
    const selectedBlock = selectedCellIndex !== null ? Math.floor(selectedRow / 3) * 3 + Math.floor(selectedCol / 3) : null;

    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';

        const row = Math.floor(i / 9);
        const col = i % 9;
        const block = Math.floor(row / 3) * 3 + Math.floor(col / 3);

        const val = currentBoard[i];
        const isFixed = initialBoard[i] !== 0;

        if (val !== 0) {
            cell.innerText = currentStage * val;
        } else {
            cell.innerText = '';
        }

        if (isFixed) {
            cell.classList.add('fixed');
        } else if (val !== 0) {
            cell.classList.add('user-entered');
        }

        if (i === selectedCellIndex) {
            cell.classList.add('selected');
        } else if (selectedCellIndex !== null) {
            if (val !== 0 && val === selectedVal) {
                cell.classList.add('highlighted-same');
            } else if (row === selectedRow || col === selectedCol || block === selectedBlock) {
                cell.classList.add('highlighted-peer');
            }
        }

        cell.addEventListener('click', () => selectCell(i));
        sudokuGridEl.appendChild(cell);
    }
}

function selectCell(index) {
    selectedCellIndex = index;
    renderGrid();
}

function handleInputNumber(multiplier) {
    if (selectedCellIndex === null) return;
    if (initialBoard[selectedCellIndex] !== 0) return;

    currentBoard[selectedCellIndex] = multiplier;
    renderGrid();
    checkAutoCompletion();
}

function handleErase() {
    if (selectedCellIndex === null) return;
    if (initialBoard[selectedCellIndex] !== 0) return;

    currentBoard[selectedCellIndex] = 0;
    renderGrid();
}

function handleCheckAnswers() {
    let hasErrors = false;
    let isComplete = true;
    const cells = sudokuGridEl.children;

    for (let i = 0; i < 81; i++) {
        if (currentBoard[i] === 0) {
            isComplete = false;
        } else if (currentBoard[i] !== solutionBoard[i]) {
            hasErrors = true;
            if (cells[i]) cells[i].classList.add('error');
        }
    }

    if (hasErrors) {
        setTimeout(() => renderGrid(), 1200);
    } else if (isComplete) {
        triggerVictory();
    }
}

function checkAutoCompletion() {
    if (currentBoard.includes(0)) return;
    const isCorrect = currentBoard.every((val, idx) => val === solutionBoard[idx]);
    if (isCorrect) triggerVictory();
}

function triggerVictory() {
    if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    if (victoryModal) victoryModal.classList.remove('hidden');
}

function setupEventListeners() {
    if (btnNewGame) btnNewGame.addEventListener('click', loadNewGame);
    if (btnErase) btnErase.addEventListener('click', handleErase);
    if (btnCheck) btnCheck.addEventListener('click', handleCheckAnswers);
    if (difficultySelect) difficultySelect.addEventListener('change', loadNewGame);

    if (btnModalNext) {
        btnModalNext.addEventListener('click', () => {
            if (victoryModal) victoryModal.classList.add('hidden');
            loadNewGame();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (selectedCellIndex === null) return;
        if (e.key >= '1' && e.key <= '9') handleInputNumber(parseInt(e.key, 10));
        else if (e.key === 'Backspace' || e.key === 'Delete') handleErase();
        else if (e.key === 'ArrowUp' && selectedCellIndex >= 9) selectCell(selectedCellIndex - 9);
        else if (e.key === 'ArrowDown' && selectedCellIndex < 72) selectCell(selectedCellIndex + 9);
        else if (e.key === 'ArrowLeft' && selectedCellIndex % 9 > 0) selectCell(selectedCellIndex - 1);
        else if (e.key === 'ArrowRight' && selectedCellIndex % 9 < 8) selectCell(selectedCellIndex + 1);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}