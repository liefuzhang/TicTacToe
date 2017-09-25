$(document).ready(() => {
    setupClickHandlers();
});

var settings = {
    player1Token: 'O',
    computerOrPlayer2Token: 'X',
    currentPage: 1
}

var board = {
    occupied: [],
    isComputerOrPlayer2Playing: false,
    winningSetCount: {
        // -3  ----  plyer wins
        // Infinity   ----  cannot win
        // 3   ----  computer wins
        "1,2,3": 0,
        "1,4,7": 0,
        "2,5,8": 0,
        "3,6,9": 0,
        "4,5,6": 0,
        "7,8,9": 0,
        "1,5,9": 0,
        "3,5,7": 0,
    },
    tokenPlaced: 0,
    winner: 0,
    isPlayer2InGame: false,
    isLocked: false
}

var originalBoard = {};

function saveOriginalBoard() {
    originalBoard = JSON.parse(JSON.stringify(board));
}

function resetBoard(isResetAll) {
    // another time window, after resetBoard(false) called by
    // showResult(), then click resetAll, it may enter resetBoard at the same time
    if (settings.currentPage !== 3) return;
    var winner = board.winner;
    board = JSON.parse(JSON.stringify(originalBoard));
    $(".letter").html('')
        .css('background-color', 'inherit')
        .css('color', 'rgba(220,220,220,.7)');
    if (isResetAll) {
        $('#player1-score,#computer-or-player2-score').text('0');
        showOrHideTurn(1, false, false);
        showOrHideTurn(2, false, false);
        showOrHidePage3Header(false);
        $('#result-msg').hide();
    } else {
        if (winner === 2
            || winner === 0 && settings.player1Token === 'O') {
            triggerComputerOrPlayer2Play();
        }
        initializeTurn(winner);
    }
}

function setupClickHandlers() {
    $('#one-player').click(() => {
        board.isPlayer2InGame = false;
        $('#page2 .title').text('Would you like to be X or O?');
        $('#computer-or-player2-name').text('computer');
        goToPage(1, 2);
    });
    $('#two-player').click(() => {
        board.isPlayer2InGame = true;
        $('#page2 .title').text('Player 1 : Would you like X or O?');
        $('#computer-or-player2-name').text('player 2');
        goToPage(1, 2);
    });
    $('#back').click(() => {
        goToPage(2, 1);
    });
    $('#tokenX').click(() => {
        settings.player1Token = 'X';
        settings.computerOrPlayer2Token = 'O';
        goToPage(2, 3);
    });
    $('#tokenO').click(() => {
        settings.player1Token = 'O';
        settings.computerOrPlayer2Token = 'X';
        goToPage(2, 3, triggerComputerOrPlayer2Play);
    });
    $('.letter').click(function () {
        onTileClicked($(this).attr('id'), false);
    });
    $('#reset-all').click(function () {
        resetBoard(true);
        goToPage(3, 1);
    });
}

function onTileClicked(num) {
    if (board.isLocked) return;
    if (board.occupied[num] !== true) {
        // here is a small time window***
        board.isLocked = true;
        var finished = numberSelected(num);
        if (!finished && board.isComputerOrPlayer2Playing) {
            triggerComputerOrPlayer2Play();
        }
    }
}

function numberSelected(num) {
    board.occupied[num] = true;
    board.tokenPlaced++;
    var finished = updateWinningSet(num);
    updateUI(num);
    if (!finished) {
        if (board.isComputerOrPlayer2Playing) {
            // computer or player 2 played
            showOrHideTurn(2, false, true);
            showOrHideTurn(1, true, true);
        } else {
            // player 1 played
            showOrHideTurn(1, false, true);
            showOrHideTurn(2, true, true);
        }
    } else {
        showOrHideTurn(1, false, true);
        showOrHideTurn(2, false, true);
    }

    if (board.isComputerOrPlayer2Playing == true) {
        board.isComputerOrPlayer2Playing = false;
    } else {
        board.isComputerOrPlayer2Playing = true;
    }

    board.isLocked = false;
    return finished;
}

function updateUI(num) {
    $('#' + num).text(board.isComputerOrPlayer2Playing ? settings.computerOrPlayer2Token : settings.player1Token);
}

