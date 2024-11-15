import { _decorator, Component, instantiate, Node, Sprite, v3 } from 'cc';
import { GameManager } from './GameManager';
import { Tetris } from './Tetris';
const { ccclass, property } = _decorator;

@ccclass('MiniMap')
export class MiniMap extends Component {
    
    @property({ type: Node, tooltip: "Khối" })
    Block: Node = null;

    rows: number = 3;
    cols: number = 3;
    grid: number[][] = [];
    previousShape: number[][] | null = null; // Lưu trữ trạng thái trước của hình dạng

    start() {
        this.showGrid();
    }

    update(deltaTime: number) {
        if (GameManager.nextShape && this.previousShape !== GameManager.nextShape) {
            this.showShape();
            this.previousShape = GameManager.nextShape; // Cập nhật trạng thái trước
        }
    }

    // Thêm node vào lưới
    showGrid() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                let block = instantiate(this.Block);
                block.name = `${row}_${col}`;
                block.parent = this.node;
                block.setPosition(v3(col * GameManager.widthNode, -row * GameManager.widthNode));
                block.getComponent(Sprite).spriteFrame = null;
            }
        }
    }

    // Hiển thị hình dạng trên lưới
    showShape() {
        this.grid = GameManager.nextShape;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const value = (this.grid[row] && this.grid[row][col]) ? this.grid[row][col] : 0;
                const nodeShape = this.node.getChildByPath(`${row}_${col}`);
                const spriteComponent = nodeShape.getComponent(Sprite);
                
                // Gán spriteFrame dựa trên giá trị của `value`
                spriteComponent.spriteFrame = value === 0
                    ? null 
                    : GameManager.nextShapeImage[value - 1];
            }
        }
    }
}
