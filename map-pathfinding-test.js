function isCoordsPassable(x,y) {
    const tile = getTile(x, y);
    if (tile.getAttribute('data-passable') === 'true') {
        return true;
    }
    if (tile.getAttribute('data-passable') === 'false') {
        return false;
    }
    if (tile.getAttribute('data-type') === 'water') {
        return false;
    }
    return true;
}

function animateHighlightTile(element, params) {
    const {current, i, comment} = params;
    const tile = element;
    const timeout = i * (
        document.querySelector('input#path-animation-speed').value 
        ? parseInt(document.querySelector('input#path-animation-speed').value)
        : 0
    );

    const [x,y] = current;

    document.querySelector('table tbody').innerHTML
        += `<tr><td>${i+1}</td><td>${x}</td><td>${y}</td><td>${comment}</td></tr>`;

    dotTimeoutTasks.push(
        setTimeout(
            (
            (tileToHighlight, currentToPlaceDot, DotToPlace) => () => {
                placeDot(currentToPlaceDot, DotToPlace);
                element.classList.add('highlight');
            })(tile, current, (i + 1) + ""),
            timeout
        )
    );
}
function highlightTile(element) {
    element.classList.add('highlight');
}
function placeDot(coords, markerText) {
    const tile = getTile(...coords);
    const x = coords[0] % 1;
    const y = coords[1] % 1;
    tile.innerHTML += `<div class="tile-dot" style="top: calc(${y*100}% - 1.5px); left: calc(${x*100}% - 1.5px)" 
    title="${coords[0]},${coords[1]}">${markerText ?? '-'}</div>`;
}

function clearAllHighlights() {
    originTile = null;
    destinationTile = null;
    document.querySelectorAll('div.tile.highlight').forEach(
        (tile) => tile.classList.remove('highlight')
    );
    dotTimeoutTasks.forEach(
        (task) => clearTimeout(task)
    );
    dotTimeoutTasks = [];
    document.querySelector('table#coords-table tbody').innerHTML = '';
}           

function showPath(fromElement, toElement, isPassable) {

    
    const from = centerCoords(getTileCoords(fromElement));
    const to = centerCoords(getTileCoords(toElement));
    
    // array of coordinates to go through to get to the destination
    const path = getPath(from,to,isPassable);

    path.forEach(
        ([x,y,comment], i) => {                        
            const tile = getTile(x,y);
            animateHighlightTile(tile, {current: [x,y], i: i, comment: comment})
            document.querySelector('.path-count').innerHTML = i;
        }
    );
}