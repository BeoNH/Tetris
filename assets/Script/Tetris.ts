import { _decorator, Button, CCInteger, Component, find, instantiate, Node, Sprite, SpriteFrame, v3 } from 'cc';
import { GameManager } from './GameManager';
import { NumberScrolling } from './NumberScrolling';
import { AudioController } from './AudioController';
import { APIManager } from './API_batta/APIManager';
import Request from './API_batta/Request';

const { ccclass, property } = _decorator;

@ccclass('Tetris')
export class Tetris extends Component {

    @property({ type: Node, tooltip: "Khối" })
    Block: Node = null;

    @property({ type: Button, tooltip: "Nút bấm xuống" })
    button: Button = null;

    @property({ type: SpriteFrame, tooltip: "Màu khối" })
    ANHBLOCK: SpriteFrame[] = [];

    @property({ type: NumberScrolling, tooltip: "Điểm" })
    numScore: NumberScrolling = null;

    @property({ type: NumberScrolling, tooltip: "Level" })
    numLevel: NumberScrolling = null;

    @property({ type: CCInteger, tooltip: "Hàng" })
    rows: number = 21; // thêm 1 hàng trên cùng tránh bắt va chạm

    @property({ type: CCInteger, tooltip: "Cột" })
    cols: number = 10;

    @property({ type: Node, tooltip: "Popup Game over" })
    popupGameOver: Node = null;

    grid: number[][] = []; // Định nghĩa lưới
    currentShape: any = { x: 0, y: 0, shape: undefined }; // tọa độ và tham số hình khối hiện tại mà chúng ta có thể cập nhật
    nextShape: any = { x: 0, y: 0, shape: undefined };
    originalSpeed: number[] = [1000, 900, 800, 700, 600, 500, 400, 300, 200, 100, 10, 1]; // danh sách các tốc độ trò chơi có sẵn
    speeds: number; // Biến lưu tốc độ
    elapsedTime: number = 0; // Biến đếm thời gian
    // elapsedScoreTime: number = 0; // Biến đếm điểm theo thời gian

    scorePlus: number[] = [0, 100, 300, 500, 800]; //Điểm được cộng theo số hàng xoá
    score: number = 0; //Điểm số
    level: number = 0; //Cấp độ

    // bag: any[] = []; // lưu trữ hình khối
    // bagIndex: number = 0; // chỉ số cho các hình khối trong túi

    isPlay: boolean = false; // kiểm tra hết phiên
    isGameOver: boolean = false; // kiểm tra hết phiên

    protected onLoad(): void {
        this.showGrid();
        this.showShape();
        this.showMenu();

        GameManager.nextShapeImage = this.ANHBLOCK;

        if (this.button) {
            this.button.node.on(Node.EventType.TOUCH_START, this.onHoldDownStart, this);
            this.button.node.on(Node.EventType.TOUCH_END, this.onHoldDownEnd, this);
            this.button.node.on(Node.EventType.TOUCH_CANCEL, this.onHoldDownEnd, this);
        }
    }

    start() {
        
    }

    update(dt: number) {
        if (this.isPlay && !this.isGameOver) {
            // this.elapsedScoreTime += dt;
            this.elapsedTime += dt * 1000; //mili giây
            if (this.elapsedTime >= this.speeds) {
                this.moveDown();
                this.elapsedTime = 0; // Reset thời gian
            }
        }
    }

    // Tính tốc độ dựa trên cấp độ
    getSpeedForLevel(level: number): number {
        return Math.max(1000 - level * 100, 100);
    }


    // Reset trò chơi
    reset() {
        this.grid = this.createGrid();
        this.showShape();
        // this.elapsedScoreTime = 0;
        this.score = 0;
        this.level = 0;
        this.speeds = this.originalSpeed[this.level];
        this.isGameOver = false;
        this.numScore.to(this.score);
        this.numLevel.to(this.level);
        this.popupGameOver.active = false;
        // this.generateBag();
        this.currentShape = this.createRandomShape();
        this.nextShape = this.createRandomShape();
        GameManager.nextShape = this.nextShape.shape;
    }

