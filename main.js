function Krolobot(data) {
    
    var sz = 20;
    var width;
    var height;
    var stepTime = 350;
    
    var level = data;
    
    var game = newGame(data.width, data.height);
    var objects;
    var objGroup;
    var moving;
    var movingInProgress;
    var dir;
    var setupRequest = true;
    
    function newGame(w, h) {
        width = w;
        height = h;
        return new Phaser.Game(w * sz, h * sz, Phaser.AUTO, 'gamescreen',
                { preload: preload, update: update });
    }
    
    function preload() {
        game.load.image('star', 'assets/berry.png');
        game.load.image('ground', 'assets/ground.png');
        game.load.spritesheet('rabbit', 'assets/bot.png', 40, 40);
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
        objects['score'].setText('Berries: ' + objects['star'].filter(function(s){return s.alive}).length);
    }

    function reinitState() {
        moving = [];
        movingInProgress = false;
        dir = 1;
        setupRequest = true;
    }

    function setupElements() {
        objGroup = game.add.group();
        objects = [];
        reinitState();
        placeLedges(level.ledges);
        placeStars(level.stars);
        placeRabbit(level.rabbit);
        placeScore();
    }
    
    this.reset = function() {
        for (var key in objects) {
            var obj = objects[key];
            if (obj instanceof Array) {
                for (var i in obj) {
                    obj[i].destroy();
                }
            } else {
                obj.destroy();
            }
        }
        objects = [];
        objGroup.destroy();
        setupRequest = true;
    }
    
    this.loadLevel = function(data) {
        if (data.width != width || data.height != height) {
            game.destroy();
            game = newGame(data.width, data.height);
        }
        level = data;
        this.reset();
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
            var delta = ledge.len > 0 ? [1, 0] : [0, 1];
            for (var j = Math.abs(ledge.len) - 1; j >= 0; j--) {
                addObject(ledge.x + j * delta[0], ledge.y + j * delta[1], 'ground');
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
        getRabbit().initX = data.x;
        getRabbit().initY = data.y;
    }

    function placeScore() {
        objects['score'] = game.add.text(0, 0, '', { font: "15px Arial", fill: "#ff0"});
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
            divisor = 1;
        } else {
            var delta = rabbit.logicY - 1 - top[0];
            next = [dir / 2, -delta, delta * stepTime];
            divisor = 2;
        }
        movingInProgress = true;
        this.createMoving(rabbit, [dir / divisor, 0, stepTime / divisor , next]);
        return true;
    }
    
    this.jump = function() {
        if (movingInProgress) {
            return false;
        }
        var rabbit = getRabbit();
        var goal = null;
        var top1 = topOfColumn(rabbit.logicX + dir, rabbit.logicY + 2);
        var stk1 = topOfColumnAsStack(top1, rabbit.logicY + 2, 3);
        if (stk1[0] == 1 && stk1[1] == 1) {
            return false;
        }
        var top0 = topOfColumn(rabbit.logicX, rabbit.logicY + 2);
        var stk0 = topOfColumnAsStack(top0, rabbit.logicY + 2, 2);
        if (stk1[1] == 1) {
            if (stk0[0] == 1 || stk0[1] == 1) {
                return false;
            }
            goal = [dir, +2, 2 * stepTime, null];
        } else if (stk1[2] == 1) {
            if (stk0[1] == 1) {
                return false;
            }
            goal = [dir, +1, stepTime, null];
        } else {
            var top2 = topOfColumn(rabbit.logicX + dir * 2, rabbit.logicY);
            if (top2[0] == rabbit.logicY) {
                return false;
            }
            var dy = rabbit.logicY - top2[0];
            goal = [dir, +1, stepTime, [dir, -dy, dy * stepTime, null]];
        }
        movingInProgress = true;
        this.createMoving(rabbit, goal);
        return true;
    }
    
    this.eat = function() {
        if (movingInProgress) {
            return false;
        }
        var rabbit = getRabbit();
        var stars = objects['star'];
        for (var i in stars) {
            var star = stars[i];
            if (star.logicX == rabbit.logicX && star.logicY == rabbit.logicY) {
                star.kill();
                return true;
            }
        }
        return false;
    }

    function topOfColumnAsStack(top, topY, len) {
        var res = [];
        for (var i = 0; i < len; i++) {
            res[i] = 0;
        }
        for (var j in top) {
            var d = topY - top[j];
            if (d < len) {
                res[d] = 1;
            }
        }
        return res;
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


