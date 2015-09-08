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
            var move = moving[i];
            var finished = processMove(move, t);
            if (finished) {
                moving.splice(i, 1);
                if (move.obj.key == 'rabbit') {
                    movingInProgress = false;
                }
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
            if (move.next) {
                nextMoving(move);
                return false;
            }
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
    
    this.createMoving = function(what, data) {
        var rec = {obj: what, next: data};
        nextMoving(rec);
        moving.push(rec);
    }
    
    function nextMoving(rec) {
        if (typeof(rec.next) != 'object') {
            return false;
        }
        var data = rec.next;
        var dx = data[0];
        var dy = data[1];
        var dt = data[2];
        var next = (typeof(data[3]) == 'object') ? data[3] : null;
        var ts = game.time.now;
        var what = rec.obj;
        rec.start = ts;
        rec.end = ts + dt;
        rec.x0 = what.x;
        rec.y0 = what.y;
        rec.x1 = mkX(what.logicX + dx);
        rec.y1 = mkY(what.logicY + dy);
        rec.next = next;
        what.logicX += dx;
        what.logicY += dy;
        return true;
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
        var rabbit = getRabbit();
        var top = topOfColumn(rabbit.logicX + dir, rabbit.logicY);
        if (top[0] == rabbit.logicY) {
            return false;
        }
        if (top[0] == rabbit.logicY - 1) {
            next = null;
        } else {
            var delta = rabbit.logicY - 1 - top[0];
            next = [0, -delta, delta * stepTime];
        }
        movingInProgress = true;
        this.createMoving(getRabbit(), [dir, 0, stepTime, next]);
        return true;
    }
    
    function topOfColumn(x, maxY) {
        var gnd = objects['ground'];
        var res = [];
        for (var i in gnd) {
            var g = gnd[i];
            if (g.logicX == x && g.logicY <= maxY) {
                res.push(g.logicY);
            }
        }
        return res.sort(function(a, b) {return b - a});
    }
}

var level = {
    width: 30,
    height: 13,
    ledges: [
        {x: 0, y: 0, len: 30},
        {x: 10, y: 7, len: 10},
        {x: 19, y: 3, len: 3},
        {x: 9, y: 5, len: 1},
        {x: 8, y: 3, len: 1},
        {x: 7, y: 2, len: 2}
    ],
    stars: [
        {x: 18, y: 8},
        {x: 19, y: 4},
        {x: 7, y: 3}
    ],
    rabbit: {x: 11, y: 8},
};


var krolobot = new Krolobot(level);

