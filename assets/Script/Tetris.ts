import { _decorator, Component, instantiate, Node, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Tetris')
export class Tetris extends Component {

    @property(Node)
    Block: Node = null;

    @property({ type: Number, tooltip: "Hàng" })
    rows: number = 20;

    @property({ type: Number, tooltip: "Cột" })
    cols: number = 10;

    grid: number[][] = []; // Định nghĩa lưới
    currentShape: any = { x: 0, y: 0, shape: undefined }; // tọa độ và tham số hình khối hiện tại mà chúng ta có thể cập nhật
    nextShape: any = { x: 0, y: 0, shape: undefined };
    score: number = 0; //Điểm số
    bag: any[] = []; // lưu trữ hình khối
    bagIndex: number = 0; // chỉ số cho các hình khối trong túi

    // Định nghĩa các khối
    shapes: any = {
        I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
        J: [[2, 0, 0], [2, 2, 2], [0, 0, 0]],
        L: [[0, 0, 3], [3, 3, 3], [0, 0, 0]],
        O: [[4, 4], [4, 4]],
        S: [[0, 5, 5], [5, 5, 0], [0, 0, 0]],
        T: [[0, 6, 0], [6, 6, 6], [0, 0, 0]],
        Z: [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
    };


    protected onLoad(): void {
        this.reset();
        console.log(">>grid", this.grid);
    }

    start() {
    }

    update(dt: number) {

    }

    // Reset trò chơi
    reset() {
        this.grid = this.createGrid();
        this.score = 0;
        this.generateBag();
        this.currentShape = this.createRandomShape();
        this.nextShape = this.createRandomShape();
    }

    // Tạo lưới trống
    createGrid() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }

    // Tạo danh sách hình dạng theo "bag system"
    generateBag() {
        this.bag = [];
        let contents = "";
        while (this.bag.length < 7) {
            const shapeKey = this.randomKey();
            if (!contents.includes(shapeKey)) {
                this.bag.push(this.shapes[shapeKey]);
                contents += shapeKey;
            }
        }
        this.bagIndex = 0;
    }

    randomKey() {
        const keys = Object.keys(this.shapes);
        return keys[Math.floor(Math.random() * keys.length)];
    }

    // Tạo hình ngẫu nhiên
    createRandomShape() {
        const keys = Object.keys(this.shapes);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return {
            shape: this.shapes[randomKey],
            x: Math.floor(this.cols / 2) - 1,
            y: 0
        };
    }

    // Áp dụng hình dạng vào lưới
    applyShape() {
        const { shape, x, y } = this.currentShape;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    this.grid[y + row][x + col] = shape[row][col];
                }
            }
        }
    }

    // Xóa hình dạng khỏi lưới
    removeShape() {
        const { shape, x, y } = this.currentShape;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    this.grid[y + row][x + col] = 0;
                }
            }
        }
    }

    logggggg(){
        console.log(">>grid", this.grid);
    }

    // Di chuyển hình khối xuống
    moveDown() {
        this.removeShape();
        this.currentShape.y++;
        if (this.collides()) {
            this.currentShape.y--;
            this.applyShape();
            this.nextShapeHandler();
        } else {
            this.applyShape();
        }
    }

    // Di chuyển hình khối sang trái
    moveLeft() {
        this.removeShape();
        this.currentShape.x--;
        if (this.collides()) {
            this.currentShape.x++;
        }
        this.applyShape();
    }

    // Di chuyển hình khối sang phải
    moveRight() {
        this.removeShape();
        this.currentShape.x++;
        if (this.collides()) {
            this.currentShape.x--;
        }
        this.applyShape();
    }

    // Xoay hình khối
    rotateShape() {
        const { shape } = this.currentShape;
        this.removeShape();
        const rotatedShape = this.transpose(shape);
        rotatedShape.forEach(row => row.reverse());
        this.currentShape.shape = rotatedShape;
        if (this.collides()) {
            this.currentShape.shape = shape; // Nếu xoay va chạm, trả về hình ban đầu
        }
        this.applyShape();
    }

    // Xoay hàng x cột thành cột x hàng
    transpose(array: any[]) {
        return array[0].map((_: any, i: number) => array.map(row => row[i]));
    }

    // Kiểm tra va chạm
    collides() {
        const { shape, x, y } = this.currentShape;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    if (
                        this.grid[y + row] === undefined ||
                        this.grid[y + row][x + col] === undefined ||
                        this.grid[y + row][x + col] !== 0
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Xử lý khi chuyển sang hình khối tiếp theo
    nextShapeHandler() {
        this.clearRows();
        this.currentShape = this.nextShape;
        this.nextShape = this.createRandomShape();
        if (this.collides()) {
            this.reset(); // Reset nếu không có chỗ để hình khối mới
        }
    }

    // Xóa các hàng đầy đủ
    clearRows() {
        let newGrid = this.grid.filter(row => row.some(cell => cell === 0));
        const rowsCleared = this.grid.length - newGrid.length;
        while (newGrid.length < this.grid.length) {
            newGrid.unshift(Array(this.cols).fill(0));
        }
        this.grid = newGrid;
        this.score += rowsCleared;
    }

}


