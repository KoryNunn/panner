var doc = require('doc-js'),
    EventEmitter = require('events').EventEmitter,
    interact = require('interact-js'),
    crel = require('crel'),
    vectorToComponents = require('math-js/vectors/toComponents'),
    Settler = require('settler');

function Panner(element){
    var panner = this;

    this._interactions = [];
    this._position = {x:0,y:0};

    this._render(element);

    setTimeout(function(){
        doc.ready(function(){
            panner._bind();
        });
    });
}
Panner.prototype = Object.create(EventEmitter.prototype);
Panner.prototype.constructor = Panner;
Panner.prototype.maxY = 1000;
Panner.prototype.minY = 0;
Panner.prototype.maxX = 1000;
Panner.prototype.minX = 0;
Panner.prototype._pixelRatio = 1;
Panner.prototype.minRatio = 1;
Panner.prototype.maxRatio = 1000;
Panner.prototype._bind = function(){
    var panner = this;

    // Bind interaction start to element
    interact.on('start', panner.element, this._start.bind(this));

    // Still use document for the other events for robustness.
    interact.on('drag', document, this._drag.bind(this));
    interact.on('end', document, this._end.bind(this));
    interact.on('cancel', document, this._end.bind(this));
}
Panner.prototype._start = function(interaction){
    this._interactions.push(interaction);
};
Panner.prototype._drag = function(interaction){
    if(this._interactions.indexOf(interaction) < 0){
        return;
    }

    if(!this._dragStarted){
        this._dragStarted = true;
        this.emit('dragStart');
    }

    interaction.preventDefault();

    var moveDelta = interaction.getMoveDelta();

    this.movePoint({
        x: interaction.pageX,
        y: interaction.pageY,
        deltaX: moveDelta.x,
        deltaY: moveDelta.y
    });
};
Panner.prototype._end = function(interaction){
    var interactionIndex = this._interactions.indexOf(interaction);

    if(interactionIndex < 0){
        return;
    }

    this._interactions.splice(interactionIndex, 1);

    this._dragStarted = false;
    this.emit('dragEnd');
};
Panner.prototype._render = function(element){
    this.element = element || crel('div');

    this.element.panner = this;
};
Panner.prototype.movePoint = function(moveInfo){
    var currentPosition = this.position();
    this.position({
        y: currentPosition.y - moveInfo.deltaY,
        x: currentPosition.x - moveInfo.deltaX
    });
};
Panner.prototype.position = function(coordinates){
    if(!arguments.length){
        return {
            x: this._position.x,
            y: this._position.y
        };
    }

    if(
        this._position.x === coordinates.x &&
        this._position.y ===coordinates.y
    ){
        return;
    }

    this._position.y = Math.min(
        Math.max(this.minY, coordinates.y),
        this.maxY
    );
    this._position.x = Math.min(
        Math.max(this.minX, coordinates.x),
        this.maxX
    );
    this.emit('pan');
    this.emit('change');
};
Panner.prototype.pan = function(coordinates){
    if(!arguments.length){
        return {
            x: this._position.x * this._pixelRatio,
            y: this._position.y * this._pixelRatio
        };
    }

    this.position({
        x: Math.floor(coordinates.x / this._pixelRatio),
        y: Math.floor(coordinates.y / this._pixelRatio)
    });
    this.emit('pan');
    this.emit('change');
};
Panner.prototype.pixelRatio = function(ratio){
    if(!arguments.length){
        return this._pixelRatio;
    }

    this._pixelRatio = Math.min(
        Math.max(this.minRatio, ratio),
        this.maxRatio
    );
    this.emit('zoom');
    this.emit('change');
};

module.exports = Panner;