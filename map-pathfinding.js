const NORTH = 'north';
const SOUTH = 'south';
const EAST = 'east';
const WEST = 'west';

const TILE_FAR_EDGE_OFFSET = 0.99999;
const TILE_NEAR_EDGE_OFFSET = 0.00001;
const INSIDE_TILE_COORDINATES_PRECISION = 5;
const INSIDE_TILE_PRECISION_FACTOR_DIVISOR = Math.pow(10,INSIDE_TILE_COORDINATES_PRECISION);

let dotTimeoutTasks = [];

function normalizeCoordinates(coords) {
    const [x,y] = coords;
    return [
        normalizeCoordinate(x),
        normalizeCoordinate(y)
    ];
}

function normalizeCoordinate(coord) {
    const factorDivisor = INSIDE_TILE_PRECISION_FACTOR_DIVISOR;
    return Math.round(coord*factorDivisor)/factorDivisor;
}

function findNextCoords(
    currentCoords, 
    toCoords,
    originCoords,
    options = {isPassable: () => true}
) {


    // when the current coord is already on the same tile of the destination coords
    if (
        Math.floor(currentCoords[0]) === Math.floor(toCoords[0])
        && Math.floor(currentCoords[1]) === Math.floor(toCoords[1])
    ) {
        return toCoords;
    }

    const trigoCoords = findTrigoNextCoords(currentCoords ?? originCoords, currentCoords, toCoords);

    if (!options.isPassable(...trigoCoords)) {
        const passableEdgeCoords = getPassableEdgeCoords(originCoords, currentCoords, toCoords, options);
        if (passableEdgeCoords) {
            return passableEdgeCoords;
        }
        // third algorithm, rotating direction
        console.error( "No coords found");
        return null;
    }
    //console.log('trigoCoords', trigoCoords);
    return [...normalizeCoordinates(trigoCoords),"source: trigoCoords"];
}

/**
 * Finds the most optimal coordinates within the current tile 
 * or the adjacent tile that is accesible by the unit
 * and is passable (? or adjacent to a passable tile ?) 
 *
 * It checks multiple directions 
 * prioritizing the original angle from origin to destination
 * 
 */
function getPassableEdgeCoords(originCoords, currentCoords, toCoords, options) {
    // find passable edge coords

    const angle = getCoordsAngle(originCoords, toCoords);
    const direction = getDirection(angle);
    const directionsToTry = [
        direction,
    ];


    if (direction.includes(NORTH)) {
        directionsToTry.push([NORTH,WEST]);
        directionsToTry.push([NORTH,EAST]);
    }


    if (direction.includes(SOUTH)) {
        directionsToTry.push([SOUTH,WEST]);
        directionsToTry.push([SOUTH,EAST]);
    }


    if (direction.includes(EAST)) {
        directionsToTry.push([EAST, NORTH]);
        directionsToTry.push([EAST, SOUTH]);
    }

    if (direction.includes(WEST)) {
        directionsToTry.push([WEST, NORTH]);
        directionsToTry.push([WEST, SOUTH]);
    }

    for (const x in directionsToTry) {
        const dir = directionsToTry[x];
        const coords = getPassableEdgeOnDirection(
            currentCoords,
            dir, 
            {isPassable: options.isPassable}
        );
        if (coords) {
            return [
                ...normalizeCoordinates(coords),
                `source: passable edge coords (${dir}) 
                currentCoords ${currentCoords[0]},${currentCoords[1]}`
            ];
        }
    }
}

/**
 * gets the coordinates within the tile of currentCoords, 
 * based on the ${direction} provided
 * 
 * @param float[] [x,y] currentCoords 
 * @param string[] [NORTH|EAST|SOUTH|WEST, NORTH|EAST|SOUTH|WEST] direction 
 *
 * @returns float[] [x,y]
 */
function getDirectionEdgeOnCurrentTile(currentCoords, direction) {

    const passableEdgeCoords = [...currentCoords];

    if (direction.includes(NORTH)) {
        passableEdgeCoords[1] = Math.floor(currentCoords[1])  + 0.00001;
    }
    
    if (direction.includes(SOUTH)) {
        passableEdgeCoords[1] = Math.floor(currentCoords[1])  + 0.99999;
    }                
    
    if (direction.includes(EAST)) {
        passableEdgeCoords[0] = Math.floor(currentCoords[0])  + 0.99999;
    }
    
    if (direction.includes(WEST)) {
        passableEdgeCoords[0] = Math.floor(currentCoords[0])  + 0.00001;
    }

    return passableEdgeCoords;

}

