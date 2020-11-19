'use strict'
const MINE = '💣';

// The Model
var gBoard;
var gBoards = [];
var gShownCounts = [];
var gMarkedCounts = [];
var gGameTimeInterval;
var gGameTimeStamp;
var gFirstclick;
var gManualMinesCount;
var gIsHint = false;

var gLevel = {
    SIZE: 8,
    MINES: 12
};
var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    isMinesManual: false,
    lives: 3,
    hints: 3,
    numSafeKey: 3
};

// This is called when page loads
function initGame() {
    var elMarked = document.querySelector('.mark-count span')
    gGame.isOn = true;
    gFirstclick = true;
    gManualMinesCount = 0;
    elMarked.innerText = gLevel.MINES;
    gBoard = buildBoard();
    renderBoard(gBoard);
    disableRightClick();
    updateTopScores();
}

function restart() {
    var elSmiley = document.querySelector('.smiley')
    var elHints = document.querySelectorAll('.hints button')
    var elLives = document.querySelector('.lives span')
    var elSafeKeySpan = document.querySelector('.safe-key span')
    var elBtnSafe = document.querySelector('.safe-key button')
    var elTimer = document.querySelector('.clock');
    resetTimer()
    elTimer.innerText = 0;
    gBoards = []
    elSmiley.innerText = '😀';
    gGame.secsPassed = 0;
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.lives = 3;
    elLives.innerText = gGame.lives;
    gGame.hints = 3;
    gGame.numSafeKey = 3;
    elSafeKeySpan.innerText = gGame.numSafeKey;
    elBtnSafe.classList.remove('safe-done')
    for (var i = 0; i < gGame.hints; i++) {
        elHints[i].classList.remove('used')
    }

    initGame();
}

// Builds the board Set mines at random locations Call setMinesNegsCount() Return the created board
function buildBoard() {
    var board = [];
    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = [];
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
    return board;
}

function buildBoardWithMines(board, pos) {
    if (gManualMinesCount === 0) setMines(board, pos);
    else renderBoard(board)
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j].minesAroundCount = setMinesNegsCount(board, { i, j });
        }
    }
    return board;
}

function setMines(board, pos) {
    var possibleMineIdxs = shuffle(createNums(gLevel.SIZE * gLevel.SIZE));
    var firstClickIdx = possibleMineIdxs.indexOf((pos.i) * gLevel.SIZE + pos.j + 1)
    possibleMineIdxs.splice(firstClickIdx, 1);
    for (var i = 0; i < gLevel.MINES; i++) {
        var mineIdx = possibleMineIdxs.pop()
        var mineLocaction = { i: Math.floor((mineIdx - 1) / gLevel.SIZE), j: (mineIdx - 1) % gLevel.SIZE };
        //console.log(mineLocaction)
        board[mineLocaction.i][mineLocaction.j].isMine = true;
    }
}

// Count mines around each cell and set the cell's minesAroundCount.
function setMinesNegsCount(board, pos) {
    var count = 0
    if (board[pos.i][pos.j].isMine) return null;
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i > board.length - 1) continue
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j > board.length - 1) continue
            if (i === pos.i && j === pos.j) continue
            if (board[i][j].isMine) count++
        }
    }
    return count;
}

// Render the board as a <table> to the page
function renderBoard(board) {
    var printBoard = [];
    for (var i = 0; i < gLevel.SIZE; i++) {
        printBoard[i] = [];
        for (var j = 0; j < gLevel.SIZE; j++) {
            if (board[i][j].isShown) {
                if (board[i][j].isMine) printBoard[i][j] = MINE;
                else printBoard[i][j] = board[i][j].minesAroundCount ? board[i][j].minesAroundCount : '';
            }
            else printBoard[i][j] = '';
        }
    }
    printMat(printBoard, '.board-container');
    return;
}

// Called when a cell (td) is clicked
function cellClicked(elCell, i, j) {
    if (gGame.isOn) {
        if (gFirstclick && !gGame.isMinesManual) {
            if (!gGameTimeInterval) gGameTimeInterval = setInterval(updateTimer, 10);
            gBoard = buildBoardWithMines(gBoard, { i, j });
            gFirstclick = false;
            if (gManualMinesCount) return
        }
        if (gGame.isMinesManual) {
            setManualMine(elCell, { i, j })
            elCell.classList.remove('cell-covered')
            renderCell({ i, j }, MINE);
            return;
        }
        if (gIsHint) {
            showCell(elCell, i, j);
            expandShown(gBoard, elCell, { i, j });
            setTimeout(function () { hideCellAndNegs(gBoard, { i, j }) }, 1000);
            gGame.hints--;
            gIsHint = false;
            return;
        }
        if (gBoard[i][j].isMarked) return
        if (gBoard[i][j].isMine) {
            var elLives = document.querySelector('.lives span')
            elLives.innerText = --gGame.lives;
            if (gGame.lives) {
                elCell.classList.remove('cell-covered')
                renderCell({ i, j }, MINE);
                setTimeout(function () { elCell.classList.add('cell-covered'); renderCell({ i, j }, ''); }, 1000)
            }
            else {
                gameOver(false);
            }
        }
        else {
            // make a copy of the board fo undo
            gBoards.push(copyBoard(gBoard));
            gShownCounts.push(gGame.shownCount);
            gMarkedCounts.push(gGame.markedCount);
            showCell(elCell, i, j);
            checkGameOver();
            if (gBoard[i][j].minesAroundCount === 0) {
                expandShown(gBoard, elCell, { i, j });
            }

        }
    }
}

