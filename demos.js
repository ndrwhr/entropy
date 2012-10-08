
var SUPPORTS_ENTROPY = !!Object.defineProperty;

if (!SUPPORTS_ENTROPY){
    document.body.className = 'show-warning';
}

// Decaying header.
(function(){
    if (!SUPPORTS_ENTROPY) return;

    var header = document.querySelector('h1');
    var data = Entropy.watch({
        text: header.innerHTML
    }, 2);

    var updateHeader = function(){
        header.innerHTML = '';
        header.appendChild(document.createTextNode(data.text));

        setTimeout(updateHeader, 2000 * Math.random() + 1000);
    };

    setTimeout(updateHeader, 5000);
})();

// 99 Bottles of beer on the wall.
(function(){
    if (!SUPPORTS_ENTROPY) return;

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
    }, 0.3);

    // Generate all of the verses and store them in an array so we can hook up the results to a
    // slider control.
    var verses = [];
    var verse;
    while ((verse = NinetyNineBottles.step())){
        verses.push(verse);
    }

    var output = document.querySelector('#verse');
    var slider = document.querySelector('#slider');
    var thumb = document.querySelector('#thumb');
    var label = document.querySelector('#label');

    var updateText = function(index){
        output.innerHTML = '';
        output.appendChild(document.createTextNode(verses[index]));
        label.innerHTML = 'Verse ' + (index + 1);
    };

    var mouseMove = function(e){
        e.preventDefault();
        var sliderRect = slider.getBoundingClientRect();
        var clickOffsetX = e.pageX - sliderRect.left;
        var percentage = Math.max(0, Math.min(1, clickOffsetX / sliderRect.width));

        // Clamp between 0 and 100.
        thumb.style.left = (percentage * 100) + '%';

        var index = Math.floor((verses.length - 1) * percentage);
        updateText(index);
    };

    var mouseUp = function(e){
        mouseMove(e);
        document.removeEventListener('mouseup', mouseUp);
        document.removeEventListener('mousemove', mouseMove);
    };

    thumb.addEventListener('mousedown', function(e){
        mouseMove(e);
        document.addEventListener('mouseup', mouseUp);
        document.addEventListener('mousemove', mouseMove);
    });

    // Update the text to the first verse.
    updateText(0);
})();

// Decaying images.
(function(){
    if (!SUPPORTS_ENTROPY) return;

    var PIXEL_SIZE = 2;

    var canvas = document.querySelector('#demo-image');
    var context = canvas.getContext('2d');
    var vertexData, colorData, updateTimer;

    var clamp = function(value, min, max){
        return Math.max(Math.min(value, max), min);
    };

    var getColor = function(row, column){
        var rgb = ['r', 'g', 'b'].map(function(color){
            var value = clamp(colorData[row][column][color], 0, 255);
            colorData[row][column][color] = value;
            return Math.round(value);
        }).join(',');

        return 'rgba(' + rgb + ', 1)';
    };

    var drawImage = function(e){
        var i, j;

        for(j = 0; j < colorData.length; j++){
            for(i = 0; i < colorData[j].length; i++){
                context.beginPath();
                context.fillStyle = getColor(j, i);
                context.moveTo(vertexData[j][i].x, vertexData[j][i].y);
                context.lineTo(vertexData[j][i + 1].x, vertexData[j][i + 1].y);
                context.lineTo(vertexData[j + 1][i + 1].x, vertexData[j + 1][i + 1].y);
                context.lineTo(vertexData[j + 1][i].x, vertexData[j + 1][i].y);
                context.fill();
            }
        }
    };

    var setupImage = function(){
        var img = new Image();

        img.onload = function(){
            var createVertex = function(x, y){
                return Entropy.watch({
                    x: x,
                    y: y
                }, 0.75);
            };

            canvas.setAttribute('width', img.width * PIXEL_SIZE);
            canvas.setAttribute('height', img.height * PIXEL_SIZE);

            var context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);

            var imageData = context.getImageData(0, 0, img.width, img.height);
            var i, j, x, y, vertexRow, colorRow;

            vertexData = [];
            colorData = [];
            for (j = 0, y = 0; j < img.height; j++, y += PIXEL_SIZE){
                vertexRow = [];
                colorRow = [];
                for (i = 0, x = 0; i < img.width; i++, x += PIXEL_SIZE){
                    vertexRow.push(createVertex(x, y));

                    colorRow.push(Entropy.watch({
                        r: imageData.data[(j * img.width * 4) + (i * 4)],
                        g: imageData.data[(j * img.width * 4) + (i * 4) + 1],
                        b: imageData.data[(j * img.width * 4) + (i * 4) + 2]
                    }));
                }

                // Add an additional data point at the right side.
                vertexRow.push(createVertex(x, y));

                vertexData.push(vertexRow);
                colorData.push(colorRow);
            }

            // Add an additional row.
            vertexRow = [];
            for (i = 0, x = 0; i < img.width; i++, x += PIXEL_SIZE){
                vertexRow.push(createVertex(x, y));
            }
            vertexRow.push(createVertex(x, y));
            vertexData.push(vertexRow);

            drawImage();

            clearInterval(updateTimer);
            updateTimer = setInterval(drawImage, 5000);
        };

        img.src = 'assets/demo_image.png';
    };

    setupImage();

    canvas.addEventListener('mousemove', drawImage);

    var resetButton = document.querySelector('#demo-image + span');
    resetButton.addEventListener('click', setupImage);
})();

