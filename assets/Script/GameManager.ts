import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
        // Định nghĩa các khối
        public static readonly shapes: any = {
            I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
            J: [[2, 0, 0], [2, 2, 2], [0, 0, 0]],
            L: [[0, 0, 3], [3, 3, 3], [0, 0, 0]],
            O: [[4, 4], [4, 4]],
            S: [[0, 5, 5], [5, 5, 0], [0, 0, 0]],
            T: [[0, 6, 0], [6, 6, 6], [0, 0, 0]],
            Z: [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
        };

        // độ rộng 1 ô trong map
        public static readonly widthNode = 30;

        // khối tiếp theo được dùng
        public static nextShape;

        // ảnh khối tiếp thieo
        public static nextShapeImage = [];
}


