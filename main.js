function Krolobot(level) {
    
    var sz = 20;
    var width = 30;
    var height = 13;
    var stepTime = 1000;
    
    var game = new Phaser.Game(width * sz, height * sz, Phaser.AUTO, '',
        { preload: preload, create: create, update: update });
    var objects;
    var objGroup;
    var moving = [];
    var movingInProgress = false;
    var dir = 1;
    var setupRequest = true;

    function preload() {
        game.load.image('star', 'assets/berry.png');
        game.load.image('ground', 'assets/ground.png');
        game.load.spritesheet('rabbit', 'assets/bot.png', 40, 40);
    }

    function create() {
        objGroup = game.add.group();
        objects = {};
    }

    function update() {
        if (setupRequest) {
            setupElements();
            setupRequest = false;
        }
        var t = game.time.now;
        for (var i = moving.length - 1; i >= 0; i--) {
            var finished = processMove(moving[i], t);
            if (finished) {
                if (moving[i].obj.key == 'rabbit') {
                    movingInProgress = false;
                }
                var obj = moving.splice(i, 1);
            }
        }
    }
    
    function setupElements() {
        placeLedges(level.ledges);
        placeStars(level.stars);
        placeRabbit(level.rabbit);
    }
    
    function addObject(x, y, kind) {
        var img = objGroup.create(mkX(x), mkY(y), kind);
        scale(img, sz, sz);
        img.logicX = x;
        img.logicY = y;
        if (typeof(objects[kind]) == 'undefined') {
            objects[kind] = [];
        }
        objects[kind].push(img);
    }

    function placeLedges(data) {
        for (var i = 0; i < data.length; i++) {
            var ledge = data[i];
            for (var j = 0; j < ledge.len; j++) {
                addObject(ledge.x + j, ledge.y, 'ground');
            }
        }
    }
    
    function placeStars(data) {
        for (var i = 0; i < data.length; i++) {
            var star = data[i];
            addObject(star.x, star.y, 'star');
        }
    }
    
    function placeRabbit(data) {
        addObject(data.x, data.y, 'rabbit');
    }
    
    function processMove(move, t) {
        if (move.end <= t) {
            move.obj.x = move.x1;
            move.obj.y = move.y1;
            return true;
        }
        var frac = (t - move.start) / (move.end - move.start);
        move.obj.x = Math.round((move.x1 - move.x0) * frac) + move.x0;
        move.obj.y = Math.round((move.y1 - move.y0) * frac) + move.y0;
        return false;
    }
    
    function mkX(x) {
        return x * sz;
    }
    
    function mkY(y) {
        return (height - y - 1) * sz;
    }
    
    function scale(image, w, h) {
        image.scale.setTo(w / image.width, h / image.height);
    }
    
    this.getObjects = function() {
        return objects;
    }
    
    this.removeAll = function() {
        console.log('removing');
    }
    
    this.addMoving = function(what, dx, dy, dt) {
        var ts = game.time.now;
        moving.push({
            obj: what,
            start: ts,
            end: ts + dt,
            x0: what.x,
            y0: what.y,
            x1: mkX(what.logicX + dx),
            y1: mkY(what.logicY + dy),
            logicX: what
        });
        what.logicX += dx;
        what.logicY += dy;
    }
    
    function getRabbit() {
        return objects['rabbit'][0];
    }
    
    this.turn = function() {
        if (movingInProgress) {
            return false;
        }
        dir = -dir;
        getRabbit().frame = (1 - dir) / 2;
        return true;
    }
    
    this.forward = function() {
        if (movingInProgress) {
            return false;
        }
        movingInProgress = true;
        this.addMoving(getRabbit(), dir, 0, stepTime);
        return true;
    }
}

var level = {
    width: 30,
    height: 13,
    ledges: [
        {x: 0, y: 0, len: 30},
        {x: 15, y: 7, len: 10},
    ],
    stars: [
        {x: 23, y: 8},
    ],
    rabbit: {x: 16, y: 8},
};


var krolobot = new Krolobot(level);