// Called on right click to mark a cell (suspected to be a mine) Search the web (andimplement) how to hide the context menu on right click
function cellMarked(elCell) {
    if (gGame.isOn) {
        if (!gGameTimeInterval) gGameTimeInterval = setInterval(updateTimer, 10);
        gBoards.push(copyBoard(gBoard));
        gShownCounts.push(gGame.shownCount);
        gMarkedCounts.push(gGame.markedCount);
        var cellLocation = getCellCoord(elCell.classList[0]);
        gGame.markedCount = gBoard[cellLocation.i][cellLocation.j].isMarked ? --gGame.markedCount : ++gGame.markedCount;
        gBoard[cellLocation.i][cellLocation.j].isMarked = !gBoard[cellLocation.i][cellLocation.j].isMarked;
        var elMarked = document.querySelector('.mark-count span')
        elMarked.innerText = gLevel.MINES - gGame.markedCount;
        elCell.classList.toggle('cell-flagged')
    }
}

// Game ends when all mines are marked, and all the other cells are shown
function checkGameOver() {
    if (gGame.shownCount === (gLevel.SIZE * gLevel.SIZE - gLevel.MINES)) {
        console.log('Game Over')
        gameOver(true)
    }
}

// When user clicks a cell with no mines around, this function opens not only that cell, but also its neighbors.
// NOTE: start with a basic implementation that only opens the non-mine 1st degree neighbors
function expandShown(board, elCell, pos) {
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i > board.length - 1) continue
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j > board.length - 1) continue
            if (i === pos.i && j === pos.j) continue
            if (board[i][j].isShown) continue
            if (board[i][j].isMarked) continue
            showCell(null, i, j)
            if (!gIsHint) {
                checkGameOver();
                if (board[i][j].minesAroundCount === 0) {
                    expandShown(board, elCell, { i, j });

                }
            }
        }
    }
    return;

}

// Need to hide cells after hint is over
function hideCellAndNegs(board, pos) {
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i > board.length - 1) continue
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j > board.length - 1) continue
            hideCell(i, j)
        }
    }
    return;
}

// Hides one cell
function hideCell(i, j) {
    gBoard[i][j].isShown = false;
    gGame.shownCount--;
    renderCell({ i, j }, '')
    var elCell = document.querySelector(getClassName({ i, j }));
    elCell.classList.add('cell-covered')
}


function disableRightClick() {
    window.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    }, false);
}

function gameOver(isVictory) {
    gGame.isOn = false;
    var elSmiley = document.querySelector('.smiley')
    var elCell;
    resetTimer();
    if (isVictory) {
        saveTopScore();
        elSmiley.innerText = '😎';
        for (var i = 0; i < gLevel.SIZE; i++) {
            for (var j = 0; j < gLevel.SIZE; j++) {
                if (gBoard[i][j].isMine) {
                    gBoard[i][j].isMarked = true;
                    elCell = document.querySelector(`.cell-${i}-${j}`)
                    elCell.classList.add('cell-flagged')

                }
                else gBoard[i][j].isShown = true;
            }
        }
    }
    else {
        for (var i = 0; i < gLevel.SIZE; i++) {
            for (var j = 0; j < gLevel.SIZE; j++) {
                if (gBoard[i][j].isMine) gBoard[i][j].isShown = true;
            }
        }
        renderBoard(gBoard);
        elSmiley.innerText = '🤯';
    }
}

function updateTimer() {
    if (!gGameTimeStamp) gGameTimeStamp = Date.now()
    var elTimer = document.querySelector('.clock');
    var ts = Date.now();
    gGame.secsPassed = ((ts - gGameTimeStamp) / 1000).toFixed(0);
    elTimer.innerText = gGame.secsPassed + 's';
}

function resetTimer() {

    clearInterval(gGameTimeInterval);
    gGameTimeInterval = null;
    gGameTimeStamp = null;
}

