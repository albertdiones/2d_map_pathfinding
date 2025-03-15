function findNextCoords(fromCoords, toCoords) {
    const next = [];
    let xDir = null;
    let yDir = null;
    if (fromCoords[0] < toCoords[0]) {
        next[0] = fromCoords[0] + 1;
        xDir = 'east';
    }
    else if (fromCoords[0] > toCoords[0]) {
        next[0] = fromCoords[0] - 1;
        xDir = 'west';
    }
    else {
        next[0] = fromCoords[0];
    }
    if (fromCoords[1] < toCoords[1]) {
        next[1] = fromCoords[1] + 1;
        yDir = 'south';
    }
    else if (fromCoords[1] > toCoords[1]) {
        next[1] = fromCoords[1] - 1;
        yDir = 'north';
    }
    else {
        next[1] = fromCoords[1];
    }

    // adjust x depending on the row of y, because of the hexagon edge offset
    // if even:
    if (yDir) {
        if (next[1] % 2 === 0 && xDir === 'west') {
            next[0]++;
        }
        else if (next[1] % 2 === 1 && xDir === 'east') {
            next[0]--;
        }
    }


    return next;
}

function arrived(current, to) {
    console.log('current, to', current, to, current[0] === to[0] && current[1] === to[1]);
    return current[0] === to[0] && current[1] === to[1];
}

function showPath(fromElement, toElement) {
    const from = getTileCoords(fromElement);
    const to = getTileCoords(toElement);

    let next = [...from];

    let i = 0;
    while (!arrived(next, to)) {
        next = findNextCoords(next, to);
        console.log('next', next);
        const tile = getTile(...next);
        highlightTile(tile);
        i++;
        console.log('i',i);
        if (i > 100) {
            break;
        }
    }
}

function clearAllHighlights() {
    originTile = null;
    destinationTile = null;
    document.querySelectorAll('div.tile.highlight').forEach(
        (tile) => tile.classList.remove('highlight')
    );
}

let originTile;
let destinationTile;
function togglePath(element) {
    if (!originTile || destinationTile) {
        clearAllHighlights();
        highlightTile(element);
        originTile = element;
    }
    else {
        destinationTile = element;
        highlightTile(element);
        showPath(originTile, element);
    }
}

