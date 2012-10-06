
// Decaying header.
(function(){
    var Header = function(){
        this.el = document.querySelector('h1');
        this.text = this.el.innerHTML;
    };
    Header.prototype = {
        update: function(){
            this.el.innerHTML = '';
            this.el.appendChild(document.createTextNode(this.text));
        }
    };

    var header = Entropy.watch(new Header());

    setInterval(function(){
        header.update();
    }, 1500);
})();

// 99 Bottles of beer on the wall.
(function(){
    var NinetyNineBottles = Entropy.watch({
        count: 99,

        decrement: 1,

        precision: 4,

        line1: ' bottles of beer on the wall. ',

        line2: ' bottles of beer. Take one down, pass it around, ',

        line3: '[Probably] no more bottles of beer on the wall...',

        output: '',

        step: function(){
            if (this.count > 0){
                this.output = this.getCount_() + this.line1;
                this.output += this.getCount_() + this.line2;
                this.count -= 1;
                this.output += this.getCount_() + this.line1;
            } else {
                this.output = this.line3;
                this.line3 = '';
            }

            return this.output;
        },

        getCount_: function(){
            return this.count.toFixed(Math.max(Math.min(this.precision, 20), 0));
        }
    });

    var div = document.querySelector('#line');

    var outputs = [];
    var output;
    while ((output = NinetyNineBottles.step())){
        outputs.push(output);
    }

    var slider = document.querySelector('#slider');
    var thumb = document.querySelector('#thumb');
    var label = document.querySelector('#label');

    var updateText = function(index){
        div.innerHTML = '';
        div.appendChild(document.createTextNode(outputs[index]));
        label.innerHTML = 'Verse ' + (index + 1);
    };

    var updateSider = function(e){
        e.preventDefault();
        var sliderRect = slider.getBoundingClientRect();
        var clickOffsetX = e.pageX - sliderRect.left;
        var percentage = (clickOffsetX / sliderRect.width) * 100;

        // Clamp between 0 and 100.
        percentage = Math.max(0, Math.min(100, percentage));
        thumb.style.left = percentage + '%';

        var index = Math.floor((outputs.length - 1) * (percentage / 100));
        updateText(index);
    };

    var mouseUp = function(e){
        updateSider(e);
        document.removeEventListener('mouseup', mouseUp);
        document.removeEventListener('mousemove', updateSider);
    };

    thumb.addEventListener('mousedown', function(e){
        updateSider(e);
        document.addEventListener('mouseup', mouseUp);
        document.addEventListener('mousemove', updateSider);
    });

    updateText(0);
})();

// Decaying images.
(function(){

    var PIXEL_SIZE = 10;

    var canvas = document.querySelector('#demo-image');
    var context = canvas.getContext('2d');
    var data, updateTimer;

    var clamp = function(value, min, max){
        return Math.max(Math.min(value, max), min);
    };

    var getColor = function(row, column, color){
        var value = clamp(data[row][column][color], 0, 255);
        data[row][column][color] = value;
        return Math.round(value);
    };

    var updateCanvas = function(e){
        var i, j, row;
        var x, y, color;

        for(j = 0, y = 0; j < data.length; j++, y += PIXEL_SIZE){
            row = data[j];
            for(i = 0, x = 0; i < row.length; i++, x += PIXEL_SIZE){
                color = 'rgba(' + [
                    getColor(j, i, 'r'),
                    getColor(j, i, 'g'),
                    getColor(j, i, 'b'),
                    clamp(data[j][i].a, 0, 1)
                ].join(',') + ')';
                context.fillStyle = color;
                context.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
            }
        }
    };

    var loadImageData = function(){
        var img = new Image();

        img.onload = function(){
            canvas.setAttribute('width', img.width * PIXEL_SIZE);
            canvas.setAttribute('height', img.height * PIXEL_SIZE);

            var context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);

            var imageData = context.getImageData(0, 0, img.width, img.height);
            var i, j, row;

            data = [];
            for (j = 0; j < img.height; j++){
                row = [];
                for (i = 0; i < img.width; i ++){
                    row.push(Entropy.watch({
                        r: imageData.data[(j * img.width * 4) + (i * 4)],
                        g: imageData.data[(j * img.width * 4) + (i * 4) + 1],
                        b: imageData.data[(j * img.width * 4) + (i * 4) + 2],
                        a: 1
                    }));
                }
                data.push(row);
            }

            updateCanvas();

            clearInterval(updateTimer);
            updateTimer = setInterval(updateCanvas, 500);
        };

        img.src = 'assets/demo_image.png';
    };

    loadImageData();

    canvas.addEventListener('mousemove', updateCanvas);

    var resetButton = document.querySelector('#demo-image + span');
    resetButton.addEventListener('click', loadImageData);
})();