/**
 * 
 * Finds the ${direction} edge coordinates
 * within the adjacent tile to the ${direction}
 * from the ${currentCoords}
 * 
 * Yung pinakasagad na coordinates sa direction na nasa argument,
 * sa tile na nasa direction na nasa argument
 * 
 * @param float[] [x,y] currentCoords 
 * @param string[] [NORTH|EAST|SOUTH|WEST, NORTH|EAST|SOUTH|WEST] direction 
 * 
 * @returns float[] [x,y]
 */
function getDirectionEdgeOnAdjacentTile(currentCoords, direction) {
    
    const currentTileEdge = getDirectionEdgeOnCurrentTile(currentCoords, direction);

    
    if (direction[0] === NORTH) {
        currentTileEdge[1] = Math.floor(currentTileEdge[1]) - 1
    }
    
    if (direction[0] === SOUTH ) {
        currentTileEdge[1] = Math.ceil(currentTileEdge[1]) + 0.99999
    }                
    
    if (direction[0] === EAST ) {
        currentTileEdge[0] = Math.ceil(currentTileEdge[0]) + 0.99999
    }
    
    if (direction[0] === WEST) {
        currentTileEdge[0] = Math.floor(currentTileEdge[0]) - 1
    }

    if (direction[1] === NORTH) {
        currentTileEdge[1] = Math.floor(currentTileEdge[1]) - 1
    }
    
    if (direction[1] === SOUTH ) {
        currentTileEdge[1] = Math.ceil(currentTileEdge[1]) + 0.99999
    }                
    
    if (direction[1] === EAST ) {
        currentTileEdge[0] = Math.ceil(currentTileEdge[0]) + 0.99999
    }
    
    if (direction[1] === WEST) {
        currentTileEdge[0] = Math.floor(currentTileEdge[0]) - 1
    }

    return currentTileEdge;
}

function isCoordsEqual(coords1, coords2) {
    const normalizedCoords1 = normalizeCoordinates(coords1);
    const normalizedCoords2 = normalizeCoordinates(coords2);
    return normalizedCoords1[0] === normalizedCoords2[0]
        && normalizedCoords1[1] === normalizedCoords2[1];
}

function isCoordsOnEdgeOfDirection(coords, direction) {
    if (direction.includes(NORTH)) {
        if (normalizeCoordinate(coords[1] % 1) > TILE_NEAR_EDGE_OFFSET) {
            return false;
        }
    }
    if (direction.includes(SOUTH)) {
        if (normalizeCoordinate(coords[1] % 1) < TILE_FAR_EDGE_OFFSET) {
            return false;
        }
    }
    if (direction.includes(EAST)) {
        if (normalizeCoordinate(coords[0] % 1) < TILE_FAR_EDGE_OFFSET) {
            return false;
        }
    }
    if (direction.includes(WEST)) {
        if (normalizeCoordinate(coords[0] % 1) > TILE_NEAR_EDGE_OFFSET) {
            return false;
        }
    }
    return true;
}

function getPassableEdgeOnDirection(currentCoords, direction, options) {

    if (!isCoordsOnEdgeOfDirection(currentCoords, direction)) {
        // within the tile
        const nextCoords = getDirectionEdgeOnCurrentTile(
            currentCoords,
            direction
        );
        /*
        it should also check the other direction component
        so for example, south east, it should check:
        south east tile, south tile and east tile, to confirm that
        the direction is a dead end
        */
        const nextNextCoords1 = getDirectionEdgeOnAdjacentTile(nextCoords, direction);
        const nextNextCoords2 = getDirectionEdgeOnAdjacentTile(nextCoords, [direction[0],null]);
        const nextNextCoords3 = getDirectionEdgeOnAdjacentTile(nextCoords, [direction[1],null]);
        if ( options.isPassable(...nextNextCoords1)
            || options.isPassable(...nextNextCoords2)
            || options.isPassable(...nextNextCoords3)
        ) {
            return nextCoords;
        }
        return null;
    }
    const directionsToTry = [
        direction,
        [direction[0], null],
    ];
    if (direction[1] !== null) {
        directionsToTry.push(
            [direction[1], null]
        );
    }

    for (let direction of directionsToTry) {
        const coords = getDirectionEdgeOnAdjacentTile(currentCoords, direction);
        console.log('coords', coords, direction);
        if (options.isPassable(...coords)) {
            return coords;
        }
    }
    return null;
}

