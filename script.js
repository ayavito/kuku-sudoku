let selectedDan = null;

let selectedDan = null;

function selectDan(dan) {
  const buttons = document.querySelectorAll("#dan-buttons button");
  const button = buttons[dan - 1];

  // 2のだん以外は選択不可
  if (dan !== 2) {
    button.classList.add("locked");

    setTimeout(() => {
      button.classList.remove("locked");
    }, 300);

    return;
  }

  // 2のだんを選択
  selectedDan = dan;

  buttons.forEach(button => {
    button.style.backgroundColor = "";
  });

  button.style.backgroundColor = "#87cefa";
}

function startGame() {
  document.querySelector(".container").style.display = "none";
  document.getElementById("game").style.display = "block";

  createBoard();
}


function createBoard() {
  const board = document.getElementById("board");

  board.innerHTML = "";

  for (let i = 0; i < 81; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    board.appendChild(cell);
  }
}