function showCell(elCell, i, j) {
    gBoard[i][j].isShown = true;
    gGame.shownCount++;
    if (!gBoard[i][j].isMine) renderCell({ i, j }, gBoard[i][j].minesAroundCount ? gBoard[i][j].minesAroundCount : '');
    else renderCell({ i, j }, MINE);
    elCell = elCell ? elCell : document.querySelector(getClassName({ i, j }));
    elCell.classList.remove('cell-covered')
}

// Helper function to get classname from the location
function getClassName(location) {
    var cellClass = '.cell-' + location.i + '-' + location.j;
    return cellClass;
}

function changeBoardSize(elBtn) {

    // Model
    var currGameSize = +elBtn.dataset.size
    switch (currGameSize) {
        case 0:
            gLevel.SIZE = 4;
            gLevel.MINES = 2;
            break;
        case 1:
            gLevel.SIZE = 8;
            gLevel.MINES = 12;
            break;
        case 2:
            gLevel.SIZE = 12;
            gLevel.MINES = 30;
            break;
        default:
            break;
    }

    // New size --> New game.
    gGame.isOn = false;
    resetTimer();
    restart();
}

function saveTopScore() {
    var topScore;
    var selector;
    switch (gLevel.SIZE) {
        case 4:
            if (localStorage.bestScoreBegginer) {
                if (gGame.secsPassed > +localStorage.bestScoreBegginer) return
            }
            topScore = localStorage.bestScoreBegginer = gGame.secsPassed;
            selector = '.beginner';
            break;
        case 8:
            if (localStorage.bestScoreMedium) {
                if (gGame.secsPassed > +localStorage.bestScoreMedium) return
            }
            topScore = localStorage.bestScoreMedium = gGame.secsPassed;
            selector = '.medium';
            break;
        case 12:
            if (localStorage.bestScoreExpert) {
                if (gGame.secsPassed > +localStorage.bestScoreExpert) return
            }
            topScore = localStorage.bestScoreExpert = gGame.secsPassed;
            selector = '.expert';
            break;
    }
    var elTopScore = document.querySelector(selector);
    elTopScore.innerText = topScore + 's';
}

function updateTopScores() {
    updateTopScore('.beginner', localStorage.bestScoreBegginer)
    updateTopScore('.medium', localStorage.bestScoreMedium)
    updateTopScore('.expert', localStorage.bestScoreExpert)
}

function updateTopScore(selector, localTopScore) {
    var elTopScore = document.querySelector(selector);
    elTopScore.innerText = localTopScore ? localTopScore + 's' : 'N/A';
}

function setManualMine(elCell, pos) {
    gBoard[pos.i][pos.j].isMine = true;
    elCell.classList.remove('cell-covered')
    renderCell(pos, MINE);
    var elMarked = document.querySelector('.mark-count span')
    elMarked.innerText = ++gManualMinesCount;
    if (gManualMinesCount === gLevel.MINES) {
        gGame.isMinesManual = false;
        console.log('letsStart')
    }
}

function setMinesManually() {
    gGame.isMinesManual = true;
    restart()
}

function handleHint(elHint) {
    if (!gGame.hints) return
    if (elHint.classList.contains('used')) return;
    elHint.classList.add('used');
    gIsHint = true;
}

function handleSafeKey(elBtn) {
    if (!gGame.numSafeKey) return
    var safeKeyLocation = {
        i: getRandomInt(0, gLevel.SIZE),
        j: getRandomInt(0, gLevel.SIZE)
    };
    while (gBoard[safeKeyLocation.i][safeKeyLocation.j].isMine || gBoard[safeKeyLocation.i][safeKeyLocation.j].isShown) {
        safeKeyLocation.i = getRandomInt(0, gLevel.SIZE)
        safeKeyLocation.j = getRandomInt(0, gLevel.SIZE)
    }
    var elCell = document.querySelector(getClassName(safeKeyLocation));
    elCell.classList.add('marked');
    setTimeout(function () { elCell.classList.remove('marked'); }, 1000)
    var elSafeKeySpan = document.querySelector('.safe-key span')
    elSafeKeySpan.innerText = --gGame.numSafeKey;
    if (!gGame.numSafeKey) elBtn.classList.add('safe-done')
}

function undo() {
    if (!gGame.isOn) return;
    if (gBoards.length < 1) return
    gGame.shownCount = 0;
    gBoard = copyBoard(gBoards.pop());//[gBoards.length - 1]);
    // gBoards.pop();
    gGame.shownCount = gShownCounts.pop();
    gGame.markedCount = gMarkedCounts.pop();
    renderBoard(gBoard)
}

function copyBoard(board) {
    var stepBoard = []
    for (var i = 0; i < gLevel.SIZE; i++) {
        stepBoard[i] = [];
        for (var j = 0; j < gLevel.SIZE; j++) {
            stepBoard[i][j] = JSON.parse(JSON.stringify(board[i][j]))
        }
    }
    return stepBoard;
}