/**
 * 
 * @param float[] [x,y] originCoords 
 * @param float[] [x,y] destinationCoords 
 * @param float[][] coordsCandidates 
 * @returns 
 */
function getShortestPathToDestination(originCoords, destinationCoords, coordsCandidates) {
    return coordsCandidates.reduce(
        (tile1, tile2, index) => {
            const tile1DistanceToDestination = getDistance(
                ...[
                    ...tile1,
                    destinationCoords[0],
                    destinationCoords[1]
                ]
            );
            const tile2DistanceToDestination = getDistance(
                ...[
                    ...tile2, 
                    destinationCoords[0],
                    destinationCoords[1]
                ]
            );
            const currentToTile1 = getDistance(
                ...[
                    ...tile1,
                    originCoords[0],
                    originCoords[1]
                ]
            );

            const currentToTile2 = getDistance(
                ...[
                    ...tile2, 
                    originCoords[0],
                    originCoords[1]
                ]
            );

            const tile1Total = currentToTile1 + tile1DistanceToDestination;

            const tile2Total = currentToTile2 + tile2DistanceToDestination;


            if (tile1Total < tile2Total) {
                return tile1;
            }

            return tile2;
        },
    );
}


function getAdjacentTiles(x, y) {
    const adjacentTiles = [];
    for (let xOffset = -1; xOffset <= 1; xOffset++) {
        for (let yOffset = -1; yOffset <= 1; yOffset++) {
            const adjacentTile = [
                x + xOffset,
                y + yOffset
            ];
            adjacentTiles.push(
                adjacentTile
            );
        }
    }
    return adjacentTiles;
}

