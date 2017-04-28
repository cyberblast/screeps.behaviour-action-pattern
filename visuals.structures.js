// Based on the code by ags131
// https://gist.github.com/ags131/5da45ce88668214393d4b0439393fd9f

const COLOURS = {
    GRAY: '#555555',
    LIGHT: '#AAAAAA',
    DARK: '#181818',
    ENERGY: '#FFE56D',
    POWER: '#F41F33',
    OUTLINE: '#8FBB93',
};

const opacity = 0.5;

const Structures = class {
    
    relPoly(pos, poly) {
        return poly.map(p => {
            p[0] += pos.x;
            p[1] += pos.y;
            return p;
        });
    }

    drawExtension(vis, pos) {
        vis.circle(pos, {
            radius: 0.5,
            fill: COLOURS.DARK,
            stroke: COLOURS.OUTLINE,
            strokeWidth: 0.05,
            opacity,
        });
        vis.circle(pos, {
            radius: 0.35,
            fill: COLOURS.GRAY,
            opacity,
        });
    }
    
    drawSpawn(vis, pos) {
        vis.circle(pos, {
            radius: 0.65,
            fill: COLOURS.DARK,
            stroke: '#CCCCCC',
            strokeWidth: 0.1,
            opacity,
        });
        vis.circle(pos, {
            radius: 0.4,
            fill: COLOURS.ENERGY,
            opacity,
        });
    }
    
    drawPowerSpawn(vis, pos) {
        vis.circle(pos, {
            radius: 0.65,
            fill: COLOURS.DARK,
            stroke: COLOURS.POWER,
            strokeWidth: 0.1,
            opacity,
        });
        vis.circle(pos, {
            radius: 0.4,
            fill: COLOURS.ENERGY,
            opacity,
        });
    }
    
    drawLink(vis, pos) {
        let outer = [
            [0.0, -0.5],
            [0.4, -0.0],
            [0.0, 0.5],
            [-0.4, 0.0],
            [0.0, -0.5],
        ];
        outer = this.relPoly(pos, outer);
        const inner = outer.map(p => {
            p[0] *= 0.6;
            p[1] *= 0.6;
            return p;
        });
        vis.poly(outer, {
            fill: COLOURS.DARK,
            stroke: COLOURS.OUTLINE,
            strokeWidth: 0.05,
            opacity,
        });
        vis.poly(inner, {
            fill: COLOURS.GRAY,
            stroke: false,
            opacity,
        });
    }
    
    drawTerminal(vis, pos) {
        let outer = [
            [0.0, -0.8],
            [0.55, -0.55],
            [0.8, 0.0],
            [0.55, 0.55],
            [0.0, 0.8],
            [-0.55, 0.55],
            [-0.8, 0.0],
            [-0.55, -0.55],
            [0.0, -0.8],
        ];
        let inner = [
            [0.0, -0.65],
            [0.45, -0.45],
            [0.65, 0.0],
            [0.45, 0.45],
            [0.0, 0.65],
            [-0.45, 0.45],
            [-0.65, 0.0],
            [-0.45, -0.45],
        ];
        outer = this.relPoly(pos, outer);
        inner = this.relPoly(pos, inner);
        vis.poly(outer, {
            fill: COLOURS.DARK,
            stroke: COLOURS.OUTLINE,
            strokeWidth: 0.05,
            opacity,
        });
        vis.poly(inner, {
            fill: COLOURS.LIGHT,
            stroke: false,
            opacity,
        });
        vis.rect(pos.x - 0.45, pos.y - 0.45, 0.9, 0.9, {
            fill: COLOURS.GRAY,
            stroke: COLOURS.DARK,
            strokeWidth: 0.1,
            opacity,
        });
    }
    
    drawLab(vis, pos) {
        vis.circle(pos.x, pos.y - 0.025, {
            radius: 0.55,
            fill: COLOURS.DARK,
            stroke: COLOURS.OUTLINE,
            strokeWidth: 0.05,
            opacity,
        });
        vis.circle(pos.x, pos.y - 0.025, {
            radius: 0.4,
            fill: COLOURS.GRAY,
            opacity,
        });
        vis.rect(pos.x - 0.45, pos.y + 0.4, 0.9, 0.25, {
            fill: COLOURS.DARK,
            stroke: false,
            opacity,
        });
        let box = [
            [-0.45, 0.3],
            [-0.45, 0.55],
            [0.45, 0.55],
            [0.45, 0.3],
        ];
        box = this.relPoly(pos, box);
        vis.poly(box, {
            stroke: COLOURS.OUTLINE,
            strokeWidth: 0.05,
            opacity,
        });
    }
    
    drawTower(vis, pos) {
        vis.circle(pos, {
            radius: 0.6,
            fill: COLOURS.DARK,
            stroke: COLOURS.OUTLINE,
            strokeWidth: 0.05,
            opacity,
        });
        vis.rect(pos.x - 0.4, pos.y - 0.3, 0.8, 0.6, {
            fill: COLOURS.GRAY,
            opacity,
        });
        vis.rect(pos.x - 0.2, pos.y - 0.9, 0.4, 0.5, {
            fill: COLOURS.LIGHT,
            stroke: COLOURS.DARK,
            strokeWidth: 0.07,
            opacity,
        });
    }
    
    drawStorage(vis, pos) {
    
    }
    
    drawObserver(vis, pos) {
        vis.circle(pos, {
            fill: COLOURS.DARK,
            radius: 0.45,
            stroke: COLOURS.OUTLINE,
            strokeWidth: 0.05,
            opacity,
        });
        vis.circle(pos.x + 0.225, pos.y, {
            fill: COLOURS.OUTLINE,
            radius: 0.2,
            opacity,
        });
    }
    
    drawNuker(vis, pos) {
        let outline = [
            [0, -1],
            [-0.47, 0.2],
            [-0.5, 0.5],
            [0.5, 0.5],
            [0.47, 0.2],
            [0, -1],
        ];
        let inline = [
            [0, -0.8],
            [-0.4, 0.2],
            [0.4, 0.2],
            [0, -0.8],
        ];
        outline = this.relPoly(pos, outline);
        inline = this.relPoly(pos, inline);
        vis.poly(outline, {
            stroke: COLOURS.OUTLINE,
            strokeWidth: 0.05,
            fill: COLOURS.DARK,
            opacity,
        });
        vis.poly(inline, {
            stroke: COLOURS.OUTLINE,
            strokeWidth: 0.1,
            fill: COLOURS.GRAY,
            opacity,
        });
    }
    
    drawStructure(vis, pos, structureType) {
        if (structureType instanceof Structure) structureType = structureType.structureType;
        switch(structureType) {
            case STRUCTURE_EXTENSION:
                return this.drawExtension(vis, pos);
            case STRUCTURE_SPAWN:
                return this.drawSpawn(vis, pos);
            case STRUCTURE_POWER_SPAWN:
                return this.drawPowerSpawn(vis, pos);
            case STRUCTURE_LINK:
                return this.drawLink(vis, pos);
            case STRUCTURE_TERMINAL:
                return this.drawTerminal(vis, pos);
            case STRUCTURE_LAB:
                return this.drawLab(vis, pos);
            case STRUCTURE_TOWER:
                return this.drawTower(vis, pos);
            case STRUCTURE_STORAGE:
                return this.drawStorage(vis, pos);
            case STRUCTURE_OBSERVER:
                return this.drawObserver(vis, pos);
            case STRUCTURE_NUKER:
                return this.drawNuker(vis, pos);
        }
    }

};
module.exports = new Structures;