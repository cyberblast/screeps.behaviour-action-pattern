/**
 * A simple diamond pattern iterator which ends after one loop.
 *
 * Test case: [...load("util.diamond.iterator").loop({x:19,y:7},3)].map(i=>
 *               Game.rooms.W29N19.createConstructionSite(i.x,i.y,STRUCTURE_ROAD))
 */
class DiamondIterator {
    // public y;
    // public x;
    // private _radius;
    // private _dir
    // private _step;

    static loop(xy, radius) {
        return {
            [Symbol.iterator]: function() {
                return new DiamondIterator(xy, radius);
            }
        }
    }

    constructor(xy, radius) {
        this._radius = radius;
        this.x = xy.x;
        this.y = xy.y;
        this._dir = TOP_RIGHT;
        this._step = radius;
    }

    next() {
        if (this._dir > TOP_LEFT) {
            return {
                done: true
            }
        }

        const result = {
            done: false,
            value: {},
        };

        switch(this._dir) {
            case TOP_RIGHT:
                result.value.x = Math.round(this.x - this._step + 0.25);
                result.value.y = Math.round(this.y + this._step - this._radius + 0.25);
                break;
            case BOTTOM_RIGHT:
                result.value.x = Math.round(this.x + this._radius - this._step - 0.25);
                result.value.y = Math.round(this.y - this._step + 0.25);
                break;
            case BOTTOM_LEFT:
                result.value.x = Math.round(this.x + this._step - 0.25);
                result.value.y = Math.round(this.y + this._radius - this._step - 0.25);
                break;
            default: // TOP_LEFT
                result.value.x = Math.round(this.x + this._step - this._radius + 0.25);
                result.value.y = Math.round(this.y + this._step - 0.25);
                break;
        }

        this._step = this._step - 0.5;

        if (this._step < 1) {
            this._dir = this._dir + 2;
            this._step = this._radius;
        }

        return result;
    }
}
module.exports = DiamondIterator;
