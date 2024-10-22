import { _decorator, Component, instantiate, Node, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Tetris')
export class Tetris extends Component {

    @property(Node)
    Block: Node = null;

    playfield: Number[][] = [];

    // Định nghĩa các khối tetromino
    tetrominos: any = {
        'I': [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        'J': [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        'L': [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        'O': [
            [1, 1],
            [1, 1]
        ],
        'S': [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        'Z': [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        'T': [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    };


    protected onLoad(): void {
        this.initMap();
    }

    start() {
    }

    update(dt: number) {

    }

    // Khởi tạo bàn chơi 10x20
    initMap() {
        for (let row = 0; row < 20; row++) {
            this.playfield[row] = [];
            for (let col = 0; col < 10; col++) {
                this.playfield[row][col] = 0;
                let block = instantiate(this.Block);
                block.name = `${row}_${col}`;
                block.parent = this.node;
                block.position = v3(col * 20, row * 20);
            }
        }
    }
}