    // Tạo lưới trống
    createGrid() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }

    // Thêm node vào lưới
    showGrid() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                let block = instantiate(this.Block);
                block.name = `${row}_${col}`;
                block.parent = this.node;
                block.position = v3(col * GameManager.widthNode, -row * GameManager.widthNode);
            }
        }
    }

    // Tạo danh sách "bag system" - tránh lặp lại 1 hình quá nhiều lần
    // generateBag() {
    //     this.bag = [];
    //     let contents = "";
    //     while (this.bag.length < 7) {
    //         const shapeKey = this.randomKey(this.shapes);
    //         if (!contents.includes(shapeKey)) {
    //             this.bag.push(this.shapes[shapeKey]);
    //             contents += shapeKey;
    //         }
    //     }
    //     this.bagIndex = 0;
    // }

    // ngẫu nhiên 1 giá trị bất kỳ
    randomKey(obj) {
        const keys = Object.keys(obj);
        return keys[Math.floor(Math.random() * keys.length)];
    }

    // Tạo hình ngẫu nhiên
    createRandomShape() {
        const randomKey = this.randomKey(GameManager.shapes);
        return {
            shape: GameManager.shapes[randomKey],
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

    // Hiển thị hình dạng trên lưới
    showShape() {
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length; col++) {
                const value = this.grid[row][col];
                const nodeShape = this.node.getChildByPath(`${row}_${col}`);
                switch (value) {
                    case 0:
                        nodeShape.getComponent(Sprite).spriteFrame = null;
                        break;
                    default:
                        nodeShape.getComponent(Sprite).spriteFrame = this.ANHBLOCK[value - 1];
                        break;
                }
            }
        }
    }

    logggggg() {
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
        this.showShape();
    }

    // Di chuyển hình khối sang trái
    moveLeft() {
        this.removeShape();
        this.currentShape.x--;
        if (this.collides()) {
            this.currentShape.x++;
        }
        this.applyShape();
        this.showShape();

        AudioController.Instance.Move();
    }

    // Di chuyển hình khối sang phải
    moveRight() {
        this.removeShape();
        this.currentShape.x++;
        if (this.collides()) {
            this.currentShape.x--;
        }
        this.applyShape();
        this.showShape();

        AudioController.Instance.Move();
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
        this.showShape();

        AudioController.Instance.Rotate();
    }

    // Xoay hàng x cột thành cột x hàng
    transpose(array: any[]) {
        return array[0].map((_: any, i: number) => array.map(row => row[i]));
    }


    // tăng tốc độ di chuyển khi giữ nút
    onHoldDownStart() {
        this.speeds = 30;

        AudioController.Instance.Hold();
    }

    onHoldDownEnd() {
        this.speeds = this.originalSpeed[this.level];
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
        GameManager.nextShape = this.nextShape.shape;
        if (this.collides()) {
            this.gameOver();
        }

        AudioController.Instance.Lock();
    }

    // Xóa các hàng đầy đủ
    clearRows() {
        let newGrid = this.grid.filter(row => row.some(cell => cell === 0)); //mảng các hàng chưa full
        const rowsCleared = this.grid.length - newGrid.length;
        while (newGrid.length < this.grid.length) {
            newGrid.unshift(Array(this.cols).fill(0)); //thêm phần tử lên trên cùng của mảng đó(giả lập đẩy xuống)
        }
        this.grid = newGrid;
        if (rowsCleared > 0) {
            this.score += this.scorePlus[rowsCleared];
            this.numScore.to(this.score);
            this.levelCheck();

            AudioController.Instance.LineClear();
        }
    }

    // Xử lý kết thúc phiên chơi
    gameOver() {
        this.isPlay = false;
        this.isGameOver = true;
        // Tính thêm điểm theo thời gian
        // let totalScore = this.score + Math.floor(this.elapsedScoreTime) * 10;
        let totalScore = this.score;
        this.numScore.to(totalScore);
        this.popupGameOver.active = true;

        this.logSaveScore(totalScore);
        AudioController.Instance.Win();
    }

    // Kiểm tra level
    levelCheck() {
        const scoreThresholds = [100, 200, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500]; // Mảng ngưỡng điểm cho từng level    
        for (let i = 0; i < scoreThresholds.length; i++) {
            if (this.score <= scoreThresholds[i]) {
                this.level = i;
                break;
            }
            this.level = i + 1;
        }
        this.numLevel.to(this.level);
    }


    // Hiện thị menu
    showMenu() {
        this.reset();
        this.isPlay = false;
        find(`Canvas/Menu`).active = true;
        find(`Canvas/Pause`).active = false;
    }

    // Bắt đầu chơi game
    closeMenu() {
        this.reset();
        this.isPlay = true;
        find(`Canvas/Menu`).active = false;
    }

    //
    showPanel() {
        this.isPlay = false;
        find(`Canvas/Pause`).active = true;
    }

    closePanel() {
        this.isPlay = true;
        find(`Canvas/Pause`).active = false;
    }

    logSaveScore(num) {
        APIManager.CallLogin(res => {
            console.log(APIManager.sessionId);

            const tour = APIManager.urlParam(`tournament`);
            if (tour && tour == 'true') {
                APIManager.requestData(`/webhook/game/tournament`, {
                    gameId: APIManager.gameID,
                    score: num,
                }, res => { })
            }
    
    
            const leaderboard = APIManager.urlParam(`leaderboard`);
            if (leaderboard && leaderboard == 'true')
                APIManager.requestData(`/webhook/game/leaderboard`, {
                    gameId: APIManager.gameID,
                    score: num,
                }, res => { })
    
    
            const challenge = APIManager.urlParam(`challenge`);
            if (challenge && challenge == 'true')
                APIManager.requestData(`/webhook/game/challenge`, {
                    gameId: APIManager.gameID,
                    score: num,
                }, res => { })
        });
    }
}