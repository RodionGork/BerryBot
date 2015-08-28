function Krolobot(level) {
    
    var sz = 20;
    var width = 30;
    var height = 13;
    
    var game = new Phaser.Game(width * sz, height * sz, Phaser.AUTO, '',
        { preload: preload, create: create, update: update });
    var ledges;
    var stars;
    var rabbit;

    function preload() {
        game.load.image('star', 'assets/berry.png');
        game.load.image('ground', 'assets/ground.png');
        game.load.image('rabbit', 'assets/bot.png');
    }

    function create() {
        ledges = game.add.group();
        stars = game.add.group();
        placeLedges(ledges, level.ledges);
        placeStars(stars, level.stars);
        rabbit = placeRabbit(level.rabbit);
    }

    function update() {
    }
    
    function placeLedges(group, data) {
        for (var i = 0; i < data.length; i++) {
            var ledge = data[i];
            for (var j = 0; j < ledge.len; j++) {
                var img = group.create(mkX(ledge.x + j), mkY(ledge.y), 'ground');
                scale(img, sz, sz);
            }
        }
    }
    
    function placeStars(group, data) {
        for (var i = 0; i < data.length; i++) {
            var star = data[i];
            var img = group.create(mkX(star.x), mkY(star.y), 'star');
            scale(img, sz, sz);
        }
    }
    
    function placeRabbit(data) {
        var img = game.add.image(mkX(data.x), mkY(data.y), 'rabbit');
        scale(img, sz, sz);
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


Krolobot(level);
