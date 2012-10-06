/**
 * Entropy is an esoteric programming language created by rottytooth. This is of course by no means
 * an complete implementation as JavaScript does not make it easy to overwrite strings and numbers
 * on the fly.
 *
 * The original (complete) .net implementation can be found here:
 *
 * https://github.com/rottytooth/Entropy
 *
 * For more information about the language itself you should check out the wiki:
 *
 * http://esolangs.org/wiki/Entropy
 */
var Entropy = {
    /**
     * The rate at which the variables should mutate.
     * @type {Number}
     */
    mutationRate: 0.0078125,

    /**
     * Given a destination and source object merge all the item from source into destination, but
     * also replace strings and numbers with custom getters and setters to facilitate decay.
     *
     * If the second parameter is omitted then the first parameter will just be copied onto itself.
     *
     * @param  {Object} dest    The object into which source should be copied.
     * @param  {Object} source  The object that should be monitored and copied into dest.
     *
     * @return {dest}           The Destination object with all source copied over.
     */
    watch: function(dest, source){
        if (!source) source = dest;
        for (var prop in source){
            var value = source[prop];

            if (this.isString_(value) || this.isNumber_(value)){
                this.defineProperty_(dest, prop, value);
            } else {
                dest[prop] = source[prop];
            }
        }

        return dest;
    },

    /**
     * Mutates the passed in number.
     *
     * @param  {Number} value The value to be mutated.
     *
     * @return {Number}       The mutated value.
     */
    mutate_: function(value){
        var changeAmount =  this.mutationRate / (Math.random() + 0.000001);

        if (Math.round(Math.random())) changeAmount = -changeAmount;

        return (value += changeAmount);
    },


    /**
     * Creates a property on the dest object that has setters and getters to facilitate mutations.
     *
     * @param  {Object} dest            The object that the property should be defined on.
     * @param  {String} prop            The property name that should be defined.
     * @param  {String|Number} value    The initial value of the property.
     */
    defineProperty_: function(dest, prop, value){
        var self = this;
        var originalValue = value;

        var description = {
            set: function(newValue){
                originalValue = newValue;

                if (self.isString_(newValue)){
                    value = self.strToNumbers_(newValue);
                } else {
                    value = newValue;
                }
            },

            get: function(){
                if (self.isString_(originalValue)){
                    value = value.map(function(charCode){
                        return self.mutate_(charCode);
                    }, self);

                    return self.numbersToStr_(value);
                } else if (self.isNumber_(originalValue)){
                    value = self.mutate_(value);
                    return value;
                } else {
                    return value;
                }
            }
        };

        // Call set value once so that the property is initialized properly.
        description.set(value);

        Object.defineProperty(dest, prop, description);
    },

    /**
     * Converts a string to an array of character codes.
     *
     * @param  {String} str The string to be converted.
     *
     * @return {Number[]}   An array of character codes.
     */
    strToNumbers_: function(str){
        var numbers = [];

        for (var i = 0; i < str.length; i++)
            numbers.push(str.charCodeAt(i));

        return numbers;
    },

    /**
     * Coverts an array of character codes back into a string.
     *
     * @param  {Number[]} numbers   An Array of character codes.
     *
     * @return {String}             The String that the character codes represent.
     */
    numbersToStr_: function(numbers){
        return numbers.map(function(charCode){
            return String.fromCharCode(Math.round(Math.abs(charCode)));
        }).join('');
    },

    /**
     * Return whether or not the passed in object is a string.
     *
     * @param  {Anything}  value    Any object.
     *
     * @return {Boolean}            True if the value is a string.
     */
    isString_: function(value){
        return Object.prototype.toString.call(value) === '[object String]';
    },

    /**
     * Returns whether or not the passed in object is a number.
     *
     * @param  {Anything}  value    Any object.
     *
     * @return {Boolean}            True if the value is a number.
     */
    isNumber_: function(value){
        return Object.prototype.toString.call(value) === '[object Number]';
    }
};