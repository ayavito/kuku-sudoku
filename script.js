let selectedDan = null;

function selectDan(dan) {
  selectedDan = dan;

  const buttons = document.querySelectorAll("#dan-buttons button");

  buttons.forEach(button => {
    button.style.backgroundColor = "";
  });

  buttons[dan - 1].style.backgroundColor = "#87cefa";
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