function getDistance(x1,y1,x2,y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function findTrigoNextCoords(origin, current, destination) {
    const angle = getCoordsAngle(origin, destination);

    const direction = getDirection(angle);

    if (direction[1] === null) {
        return normalizeCoordinates(findImmediateNextCoords(current, destination));
    }

    let exit1 = [null, null];
    let exit2 = [null, null];
    // east
    if ( direction.includes(EAST) ) {
        exit1[0] = Math.floor(current[0]+1);
    }
    // west
    else if (direction.includes(WEST)) {
        exit1[0] = Math.floor(current[0])-0.1;
    }


    // north
    if (direction.includes(NORTH)) {
        exit2[1] = Math.floor(current[1])-0.1;
    }
    // south
    else if (direction.includes(SOUTH)) {
        exit2[1] = Math.floor(current[1]+1);
    }



    const theta = deg2Rad(angle % 90);
    if (isDirectionSimilar(direction, [SOUTH, EAST]) || isDirectionSimilar(direction, [NORTH,WEST])) {
        const adjacent1 = exit1[0] - origin[0];
        const opposite2 = exit2[1] - origin[1];
        const opposite1 = Math.tan(theta)*adjacent1;
        const adjacent2 = opposite2/Math.tan(theta);
        
        exit1[1] = origin[1] + opposite1;
        exit2[0] = origin[0] + adjacent2;
    }
    // should this be else if() ?
    else {
        const opposite1 = exit1[0] - origin[0];
        const adjacent2 = exit2[1] - origin[1];
        const adjacent1 = opposite1/Math.tan(theta);
        const opposite2 = Math.tan(theta)*adjacent2;
        exit1[1] = origin[1] - adjacent1;
        exit2[0] = origin[0] - opposite2;
    }

    const exit1Distance = distance(origin, exit1);
    const exit2Distance = distance(origin, exit2);


    return normalizeCoordinates(exit1Distance < exit2Distance ? exit1 : exit2);

}

/**
 * 
 * @param float[] [x,y] originCoords 
 * @param float[] [x,y] destinationCoords 
 * @param Function ([x,y]) => boolean isPassable 
 * @returns 
 */
function getPath(originCoords, destinationCoords, isPassable) {
    const path = [originCoords];
    let current = [...originCoords];

    let i = 0;
    while (!arrived(current, destinationCoords)) {
        const next = findNextCoords(
            current,
            destinationCoords,
            originCoords,
            {isPassable: isPassable}
        );

        if (!next) {
            console.error("Failed to get next coords");
            break;
        }

        const [x,y,comment] = next;

        if (isCoordsEqual([x,y], current)) {
            console.error("Unit did not move from current coordinate", current);
            break;
        }
        current = [x,y];
        path.push([x,y,comment]);

        i++;
        if (i > 50) {
            break;
        }
    }
    return path;
}

// trigoCoords on the direction of the destination
// within the current tile (not going outside)
// so it's useful for getting the "collision coords"
// "kung saan siya nauntog"
function findTrigoNextCoords2(origin, current, destination) {
    const angle = getCoordsAngle(origin, destination);

    const direction = getDirection(angle);

    if (direction[1] === null) {
        return findImmediateNextCoords(current, destination);
    }

    let exit1 = [null, null];
    let exit2 = [null, null];
    // east
    if ( direction.includes(EAST) ) {
        exit1[0] = Math.floor(current[0])+0.99999;
    }
    // west
    else if (direction.includes(WEST)) {
        exit1[0] = Math.floor(current[0])-0;
    }


    // north
    if (direction.includes(NORTH)) {
        exit2[1] = Math.floor(current[1])-0;
    }
    // south
    else if (direction.includes(SOUTH)) {
        exit2[1] = Math.floor(current[1])+0.99999;
    }


    const theta = deg2Rad(angle % 90);
    if (isDirectionSimilar(direction, [SOUTH, EAST]) || isDirectionSimilar(direction, [NORTH,WEST])) {
        const adjacent1 = exit1[0] - origin[0];
        const opposite2 = exit2[1] - origin[1];
        const opposite1 = Math.tan(theta)*adjacent1;
        const adjacent2 = opposite2/Math.tan(theta);
        
        exit1[1] = origin[1] + opposite1;
        exit2[0] = origin[0] + adjacent2;
    }
    // should this be else if() ?
    else {
        const opposite1 = exit1[0] - origin[0];
        const adjacent2 = exit2[1] - origin[1];
        const adjacent1 = opposite1/Math.tan(theta);
        const opposite2 = Math.tan(theta)*adjacent2;
        exit1[1] = origin[1] - adjacent1;
        exit2[0] = origin[0] - opposite2;
    }

    const exit1Distance = distance(origin, exit1);
    const exit2Distance = distance(origin, exit2);


    return exit1Distance < exit2Distance ? exit1 : exit2;

}

function isDirectionSimilar(direction1, direction2) {
    return direction1.includes(direction2[0])
     && direction1.includes(direction2[1]);
}

// cross pattern only (up down left right)
function isAdjacentXy(coords1, coords2) {
    const [x1, y1] = coords1.map(i => Math.floor(i));
    const [x2, y2] = coords2.map(i => Math.floor(i));

    const xLeg = Math.abs(x2-x1);
    const yLeg = Math.abs(y2-y1);

    if (xLeg > 1) {
        return false;
    }
    if (yLeg > 1) {
        return false;
    }
    return (xLeg + yLeg) == 1;
}


// including the adjacent diagonal
function isAdjacent(coords1, coords2) {
    if (isAdjacentXy(coords1, coords2)) {
        return true;
    }

    // you will know if it's a perfect diagonal 
    // if these remainders are exact equal
    const rX1 = coords1[0] % 1;
    const rY1 = coords1[1] % 1;

    const coords1Tile = coords1.map( i => Math.floor(i));
    const coords2Tile = coords2.map( i => Math.floor(i));



    if (rX1 === 0.5 && rY1 === 0.5) {
        return isSouthEastAdjacent(coords1Tile, coords2Tile) 
            || isNorthWestAdjacent(coords1Tile, coords2Tile)
            || isSouthWestAdjacent(coords1Tile, coords2Tile)
            || isNorthEastAdjacent(coords1Tile, coords2Tile);
    }

    if (rX1 === rY1) {
        return isSouthEastAdjacent(coords1Tile, coords2Tile) 
            || isNorthWestAdjacent(coords1Tile, coords2Tile)
    }
    if ((1-rX1) === rY1) {
        return isSouthWestAdjacent(coords1Tile, coords2Tile)
        || isNorthEastAdjacent(coords1Tile, coords2Tile);
    }
    return false;
}

function isSouthEastAdjacent(coords1, coords2) {
    return coords2.every( (i,k) => i === coords1[k] + 1 )
}

function isNorthWestAdjacent(coords1, coords2) {
    return coords2.every( (i,k) => i === coords1[k] - 1 );
}

function isNorthEastAdjacent(coords1, coords2) {
    return coords2[0] === Math.floor(coords1[0]) + 1
        && coords2[1] === Math.floor(coords1[1]) - 1;
}

function isSouthWestAdjacent(coords1, coords2) {
    return (
        coords2[0] === coords1[0] - 1
        && coords2[1] === coords1[1] + 1
    );
}


function distance(coords2, coords1) {
    const [x1, y1] = coords1;
    const [x2, y2] = coords2;

    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}


function findImmediateNextCoords(fromCoords, toCoords) {
    const leg = getLegs(fromCoords, toCoords);

    const angle = getCoordsAngle(fromCoords, toCoords);

    const direction = getDirection(angle);

    // east
    if ( direction[0] === EAST ) {
        return [fromCoords[0]+1, fromCoords[1]];
    }
    // west
    else if (direction[0] === WEST) {
        return [fromCoords[0]-1, fromCoords[1]];
    }
    // north
    else if (direction[0] === NORTH) {
        return [fromCoords[0], fromCoords[1]-1];
    }
    // south
    else if (direction[0] === SOUTH) {
        return [fromCoords[0], fromCoords[1]+1];
    }
}
function getDirection(angle) {

    if (angle === 0) {
        return [EAST, null];
    }

    if (angle === 90) {
        return [SOUTH,null];
    }

    if (angle === 180) {
        return [WEST, null];
    }

    if (angle === 270) {
        return [NORTH, null];
    }

    // north-east
    if (angle > 270) {
        if ( angle <= 315) {
            return [NORTH, EAST];
        }
        return [EAST,NORTH];
    }

    // north-west
    if (angle > 180) {
        if ( angle >= 225) {
            return [NORTH, WEST];
        }
        return [WEST,NORTH];
    }

    // south-west
    if (angle > 90) {
        if ( angle <= 135) {
            return [SOUTH, WEST];
        }
        return [WEST, SOUTH];
    }
    
    // south-east
    if ( angle > 45) {
        return [SOUTH, EAST];
    }
    return [EAST, SOUTH];
}

function arrived(current, to) {
    return current[0] === to[0] && current[1] === to[1];
}

function deg2Rad(angleDegrees) {
    return angleDegrees*(Math.PI/180);
}


function addTileToPath(tile) {
    highlightTile(tile);
    document.querySelector('.path-count').innerHTML = document.querySelectorAll('div.tile.highlight').length;
}

function getLegs(fromCoords, toCoords) {

    const direction = getDirectionQuadrant(fromCoords, toCoords);

    const xLeg = toCoords[0]-fromCoords[0];
    const yLeg = toCoords[1]-fromCoords[1];

    if (direction === 1 || direction === 3) {
        return [xLeg, yLeg];
    }

    return [yLeg, xLeg];
}


function getDirectionQuadrant(fromCoords, toCoords) {
    const [x1, y1] = fromCoords;
    const [x2, y2] = toCoords;

    if (x2 > x1 && y2 >= y1) return 1; 
    if (x2 < x1 && y2 <= y1) return 3;
    if (x2 >= x1 && y2 < y1) return 4;
    if (x2 <= x1 && y2 > y1) return 2;

    throw `Failed to get directon ${fromCoords} to ${toCoords}`
}


function getAngle(fromElement, toElement) {
    const from = getTileCoords(fromElement);
    const to = getTileCoords(toElement);
    
    return getCoordsAngle(from, to);
}


function getCoordsAngle(from, to) {
    const legs = getLegs(from, to);
    const direction = getDirectionQuadrant(from,to);

    let angle = (Math.atan(Math.abs(legs[1])/Math.abs(legs[0]))/Math.PI)*180;

    

    if (direction === 2) {
        return angle+90;
    }    
    if (direction === 3) {
        return angle+180;
    }
    if (direction === 4) {
        return angle+270;
    }
    return angle;
}

function centerCoords([x, y]) {
    return [_centerCoord(x), _centerCoord(y)];
}

function _centerCoord(i) {
    if (i % 1 === 0) {
        i += 0.5;
    }
    return i;
}


function removeAllTileDots() {
    document.querySelectorAll('.tile-dot').forEach(
        (dot) => dot.parentNode.removeChild(dot)
    );
}

let originTile;
let destinationTile;
function togglePath(element, isPassable) {
    if (!originTile || destinationTile) {
        clearAllHighlights();
        removeAllTileDots();
        highlightTile(element);
        originTile = element;
    }
    else {
        destinationTile = element;
        highlightTile(element);
        showPath(originTile, element, isPassable);
    }
}