function updateWinningSet(num) {
    var finished = false;
    var $resultMsg = $('#result-msg');
    Object.keys(board.winningSetCount).forEach(function (set) {
        if (set.indexOf(num) != -1 && board.winningSetCount[set] !== Infinity) {
            if (board.isComputerOrPlayer2Playing && board.winningSetCount[set] >= 0) {
                board.winningSetCount[set]++;
            } else if (!board.isComputerOrPlayer2Playing && board.winningSetCount[set] <= 0) {
                board.winningSetCount[set]--;
            } else {
                board.winningSetCount[set] = Infinity;
            }
            if (board.winningSetCount[set] == 3) {
                var msg = board.isPlayer2InGame ? '<div>Ah ha, player 2 won!!</div>' : '<div>Uh oh, you lost..!</div>';
                $resultMsg.html(msg);
                markSetDone(set);
                showResult();
                finished = true;
                board.winner = 2;
                $('#computer-or-player2-score').text(Number($('#computer-or-player2-score').text()) + 1);
            } else if (board.winningSetCount[set] == -3) {
                var msg = board.isPlayer2InGame ? '<div>Ah ha, player 1 won!!</div>' : '<div>Wow, you won!!</div>';
                $resultMsg.html(msg);
                markSetDone(set);
                showResult();
                finished = true;
                board.winner = 1;
                $('#player1-score').text(Number($('#player1-score').text()) + 1);
            }
        }
    }, this);

    if (finished === false && board.tokenPlaced === 9) {
        $resultMsg.html('<div>It was a draw..</div>');
        showResult();
        finished = true;
        board.winner = 0;
    }

    return finished;
}

function showResult() {
    $('#result-msg').show().animate({
        opacity: 1
    }, 2000, function () {
        $(this).animate({
            opacity: 0
        }, 2000, function () {
            $(this).hide();
            resetBoard(false);
        });
    });
}

function markSetDone(set) {
    var nums = set.split(',');
    nums.forEach((n) => {
        $('#' + n).css('background-color', 'black');
        $('#' + n).css('color', 'rgba(0,200,200,1)');
    });
}

function defense() {
    var setFound = Object.keys(board.winningSetCount).find((set) => {
        return board.winningSetCount[set] == -2;
    });
    if (setFound) {
        var nums = setFound.split(',');
        var leftNum = nums.find((num) => {
            return board.occupied[num] !== true;
        });
        numberSelected(leftNum, true);
        return true;
    }
}

function triggerComputerOrPlayer2Play() {
    if (settings.currentPage !== 3) return;    
    board.isLocked = true;
    board.isComputerOrPlayer2Playing = true;

    if (board.isPlayer2InGame == false) {
        setTimeout(() => computerPlays(), 1000);
    } else {
        board.isLocked = false;
    }
}

function computerPlays() {
    if (settings.currentPage !== 3) return;    
    var canWin = Object.keys(board.winningSetCount).some((set) => {
        return board.winningSetCount[set] == 2;
    });
    if (!canWin) {
        if (defense())
            return;
    }
    var possibleSets = Object.keys(board.winningSetCount).filter(function (set) {
        return board.winningSetCount[set] >= 0 && board.winningSetCount[set] !== Infinity;
    });
    if (possibleSets.length === 0) {
        var i = 1;
        while (board.occupied[i] === true) i++;
        numberSelected(i, true);
        return;
    }

    var maxCount = -Infinity;
    possibleSets.forEach((set) => {
        if (maxCount < board.winningSetCount[set]) {
            maxCount = board.winningSetCount[set];
        }
    });

    var bestSets = possibleSets.filter((set) => {
        return board.winningSetCount[set] === maxCount;
    });

    var pool = [];
    bestSets.forEach((set) => {
        var arr = set.split(',');
        arr.forEach((n) => {
            var num = Number(n);
            if (board.occupied[n] !== true) {
                pool[num] = pool[num] ? pool[num] + 1 : 1;
            }
        });
    });

    var maxHit = 0;
    var maxHitNum = 0;
    pool.forEach((n, i) => {
        if (n > maxHit) {
            maxHit = n;
            maxHitNum = i;
        }
    });

    var finished = numberSelected(maxHitNum, true);
}

function initializeTurn(winner) {
    if (board.isPlayer2InGame) {
        $('#player1-turn').text('player 1\'s turn');
        $('#computer-or-player2-turn').text('player 2\'s turn');
    } else {
        $('#player1-turn').text('Your turn!');
        $('#computer-or-player2-turn').text('Computer\'s turn');
    }
    if (winner > 0) {
        showOrHideTurn(winner, true, false);
    } else if (settings.player1Token === 'O') {
        showOrHideTurn(2, true, false);
    } else {
        showOrHideTurn(1, true, false);
    }
}

function showOrHideTurn(turnNum, show, isAnimated) {
    if (settings.currentPage !== 3) return;    
    var turn = turnNum == 1 ? $('#player1-turn') : $('#computer-or-player2-turn');
    var top = show ? '-40px' : '0';
    var duration = isAnimated ? 500 : 0;
    turn.animate({
        top: top
    }, duration);
}

function showOrHidePage3Header(show) {
    if (show) {
        $('#player1-sum, #computer-or-player2-sum, #reset-all').show();
    } else {
        $('#player1-sum, #computer-or-player2-sum, #reset-all').hide();
    }
}

function goToPage(from, to, callback) {
    settings.currentPage = to;
    $("#page" + from).fadeOut(600, () => {
        if (to === 3) {
            showOrHidePage3Header(true);
            saveOriginalBoard();
            initializeTurn();
            if (callback) callback();
        }
        $("#page" + to).fadeIn(600);
    });
}