// Connect the dots.
(function(){
    if (!SUPPORTS_ENTROPY) return;

    var MAX_POINTS = 1500;
    var WIDTH = 750;
    var HEIGHT = 375;
    var DOT_RADIUS = 3;

    var canvas = document.querySelector('#demo-game');
    var context = canvas.getContext('2d');

    canvas.setAttribute('width', WIDTH);
    canvas.setAttribute('height', HEIGHT);

    var originalDotData = '[{"x":260,"y":287},{"x":268,"y":260},{"x":187,"y":196},{"x":206,"y":188},{"x":191,"y":136},{"x":237,"y":143},{"x":252,"y":120},{"x":303,"y":164},{"x":284,"y":66},{"x":319,"y":83},{"x":350,"y":27},{"x":381,"y":81},{"x":416,"y":67},{"x":398,"y":163},{"x":451,"y":117},{"x":461,"y":141},{"x":511,"y":135},{"x":495,"y":186},{"x":515,"y":194},{"x":433,"y":258},{"x":439,"y":288},{"x":356,"y":278},{"x":358,"y":355},{"x":344,"y":355},{"x":344,"y":277},{"x":261,"y":288}]';
    var dots = [];
    var points = [];
    var decayTimer;

    var initializeData = function(){
        dots = JSON.parse(originalDotData).map(function(dot, index){
            return Entropy.watch({
                x: dot.x,
                y: dot.y,
                index: index
            }, 0.2);
        });
    };

    var drawPoints = function(e){
        context.strokeStyle = 'red';
        context.lineWidth = 1;

        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        points.forEach(function(point, index){
            if (index) context.lineTo(point.x, point.y);
        });
        context.stroke();
        context.fillStyle = 'rgba(255, 0, 0, 0.05)';
        context.fill();
    };

    var drawDots = function(){
        context.font = '12px Arial';
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        dots.forEach(function(dot){
            context.beginPath();
            context.moveTo(dot.x, dot.y);
            context.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
            context.fill();

            var index = Math.round(((dot.index) * 100)) / 100;

            context.fillText(index, dot.x, dot.y - 10);
        }, this);
    };

    var draw = function(){
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (points.length) drawPoints();
        drawDots();
    };

    var startDecay = function(){
        if (!decayTimer) decayTimer = setInterval(draw, 50);
    };

    var mouseMove = function(e){
        e.preventDefault();
        e.stopPropagation();

        var canvasRect = canvas.getBoundingClientRect();
        var ratio = canvas.width / canvasRect.width;

        var x = (e.clientX - canvasRect.left) * ratio;
        var y = (e.clientY - canvasRect.top) * ratio;

        if (points.length > MAX_POINTS) points.shift();

        points.push(Entropy.watch({
            x: x,
            y: y
        }, 0.5));

        draw();
    };

    var mouseDown = function(e){
        decayTimer = clearInterval(decayTimer);
        document.addEventListener('mouseup', mouseUp);
        document.addEventListener('mousemove', mouseMove);
    };

    var mouseUp = function(e){
        startDecay();
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