(function(){
    var MAX_POINTS = 1500;
    var WIDTH = 750;
    var HEIGHT = 375;

    var DOT_RADIUS = 3;
    var DOT_DAMPENING = 10;
    var DOT_INDEX_DAMPENING = 100;
    var LINE_DAMPENING = 5;

    var canvas = document.querySelector('#demo-game');
    var context = canvas.getContext('2d');

    canvas.setAttribute('width', WIDTH);
    canvas.setAttribute('height', HEIGHT);

    var dotData = '[{"x":260,"y":287},{"x":268,"y":260},{"x":187,"y":196},{"x":206,"y":188},{"x":191,"y":136},{"x":237,"y":143},{"x":252,"y":120},{"x":303,"y":164},{"x":284,"y":66},{"x":319,"y":83},{"x":350,"y":27},{"x":381,"y":81},{"x":416,"y":67},{"x":398,"y":163},{"x":451,"y":117},{"x":461,"y":141},{"x":511,"y":135},{"x":495,"y":186},{"x":515,"y":194},{"x":433,"y":258},{"x":439,"y":288},{"x":356,"y":278},{"x":358,"y":355},{"x":344,"y":355},{"x":344,"y":277},{"x":261,"y":288}]';
    var dots = [];
    var points = [];
    var decayTimer;

    var initializeData = function(){
        dots = JSON.parse(dotData).map(function(dot, index){
            return Entropy.watch({
                x: dot.x * DOT_DAMPENING,
                y: dot.y * DOT_DAMPENING,
                index: index * DOT_INDEX_DAMPENING
            });
        });
    };

    var drawPoints = function(e){
        context.strokeStyle = 'red';
        context.lineWidth = 1;

        context.beginPath();
        context.moveTo(points[0].x / LINE_DAMPENING, points[0].y / LINE_DAMPENING);
        points.forEach(function(point, index){
            if (!index) return;
            context.lineTo(point.x / LINE_DAMPENING, point.y / LINE_DAMPENING);
        });
        context.stroke();
        context.fillStyle = 'rgba(255,0,0,0.05)';
        context.fill();
    };

    var drawDots = function(){
        context.font = '12px Arial';
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        dots.forEach(function(dot){
            context.beginPath();
            context.moveTo(dot.x / DOT_DAMPENING, dot.y / DOT_DAMPENING);
            context.arc(dot.x / DOT_DAMPENING, dot.y / DOT_DAMPENING,
                DOT_RADIUS, 0, Math.PI * 2);
            context.fill();

            var index = Math.round(((dot.index / DOT_INDEX_DAMPENING) * 100)) / 100;

            context.fillText(index, (dot.x / DOT_DAMPENING),
                (dot.y / DOT_DAMPENING) - 10);
        }, this);
    };

    var draw = function(){
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (points.length) drawPoints();
        drawDots();
    };

    var startDecay = function(){
        if (!decayTimer) decayTimer = setInterval(draw, 200);
    };

    var mouseMove = function(e){
        var canvasRect = canvas.getBoundingClientRect();
        var ratio = canvas.width / canvasRect.width;

        var x = (e.clientX - canvasRect.left) * ratio;
        var y = (e.clientY - canvasRect.top) * ratio;

        if (points.length > MAX_POINTS) points.shift();

        points.push(Entropy.watch({
            x: x * LINE_DAMPENING,
            y: y * LINE_DAMPENING
        }));

        draw();
    };

    var mouseDown = function(e){
        startDecay();
        document.addEventListener('mouseup', mouseUp);
        document.addEventListener('mousemove', mouseMove);
    };

    var mouseUp = function(e){
        document.removeEventListener('mouseup', mouseUp);
        document.removeEventListener('mousemove', mouseMove);
    };

    canvas.addEventListener('mousedown', mouseDown);

    var resetButton = document.querySelector('#demo-game + span');
    resetButton.addEventListener('click', function(evt){
        evt.preventDefault();
        evt.stopPropagation();

        decayTimer = clearInterval(decayTimer);

        points = [];

        initializeData();
        draw();
    });

    initializeData();
    draw();
})();