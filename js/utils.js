function printMat(mat, selector) {
  var strHTML = '<table border="0"><tbody>';
  for (var i = 0; i < mat.length; i++) {
    strHTML += '<tr>';
    for (var j = 0; j < mat[0].length; j++) {
      var cell = mat[i][j];
      var className = gBoard[i][j].isShown? 'cell cell-' + i + '-' + j :'cell cell-covered cell-' + i + '-' + j;
      strHTML += `<td class=" ${className}" oncontextmenu="cellMarked(this)" onclick = "cellClicked(this, ${i}, ${j})"> ${cell} </td>`
    }
    strHTML += '</tr>'
  }
  strHTML += '</tbody></table>';
  var elContainer = document.querySelector(selector);
  elContainer.innerHTML = strHTML;
}

// location such as: {i: 2, j: 7}
function renderCell(location, value) {
  // Select the elCell and set the value
  var elCell = document.querySelector(`.cell-${location.i}-${location.j}`);
  elCell.innerHTML = value;
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Find empty locations

function findEmptyLocations(board) {
  var emptyLocations = [];
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      if (board[i][j] === '') {
        emptyLocations.push({ i: i, j: j })
      }
    }
  }
  return emptyLocations;
}

function shuffle(items) {
  var randIdx, keep, i;
  for (i = items.length - 1; i > 0; i--) {
      randIdx = getRandomInt(0, items.length - 1);

      keep = items[i];
      items[i] = items[randIdx];
      items[randIdx] = keep;
  }
  return items;
}


function createNums(maxVal) {
  nums = []
  for (var i = 0; i < maxVal; i++) {
      nums[i] = i + 1;
  }
  return nums;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

// -- Formatting
function getFormattedDate(ts) {     // gets YYYY-MM-DD
  if (!ts) ts = Date.now();

  var date = new Date(ts);
  // console.log(date)
  var dateStr = date.getFullYear() + '-'
      + (date.getMonth() + 1) + '-' + date.getDate();
  // console.log(str)
  return dateStr
}
function getFormattedTime(ts) {     // gets HH:MM

  if (!ts) ts = Date.now();

  var date = new Date(ts);
  var timeStr = date.getHours() + ':' +
      date.getMinutes();
  return timeStr;
}

function getCellCoord(strCellId) {
  var parts = strCellId.split('-')
  var coord = { i: +parts[1], j: +parts[2] };
  return coord;
}