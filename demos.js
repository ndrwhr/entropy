
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

    var header = new Header();

    Entropy.entropify(header);

    setInterval(function(){
        header.update();
    }, 1500);
})();

// 99 Bottles of beer on the wall.
(function(){
    var NinetyNineBottles = Entropy.entropify({
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

        updateText(Math.floor((outputs.length - 1) * (percentage / 100)));
    };

    var mouseDown = function(e){
        updateSider(e);
        document.addEventListener('mouseup', mouseUp);
        document.addEventListener('mousemove', mouseMove);
    };

    var mouseMove = function(e){
        updateSider(e);
    };

    var mouseUp = function(e){
        updateSider(e);
        document.removeEventListener('mouseup', mouseUp);
        document.removeEventListener('mousemove', mouseMove);
    };

    updateText(0);

    thumb.addEventListener('mousedown', mouseDown);
})();
