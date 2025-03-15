function highlightTile(element) {
    if (element.classList.contains('highlight')) {
        throw `Already highlghted ${element.getAttribute('data-x')}, ${element.getAttribute('data-y')}`;
    }
    element.classList.add('highlight');
}

function getTile(x, y) {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    const tile = document.querySelector(`div.tile[data-x="${tileX}"][data-y="${tileY}"]`);

    if (!tile) {
        throw new Error(`Can't find tile: ${tileX}, ${tileY}`);
    }
    return tile;
}

function getTileCoords(element) {
    return [parseInt(element.getAttribute('data-x')), parseInt(element.getAttribute('data-y'))];
}

function renderMap(map, {renderExtraAttributes}) {

    document.getElementById('map').innerHTML = map.map(
        (row,y) => `<div class='row'>
            ${row.slice(0,mapWidth).map((tile, x) => 
                `<div 
                    class="tile" 
                    data-type="${tile.type}"
                    data-x="${x}"
                    data-y="${y}"
                    title="${x},${y}"
                    data-passable="${tile.passable ? true : tile.type === 'water' ? false : true}"
                    ${renderExtraAttributes(tile, x, y)}>${x},${y}</div>`
                ).join('')}
        </div>`
    ).join('');
}