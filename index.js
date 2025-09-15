const WIDTH = 40;
const HEIGHT = 24;
const TILE_CLASSES = {
    wall: 'tileW',
    floor: '',
    potion: 'tileHP',
    sword: 'tileSW'
};

let map = [];
let hero = {};
let enemies = [];
let potions = [];
let swords = [];
let gameOver = false;

$(function () {
    resetGame();
    $(document).on('keydown', handleInput);
});

function resetGame() {
    gameOver = false;
    hero = { x: 0, y: 0, health: 100, damage: 10 };
    enemies = [];
    potions = [];
    swords = [];
    initMap();
    generateRoomsAndCorridors();
    placeItems();
    placeHero();
    placeEnemies();
    draw();
}

function initMap() {
    map = Array.from({ length: HEIGHT }, () =>
        Array.from({ length: WIDTH }, () => ({ type: 'wall' }))
    );
}

function generateRoomsAndCorridors() {
    for (let i = 0; i < rand(5, 8); i++) {
        let rw = rand(5, 10), rh = rand(4, 7);
        let rx = rand(1, WIDTH - rw - 1), ry = rand(1, HEIGHT - rh - 1);
        for (let y = ry; y < ry + rh; y++) {
            for (let x = rx; x < rx + rw; x++) {
                if (inBounds(x, y)) map[y][x].type = 'floor';
            }
        }
    }

    for (let i = 0; i < rand(3, 5); i++) {
        let x = rand(2, WIDTH - 3);
        for (let y = 1; y < HEIGHT - 1; y++) map[y][x].type = 'floor';
    }

    for (let i = 0; i < rand(3, 5); i++) {
        let y = rand(2, HEIGHT - 3);
        for (let x = 1; x < WIDTH - 1; x++) map[y][x].type = 'floor';
    }
}

function placeItems() {
    placeRandom('potion', 10, potions);
    placeRandom('sword', 2, swords);
}

function placeHero() {
    let pos = randomEmpty();
    hero.x = pos.x;
    hero.y = pos.y;
}

function placeEnemies() {
    for (let i = 0; i < 10; i++) {
        let pos = randomEmpty();
        enemies.push({ x: pos.x, y: pos.y, health: 30 });
    }
}

function placeRandom(type, count, list) {
    for (let i = 0; i < count; i++) {
        let pos = randomEmpty();
        map[pos.y][pos.x].type = type;
        list.push(pos);
    }
}

function draw() {
    const $field = $('.field').empty();
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            $field.append(createTile(x, y));
        }
    }
}

function createTile(x, y) {
    const cell = map[y][x];
    const tileClass = TILE_CLASSES[cell.type] || '';
    const $tile = $('<div class="tile"></div>').addClass(tileClass);

    if (hero.x === x && hero.y === y) {
        $tile.addClass('tileP');
        $tile.append(`<div class="health" style="width:${hero.health}%"></div>`);
    }

    for (const e of enemies) {
        if (e.x === x && e.y === y) {
            $tile.addClass('tileE');
            $tile.append(`<div class="health" style="width:${e.health}%"></div>`);
        }
    }

    return $tile.css({ left: `${x * 25}px`, top: `${y * 25}px` });
}

function handleInput(e) {
    if (gameOver) return;
    e.preventDefault();

    let dx = 0, dy = 0;
    const key = e.key.toLowerCase();

    if (key === 'w' || key === 'ц') dy = -1;
    else if (key === 's' || key === 'ы') dy = 1;
    else if (key === 'a' || key === 'ф') dx = -1;
    else if (key === 'd' || key === 'в') dx = 1;

    if (dx || dy) {
        moveHero(dx, dy);
        enemyActions();
    } else if (key === ' ') {
        attackEnemies();
        enemyActions();
    }

    if (hero.health <= 0) {
        alert('Герой погиб.');
        resetGame();
        return;
    }

    if (enemies.length === 0 && !gameOver) {
        alert('Победа.');
        resetGame();
        return;
    }

    draw();
}

function moveHero(dx, dy) {
    const nx = hero.x + dx;
    const ny = hero.y + dy;
    if (!inBounds(nx, ny)) return;

    const cell = map[ny][nx];
    if (cell.type === 'wall') return;

    if (cell.type === 'potion') {
        hero.health = Math.min(hero.health + 30, 100);
        cell.type = 'floor';
    } else if (cell.type === 'sword') {
        hero.damage += 10;
        cell.type = 'floor';
    }

    hero.x = nx;
    hero.y = ny;
}

function attackEnemies() {
    enemies = enemies.filter(e => {
        if (Math.abs(e.x - hero.x) + Math.abs(e.y - hero.y) === 1) {
            e.health -= hero.damage;
        }
        return e.health > 0;
    });
}

function enemyActions() {
    for (const e of enemies) {
        if (Math.abs(e.x - hero.x) + Math.abs(e.y - hero.y) === 1) {
            hero.health -= 10;
            continue;
        }

        const dirs = shuffle([{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }]);
        for (const { dx, dy } of dirs) {
            const nx = e.x + dx, ny = e.y + dy;
            if (inBounds(nx, ny) && map[ny][nx].type === 'floor' && !isOccupied(nx, ny)) {
                e.x = nx;
                e.y = ny;
                break;
            }
        }
    }
}

function randomEmpty() {
    let x, y;
    do {
        x = rand(1, WIDTH - 2);
        y = rand(1, HEIGHT - 2);
    } while (map[y][x].type !== 'floor' || isOccupied(x, y));
    return { x, y };
}

function isOccupied(x, y) {
    if (hero.x === x && hero.y === y) return true;
    return enemies.some(e => e.x === x && e.y === y);
}

function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT;
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
