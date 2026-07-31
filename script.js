// ゲームの状態管理
let currentStage = 3; // デフォルト: 3の段
let selectedCellIndex = null;
let timerInterval = null;
let secondsElapsed = 0;
let currentDifficulty = 'medium';

// パズルデータベース (内部的には標準ナンプレの1〜9で保持)
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

// HTML要素の取得
const sudokuGridEl = document.getElementById('sudokuGrid');
const stageButtonsContainer = document.getElementById('stageButtonsContainer');
const inputButtonsContainer = document.getElementById('inputButtonsContainer');
const currentStageBadge = document.getElementById('currentStageBadge');
const timerTextEl = document.getElementById('timerText');
const difficultySelect = document.getElementById('difficultySelect');
const btnNewGame = document.getElementById('btnNewGame');
const btnErase = document.getElementById('btnErase');
const btnCheck = document.getElementById('btnCheck');
const victoryModal = document.getElementById('victoryModal');
const btnModalNext = document.getElementById('btnModalNext');

// 効果音再生
function playTone(freq, duration = 0.1, type = 'sine') {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {}
}

function playSuccessSound() {
    playTone(523.25, 0.12);
    setTimeout(() => playTone(659.25, 0.12), 120);
    setTimeout(() => playTone(783.99, 0.25), 240);
}

function playErrorSound() {
    playTone(220, 0.15, 'sawtooth');
}

// 初期化処理
function initApp() {
    renderStageButtons();
    renderInputButtons();
    setupEventListeners();
    loadNewGame();
}

// 段切り替えボタンの生成
function renderStageButtons() {
    stageButtonsContainer.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = `px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition active:scale-95 flex-1 min-w-[58px] ${
            i === currentStage 
                ? 'bg-amber-500 text-white shadow-md' 
                : 'bg-amber-100/70 text-amber-900 hover:bg-amber-200'
        }`;
        btn.innerText = `${i}の段`;
        btn.addEventListener('click', () => setStage(i));
        stageButtonsContainer.appendChild(btn);
    }
}

// 段の変更と盤面再描画
function setStage(stage) {
    currentStage = stage;
    currentStageBadge.innerText = `${currentStage}の段`;
    renderStageButtons();
    renderInputButtons();
    renderGrid();
    playTone(440 + stage * 20, 0.08);
}

// 九九の式ボタン（回答ボタン）の生成
function renderInputButtons() {
    inputButtonsContainer.innerHTML = '';
    for (let multiplier = 1; multiplier <= 9; multiplier++) {
        const btn = document.createElement('button');
        btn.className = 'bg-slate-100 hover:bg-amber-100 active:bg-amber-200 border border-slate-200 hover:border-amber-300 rounded-xl py-2.5 px-1 font-bold transition text-center shadow-sm flex flex-col items-center justify-center active:scale-95';
        
        const formulaSpan = document.createElement('span');
        formulaSpan.className = 'text-sm font-extrabold text-slate-800';
        formulaSpan.innerText = `${currentStage}×${multiplier}`;
        
        const resultSpan = document.createElement('span');
        resultSpan.className = 'text-[11px] text-amber-600 font-bold';
        resultSpan.innerText = `= ${currentStage * multiplier}`;

        btn.appendChild(formulaSpan);
        btn.appendChild(resultSpan);

        btn.addEventListener('click', () => handleInputNumber(multiplier));
        inputButtonsContainer.appendChild(btn);
    }
}

// 新しい問題の読み込み
function loadNewGame() {
    const diff = difficultySelect.value;
    currentDifficulty = diff;
    const puzzles = puzzleDatabase[diff] || puzzleDatabase['medium'];
    const selected = puzzles[Math.floor(Math.random() * puzzles.length)];

    initialBoard = selected.puzzle.split('').map(v => parseInt(v, 10));
    currentBoard = [...initialBoard];
    solutionBoard = selected.solution.split('').map(v => parseInt(v, 10));

    selectedCellIndex = null;
    resetTimer();
    startTimer();
    renderGrid();
}

// 盤面の描画（※答えを表示）
function renderGrid() {
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
            cell.innerText = currentStage * val; // 九九の答えを表示
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
    playTone(600, 0.05);
}

function handleInputNumber(multiplier) {
    if (selectedCellIndex === null) return;
    if (initialBoard[selectedCellIndex] !== 0) return;

    currentBoard[selectedCellIndex] = multiplier;
    renderGrid();
    playTone(500, 0.05);
    checkAutoCompletion();
}

function handleErase() {
    if (selectedCellIndex === null) return;
    if (initialBoard[selectedCellIndex] !== 0) return;

    currentBoard[selectedCellIndex] = 0;
    renderGrid();
    playTone(300, 0.05);
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
        playErrorSound();
        setTimeout(() => renderGrid(), 1200);
    } else if (isComplete) {
        triggerVictory();
    } else {
        playSuccessSound();
    }
}

function checkAutoCompletion() {
    if (currentBoard.includes(0)) return;
    const isCorrect = currentBoard.every((val, idx) => val === solutionBoard[idx]);
    if (isCorrect) triggerVictory();
}

function triggerVictory() {
    stopTimer();
    playSuccessSound();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

    document.getElementById('finalTime').innerText = timerTextEl.innerText;
    document.getElementById('finalStage').innerText = `${currentStage}の段`;
    victoryModal.classList.remove('hidden');
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        secondsElapsed++;
        const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
        const secs = String(secondsElapsed % 60).padStart(2, '0');
        timerTextEl.innerText = `${mins}:${secs}`;
    }, 1000);
}

function stopTimer() { clearInterval(timerInterval); }
function resetTimer() { stopTimer(); secondsElapsed = 0; timerTextEl.innerText = "00:00"; }

function setupEventListeners() {
    btnNewGame.addEventListener('click', loadNewGame);
    btnErase.addEventListener('click', handleErase);
    btnCheck.addEventListener('click', handleCheckAnswers);
    difficultySelect.addEventListener('change', loadNewGame);

    btnModalNext.addEventListener('click', () => {
        victoryModal.classList.add('hidden');
        loadNewGame();
    });

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

window.addEventListener('DOMContentLoaded', initApp);