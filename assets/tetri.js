// Định nghĩa lưới 10x20 như là bảng
var grid = [
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
];

// Hình khối
var shapes = {
    I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
    J: [[2,0,0], [2,2,2], [0,0,0]],
    L: [[0,0,3], [3,3,3], [0,0,0]],
    O: [[4,4], [4,4]],
    S: [[0,5,5], [5,5,0], [0,0,0]],
    T: [[0,6,0], [6,6,6], [0,0,0]],
    Z: [[7,7,0], [0,7,7], [0,0,0]]
};

// Màu sắc của khối
var colors = ["F92338", "C973FF", "1C76BC", "FEE356", "53D504", "36E0FF", "F8931D"];

// Được sử dụng để tạo số ngẫu nhiên có hạt giống để chọn hình khối. Làm cho kết quả có thể tái lập (reproducible) cho việc gỡ lỗi
var rndSeed = 1;

// HÌNH KHỐI
// tọa độ và tham số hình khối hiện tại mà chúng ta có thể cập nhật
var currentShape = {x: 0, y: 0, shape: undefined};
// lưu trữ hình dạng của khối sắp tới
var upcomingShape;
// lưu trữ hình khối
var bag = [];
// chỉ số cho các hình khối trong túi
var bagIndex = 0;

// GIÁ TRỊ TRÒ CHƠI
// Điểm số trò chơi
var score = 0;
// tốc độ trò chơi
var speed = 500;
// biến boolean để thay đổi tốc độ trò chơi
var changeSpeed = false;
// để lưu trữ trạng thái hiện tại, chúng ta có thể tải lại sau
var saveState;
// lưu trữ trạng thái trò chơi hiện tại
var roundState;
// danh sách các tốc độ trò chơi có sẵn
var speeds = [500,100,1,0];
// chỉ số trong mảng tốc độ trò chơi
var speedIndex = 0;
// bật hoặc tắt AI
var ai = true;
// vẽ trò chơi so với cập nhật các thuật toán
var draw = true;
// đã thực hiện bao nhiêu lượt?
var movesTaken = 0;
// giới hạn số lượt tối đa cho phép trong một thế hệ
var moveLimit = 500;
// bao gồm 7 tham số di chuyển
var moveAlgorithm = {};
// đặt thành chuyển động với tỷ lệ cao nhất
var inspectMoveSelection = false;

// GIÁ TRỊ THUẬT TOÁN DI TRUYỀN
// lưu trữ số lượng gen, khởi tạo ở 50 
var populationSize = 50;
// lưu trữ gen
var genomes = [];
// chỉ số của gen hiện tại trong mảng gen
var currentGenome = -1;
// số thế hệ
var generation = 0;
// lưu trữ giá trị cho một thế hệ
var archive = {
    populationSize: 0,
    currentGeneration: 0,
    elites: [],
    genomes: []
};
// tỷ lệ đột biến
var mutationRate = 0.05;
// giúp tính toán đột biến
var mutationStep = 0.2;

// hàm chính, được gọi khi tải
function initialize() {
    // khởi tạo kích thước dân số
    archive.populationSize = populationSize;
    // lấy hình dạng tiếp theo có sẵn từ túi
    nextShape();
    // áp dụng hình dạng vào lưới
    applyShape();
    // thiết lập cả trạng thái lưu và trạng thái hiện tại từ trò chơi
    saveState = getState();
    roundState = getState();
    // tạo một quần thể gen ban đầu
    createInitialPopulation();
    // vòng lặp trò chơi
    var loop = function(){
        // biến boolean để thay đổi tốc độ trò chơi
        if (changeSpeed) {
            // khởi động lại đồng hồ
            // dừng thời gian
            clearInterval(interval);
            // thiết lập thời gian, như một chiếc đồng hồ kỹ thuật số
            interval = setInterval(loop, speed);
            // và không thay đổi nó
            changeInterval = false;
        }
        if (speed === 0) {
            // không cần vẽ các phần tử trên màn hình
            draw = false;
            // cập nhật trò chơi (cập nhật độ phù hợp, thực hiện một nước đi, đánh giá nước đi tiếp theo)
            update();
            update();
            update();
        } else {
            // vẽ các phần tử
            draw = true;
        }
        // cập nhật bất kể
        update();
        if (speed === 0) {
            // bây giờ vẽ các phần tử
            draw = true;
            // bây giờ cập nhật điểm số
            updateScore();
        }
    };
    // khoảng thời gian hẹn giờ
    var interval = setInterval(loop, speed);
}
document.onLoad = initialize();

// tùy chọn phím
window.onkeydown = function (event) {
    var characterPressed = String.fromCharCode(event.keyCode);
    if (event.keyCode == 38) {
        rotateShape();
    } else if (event.keyCode == 40) {
        moveDown();
    } else if (event.keyCode == 37) {
        moveLeft();
    } else if (event.keyCode == 39) {
        moveRight();
    } else if (shapes[characterPressed.toUpperCase()] !== undefined) {
        removeShape();
        currentShape.shape = shapes[characterPressed.toUpperCase()];
        applyShape();
    } else if (characterPressed.toUpperCase() == "Q") {
        saveState = getState();
    } else if (characterPressed.toUpperCase() == "W") {
        loadState(saveState);
    } else if (characterPressed.toUpperCase() == "D") {
        // làm chậm lại
        speedIndex--;
        if (speedIndex < 0) {
            speedIndex = speeds.length - 1;
        }
        speed = speeds[speedIndex];
        changeSpeed = true;
    } else if (characterPressed.toUpperCase() == "E") {
        // tăng tốc độ
        speedIndex++;
        if (speedIndex >= speeds.length) {
            speedIndex = 0;
        }
        // điều chỉnh chỉ số tốc độ
        speed = speeds[speedIndex];
        changeSpeed = true;
        // Bật hoặc tắt AI
    } else if (characterPressed.toUpperCase() == "A") {
        ai = !ai;
    } else if (characterPressed.toUpperCase() == "R") {
        // tải các giá trị thế hệ đã lưu
        loadArchive(prompt("Nhập lưu trữ:"));
    } else if (characterPressed.toUpperCase() == "G") {
        if (localStorage.getItem("archive") === null) {
            alert("Không có lưu trữ nào được lưu. Các lưu trữ được lưu sau khi một thế hệ đã trôi qua, và vẫn còn qua các phiên. Hãy thử lại khi một thế hệ đã trôi qua");
        } else {
            prompt("Lưu trữ từ thế hệ cuối (bao gồm từ phiên cuối):", localStorage.getItem("archive"));
        }
    } else if (characterPressed.toUpperCase() == "F") {
        // ?
        inspectMoveSelection = !inspectMoveSelection;
    } else {
        return true;
    }
    // xuất trạng thái trò chơi ra màn hình (sau khi nhấn phím)
    output();
    return false;
};
/**
 * Tạo ra quần thể gen ban đầu, mỗi gen có các gen ngẫu nhiên.
 */
function createInitialPopulation() {
    // khởi tạo mảng
    genomes = [];
    // cho kích thước quần thể đã cho
    for (var i = 0; i < populationSize; i++) {
        // khởi tạo ngẫu nhiên 7 giá trị tạo thành một gen
        // đây là các giá trị trọng số được cập nhật thông qua tiến hóa
        var genome = {
            // định danh duy nhất cho một gen
            id: Math.random(),
            // trọng số của mỗi hàng được xóa bởi nước đi đã cho. càng nhiều hàng được xóa, trọng số này càng tăng
            rowsCleared: Math.random() - 0.5,
            // chiều cao tuyệt đối của cột cao nhất lũy thừa 1.5
            // thêm để thuật toán có thể phát hiện nếu các khối xếp quá cao
            weightedHeight: Math.random() - 0.5,
            // tổng chiều cao của tất cả các cột
            cumulativeHeight: Math.random() - 0.5,
            // cột cao nhất trừ cột thấp nhất
            relativeHeight: Math.random() - 0.5,
            // tổng số ô trống có khối ở trên chúng (basically, ô không thể được lấp đầy)
            holes: Math.random() * 0.5,
            // tổng sự khác biệt tuyệt đối giữa chiều cao của mỗi cột
            //(ví dụ, nếu tất cả các hình trên lưới nằm hoàn toàn phẳng, thì độ gồ ghề sẽ bằng 0).
            roughness: Math.random() - 0.5,
        };
        // thêm vào mảng
        genomes.push(genome);
    }
    evaluateNextGenome();
}

/**
 * Đánh giá gen tiếp theo trong quần thể. Nếu không có, tiến hóa quần thể.
 */
function evaluateNextGenome() {
    // tăng chỉ số trong mảng gen
    currentGenome++;
    // Nếu không có nữa, tiến hóa quần thể.
    if (currentGenome == genomes.length) {
        evolve();
    }
    // tải trạng thái trò chơi hiện tại
    loadState(roundState);
    // đặt lại số lượt đã thực hiện
    movesTaken = 0;
    // và thực hiện nước đi tiếp theo
    makeNextMove();
}

/**
 * Tiến hóa toàn bộ quần thể và chuyển sang thế hệ tiếp theo.
 */
function evolve() {
    console.log("Thế hệ " + generation + " đã được đánh giá.");
    // đặt lại gen hiện tại cho thế hệ mới
    currentGenome = 0;
    // tăng thế hệ
    generation++;
    // đặt lại trò chơi
    reset();
    // lấy trạng thái trò chơi hiện tại
    roundState = getState();
    // sắp xếp các gen theo thứ tự giảm dần của giá trị độ phù hợp
    genomes.sort(function(a, b) {
        return b.fitness - a.fitness;
    });
    // thêm một bản sao của gen phù hợp nhất vào danh sách những gen ưu tú
    archive.elites.push(clone(genomes[0]));
    console.log("Độ phù hợp của gen ưu tú: " + genomes[0].fitness);

    // loại bỏ phần đuôi của các gen, tập trung vào những gen phù hợp nhất
    while(genomes.length > populationSize / 2) {
        genomes.pop();
    }
    // tổng độ phù hợp cho mỗi gen
    var totalFitness = 0;
    for (var i = 0; i < genomes.length; i++) {
        totalFitness += genomes[i].fitness;
    }

    // lấy chỉ số ngẫu nhiên từ mảng gen
    function getRandomGenome() {
        return genomes[randomWeightedNumBetween(0, genomes.length - 1)];
    }
    // tạo mảng con
    var children = [];
    // thêm gen phù hợp nhất vào mảng
    children.push(clone(genomes[0]));
    // thêm số lượng con bằng với kích thước quần thể
    while (children.length < populationSize) {
        // crossover giữa hai gen ngẫu nhiên để tạo ra một con
        children.push(makeChild(getRandomGenome(), getRandomGenome()));
    }
    // tạo mảng gen mới
    genomes = [];
    // lưu trữ tất cả các con trong
    genomes = genomes.concat(children);
    // lưu điều này vào kho lưu trữ của chúng tôi
    archive.genomes = clone(genomes);
    // và đặt thế hệ hiện tại
    archive.currentGeneration = clone(generation);
    console.log(JSON.stringify(archive));
    // lưu trữ kho lưu trữ, cảm ơn JS localstorage! (trí nhớ ngắn hạn)
    localStorage.setItem("archive", JSON.stringify(archive));
}

/**
 * Tạo ra một gen con từ các gen cha đã cho, và sau đó cố gắng đột biến gen con.
 * @param  {Genome} mum Gen cha đầu tiên.
 * @param  {Genome} dad Gen cha thứ hai.
 * @return {Genome}     Gen con.
 */
function makeChild(mum, dad) {
    // khởi tạo gen con dựa trên hai gen (7 tham số của nó + giá trị độ phù hợp ban đầu)
    var child = {
        // id duy nhất
        id : Math.random(),
        // tất cả các tham số này được chọn ngẫu nhiên giữa gen mẹ và gen cha
        rowsCleared: randomChoice(mum.rowsCleared, dad.rowsCleared),
        weightedHeight: randomChoice(mum.weightedHeight, dad.weightedHeight),
        cumulativeHeight: randomChoice(mum.cumulativeHeight, dad.cumulativeHeight),
        relativeHeight: randomChoice(mum.relativeHeight, dad.relativeHeight),
        holes: randomChoice(mum.holes, dad.holes),
        roughness: randomChoice(mum.roughness, dad.roughness),
        // không có độ phù hợp. chưa.
        fitness: -1
    };
    // đến thời điểm đột biến!

    // chúng ta đột biến từng tham số bằng bước đột biến của chúng ta
    if (Math.random() < mutationRate) {
        child.rowsCleared = child.rowsCleared + Math.random() * mutationStep * 2 - mutationStep;
    }
    if (Math.random() < mutationRate) {
        child.weightedHeight = child.weightedHeight + Math.random() * mutationStep * 2 - mutationStep;
    }
    if (Math.random() < mutationRate) {
        child.cumulativeHeight = child.cumulativeHeight + Math.random() * mutationStep * 2 - mutationStep;
    }
    if (Math.random() < mutationRate) {
        child.relativeHeight = child.relativeHeight + Math.random() * mutationStep * 2 - mutationStep;
    }
    if (Math.random() < mutationRate) {
        child.holes = child.holes + Math.random() * mutationStep * 2 - mutationStep;
    }
    if (Math.random() < mutationRate) {
        child.roughness = child.roughness + Math.random() * mutationStep * 2 - mutationStep;
    }
    return child;
}

/**
 * Trả về mảng chứa tất cả các nước đi có thể xảy ra trong trạng thái hiện tại, được đánh giá theo các tham số của gen hiện tại.
 * @return {Array} Mảng chứa tất cả các nước đi có thể xảy ra.
 */
function getAllPossibleMoves() {
    var lastState = getState();
    var possibleMoves = [];
    var possibleMoveRatings = [];
    var iterations = 0;
    // cho mỗi phép quay có thể
    for (var rots = 0; rots < 4; rots++) {

        var oldX = [];
        // cho mỗi lần lặp
        for (var t = -5; t <= 5; t++) {
            iterations++;
            loadState(lastState);
            // quay hình
            for (var j = 0; j < rots; j++) {
                rotateShape();
            }
            // di chuyển sang trái
            if (t < 0) {
                for (var l = 0; l < Math.abs(t); l++) {
                    moveLeft();
                }
            // di chuyển sang phải
            } else if (t > 0) {
                for (var r = 0; r < t; r++) {
                    moveRight();
                }
            }
            // nếu hình đã di chuyển
            if (!contains(oldX, currentShape.x)) {
                // di chuyển xuống
                var moveDownResults = moveDown();
                while (moveDownResults.moved) {
                    moveDownResults = moveDown();
                }
                // thiết lập 7 tham số của một gen
                var algorithm = {
                    rowsCleared: moveDownResults.rowsCleared,
                    weightedHeight: Math.pow(getHeight(), 1.5),
                    cumulativeHeight: getCumulativeHeight(),
                    relativeHeight: getRelativeHeight(),
                    holes: getHoles(),
                    roughness: getRoughness()
                };
                // đánh giá từng nước đi
                var rating = 0;
                rating += algorithm.rowsCleared * genomes[currentGenome].rowsCleared;
                rating += algorithm.weightedHeight * genomes[currentGenome].weightedHeight;
                rating += algorithm.cumulativeHeight * genomes[currentGenome].cumulativeHeight;
                rating += algorithm.relativeHeight * genomes[currentGenome].relativeHeight;
                rating += algorithm.holes * genomes[currentGenome].holes;
                rating += algorithm.roughness * genomes[currentGenome].roughness;
                // nếu nước đi thua trò chơi, giảm điểm số
                if (moveDownResults.lose) {
                    rating -= 500;
                }
                // đẩy tất cả các nước đi có thể, với điểm số và giá trị tham số liên quan vào mảng
                possibleMoves.push({rotations: rots, translation: t, rating: rating, algorithm: algorithm});
                // cập nhật vị trí của giá trị X cũ
                oldX.push(currentShape.x);
            }
        }
    }
    // lấy trạng thái cuối cùng
    loadState(lastState);
    // trả về mảng chứa tất cả các nước đi có thể
    return possibleMoves;
}
/**
 * Trả về nước đi có điểm số cao nhất trong mảng nước đi đã cho.
 * @param  {Array} moves Mảng các nước đi có thể chọn.
 * @return {Move}       Nước đi có điểm số cao nhất từ tập nước đi.
 */
function getHighestRatedMove(moves) {
    // bắt đầu với những giá trị nhỏ
    var maxRating = -10000000000000;
    var maxMove = -1;
    var ties = [];
    // lặp qua danh sách nước đi
    for (var index = 0; index < moves.length; index++) {
        // nếu điểm số của nước đi hiện tại cao hơn maxRating của chúng ta
        if (moves[index].rating > maxRating) {
            // cập nhật giá trị max của chúng ta để bao gồm giá trị của nước đi này
            maxRating = moves[index].rating;
            maxMove = index;
            // lưu chỉ số của nước đi này
            ties = [index];
        } else if (moves[index].rating == maxRating) {
            // nếu nó hòa với điểm số cao nhất
            // thêm chỉ số vào mảng ties
            ties.push(index);
        }
    }
    // cuối cùng chúng ta sẽ đặt giá trị nước đi cao nhất vào biến nước đi này
    var move = moves[ties[0]];
    // và đặt số lượng hòa
    move.algorithm.ties = ties.length;
    return move;
}

/**
 * Thực hiện một nước đi, được quyết định dựa trên các tham số trong gen hiện tại.
 */
function makeNextMove() {
    // tăng số nước đã thực hiện
    movesTaken++;
    // nếu vượt quá giới hạn nước đi
    if (movesTaken > moveLimit) {
        // cập nhật giá trị độ phù hợp của gen này bằng điểm số trò chơi
        genomes[currentGenome].fitness = clone(score);
        // và đánh giá gen tiếp theo
        evaluateNextGenome();
    } else {
        // đến lúc thực hiện một nước đi

        // chúng ta sẽ vẽ lại, vì vậy hãy lưu hình vẽ cũ
        var oldDraw = clone(draw);
        draw = false;
        // lấy tất cả các nước đi có thể
        var possibleMoves = getAllPossibleMoves();
        // lưu trạng thái hiện tại vì chúng ta sẽ cập nhật nó
        var lastState = getState();
        // hình tiếp theo để chơi
        nextShape();
        // cho mỗi nước đi có thể
        for (var i = 0; i < possibleMoves.length; i++) {
            // lấy nước đi tốt nhất. vì vậy chúng ta đang kiểm tra tất cả các nước đi có thể, cho mỗi nước đi có thể. moveception.
            var nextMove = getHighestRatedMove(getAllPossibleMoves());
            // thêm điểm số đó vào mảng các nước đi có điểm số cao nhất
            possibleMoves[i].rating += nextMove.rating;
        }
        // tải trạng thái hiện tại
        loadState(lastState);
        // lấy nước đi có điểm số cao nhất
        var move = getHighestRatedMove(possibleMoves);
        // sau đó quay hình như nó đã chỉ ra
        for (var rotations = 0; rotations < move.rotations; rotations++) {
            rotateShape();
        }
        // và di chuyển sang trái như nó đã chỉ ra
        if (move.translation < 0) {
            for (var lefts = 0; lefts < Math.abs(move.translation); lefts++) {
                moveLeft();
            }
            // và sang phải như nó đã chỉ ra
        } else if (move.translation > 0) {
            for (var rights = 0; rights < move.translation; rights++) {
                moveRight();
            }
        }
        // cập nhật thuật toán nước đi của chúng ta
        if (inspectMoveSelection) {
            moveAlgorithm = move.algorithm;
        }
        // và đặt hình vẽ cũ thành hiện tại
        draw = oldDraw;
        // xuất trạng thái ra màn hình
        output();
        // và cập nhật điểm số
        updateScore();
    }
}

/**
 * Cập nhật trò chơi.
 */
function update() {
    // nếu chúng ta đã bật AI và gen hiện tại không bằng -1
    // thực hiện một nước đi
    if (ai && currentGenome != -1) {
        // di chuyển hình xuống
        var results = moveDown();
        // nếu điều đó không làm gì cả
        if (!results.moved) {
            // nếu chúng ta thua
            if (results.lose) {
                // cập nhật độ phù hợp
                genomes[currentGenome].fitness = clone(score);
                // chuyển sang gen tiếp theo
                evaluateNextGenome();
            } else {
                // nếu chúng ta không thua, thực hiện nước đi tiếp theo
                makeNextMove();
            }
        }
    } else {
        // nếu không, chỉ cần di chuyển xuống
        moveDown();
    }
    // xuất trạng thái ra màn hình
    output();
    // và cập nhật điểm số
    updateScore();
}

/**
 * Di chuyển hình hiện tại xuống nếu có thể.
 * @return {Object} Kết quả của việc di chuyển hình.
 */
function moveDown() {
    // mảng các khả năng
    var result = {lose: false, moved: true, rowsCleared: 0};
    // xóa hình, vì chúng ta sẽ vẽ một hình mới
    removeShape();
    // di chuyển nó xuống trục y
    currentShape.y++;
    // nếu nó va chạm với lưới
    if (collides(grid, currentShape)) {
        // cập nhật vị trí của nó
        currentShape.y--;
        // áp dụng (gắn) nó vào lưới
        applyShape();
        // chuyển sang hình tiếp theo trong bộ
        nextShape();
        // xóa hàng và lấy số hàng đã xóa
        result.rowsCleared = clearRows();
        // kiểm tra lại xem hình này có va chạm với lưới của chúng ta không
        if (collides(grid, currentShape)) {
            // đặt lại
            result.lose = true;
            if (ai) {
            } else {
                reset();
            }
        }
        result.moved = false;
    }
    // áp dụng hình, cập nhật điểm số và xuất trạng thái ra màn hình
    applyShape();
    score++;
    updateScore();
    output();
    return result;
}

/**
 * Di chuyển hình hiện tại sang trái nếu có thể.
 */
function moveLeft() {
    // xóa hình hiện tại, dịch chuyển nó sang bên, nếu va chạm thì dịch chuyển lại
    removeShape();
    currentShape.x--;
    if (collides(grid, currentShape)) {
        currentShape.x++;
    }
    // áp dụng hình mới
    applyShape();
}

/**
 * Di chuyển hình hiện tại sang phải nếu có thể.
 */
function moveRight() {
    // tương tự
    removeShape();
    currentShape.x++;
    if (collides(grid, currentShape)) {
        currentShape.x--;
    }
    applyShape();
}

/**
 * Quay hình hiện tại theo chiều kim đồng hồ nếu có thể.
 */
function rotateShape() {
    // dịch chuyển nó nếu có thể, nếu không thì quay trở lại vị trí ban đầu
    removeShape();
    currentShape.shape = rotate(currentShape.shape, 1);
    if (collides(grid, currentShape)) {
        currentShape.shape = rotate(currentShape.shape, 3);
    }
    applyShape();
}

/**
 * Xóa bất kỳ hàng nào đã được lấp đầy hoàn toàn.
 */
function clearRows() {
    // mảng trống cho các hàng cần xóa
    var rowsToClear = [];
    // cho mỗi hàng trong lưới
    for (var row = 0; row < grid.length; row++) {
        var containsEmptySpace = false;
        // cho mỗi cột
        for (var col = 0; col < grid[row].length; col++) {
            // nếu nó trống
            if (grid[row][col] === 0) {
                // đặt giá trị này thành true
                containsEmptySpace = true;
            }
        }
        // nếu không có cột nào trong hàng này trống
        if (!containsEmptySpace) {
            // thêm hàng vào danh sách của chúng ta, nó đã được lấp đầy hoàn toàn!
            rowsToClear.push(row);
        }
    }
    // tăng điểm số cho tối đa 4 hàng. nó tối đa ở mức 12000
    if (rowsToClear.length == 1) {
        score += 400;
    } else if (rowsToClear.length == 2) {
        score += 1000;
    } else if (rowsToClear.length == 3) {
        score += 3000;
    } else if (rowsToClear.length >= 4) {
        score += 12000;
    }
    // mảng mới cho các hàng đã xóa
    var rowsCleared = clone(rowsToClear.length);
    // cho mỗi giá trị
    for (var toClear = rowsToClear.length - 1; toClear >= 0; toClear--) {
        // xóa hàng khỏi lưới
        grid.splice(rowsToClear[toClear], 1);
    }
    // dịch chuyển các hàng khác
    while (grid.length < 20) {
        grid.unshift([0,0,0,0,0,0,0,0,0,0]);
    }
    // trả về số hàng đã xóa
    return rowsCleared;
}
     /**
     * Áp dụng hình dạng hiện tại vào lưới.
     */
     function applyShape() {
        // Đối với mỗi giá trị trong hình dạng hiện tại (hàng x cột)
        for (var row = 0; row < currentShape.shape.length; row++) {
            for (var col = 0; col < currentShape.shape[row].length; col++) {
                // Nếu không rỗng
                if (currentShape.shape[row][col] !== 0) {
                    // Đặt giá trị trong lưới thành giá trị của nó. Gắn hình dạng vào lưới!
                    grid[currentShape.y + row][currentShape.x + col] = currentShape.shape[row][col];
                }
            }
        }
    }
    
    /**
     * Xóa hình dạng hiện tại khỏi lưới.
     */
    // Cách làm tương tự nhưng ngược lại
    function removeShape() {
        for (var row = 0; row < currentShape.shape.length; row++) {
            for (var col = 0; col < currentShape.shape[row].length; col++) {
                if (currentShape.shape[row][col] !== 0) {
                    grid[currentShape.y + row][currentShape.x + col] = 0;
                }
            }
        }
    }
    
    /**
     * Chuyển sang hình dạng tiếp theo trong bao.
     */
    function nextShape() {
        // Tăng chỉ số bagIndex lên 1 để chuyển sang hình dạng tiếp theo
        bagIndex += 1;

        // Kiểm tra xem bao đã hết hình dạng hay chưa
        if (bag.length === 0 || bagIndex == bag.length) {
            // Nếu bao đã hết hình dạng, tạo một bao mới
            generateBag();
        }

        // Kiểm tra nếu bagIndex gần tới cuối của bao
        if (bagIndex == bag.length - 1) {
            // Lưu lại seed trước đó
            var prevSeed = rndSeed;
            // Tạo hình dạng sắp tới (upcomingShape) một cách ngẫu nhiên từ danh sách shapes
            upcomingShape = randomProperty(shapes);
            // Khôi phục seed đã lưu
            rndSeed = prevSeed;
        } else {
            // Lấy hình dạng tiếp theo từ bao
            upcomingShape = shapes[bag[bagIndex + 1]];
        }

        // Lấy hình dạng hiện tại từ bao
        currentShape.shape = shapes[bag[bagIndex]];

        // Xác định vị trí của hình dạng hiện tại
        currentShape.x = Math.floor(grid[0].length / 2) - Math.ceil(currentShape.shape[0].length / 2);
        currentShape.y = 0;
    }
    
    /**
     * Tạo bao hình dạng.
     */
    function generateBag() {
        bag = [];
        var contents = "";
        // 7 hình dạng
        for (var i = 0; i < 7; i++) {
            // Tạo hình dạng ngẫu nhiên
            var shape = randomKey(shapes);
            while(contents.indexOf(shape) != -1) {
                shape = randomKey(shapes);
            }
            // Cập nhật bao với hình dạng đã tạo
            bag[i] = shape;
            contents += shape;
        }
        // Đặt lại chỉ số bao
        bagIndex = 0;
    }
    
    /**
     * Đặt lại trò chơi.
     */
    function reset() {
        score = 0;
        grid = [[0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        ];
        moves = 0;
        generateBag();
        nextShape();
    }
    
    /**
     * Xác định xem lưới và hình dạng cho trước có va chạm với nhau hay không.
     * @param  {Grid} scene  Lưới cần kiểm tra.
     * @param  {Shape} object Hình dạng cần kiểm tra.
     * @return {Boolean} Có hay không hình dạng và lưới va chạm.
     */
    function collides(scene, object) {
        // Đối với kích thước của hình dạng (hàng x cột)
        for (var row = 0; row < object.shape.length; row++) {
            for (var col = 0; col < object.shape[row].length; col++) {
                // Nếu không rỗng
                if (object.shape[row][col] !== 0) {
                    // Nếu va chạm, trả về true
                    if (scene[object.y + row] === undefined || scene[object.y + row][object.x + col] === undefined || scene[object.y + row][object.x + col] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    // Để quay một hình dạng, cần bao nhiêu lần quay
    function rotate(matrix, times) {
        // Đối với mỗi lần
        for (var t = 0; t < times; t++) {
            // Lật ma trận hình dạng
            matrix = transpose(matrix);
            // Và cho chiều dài của ma trận, đảo ngược mỗi cột
            for (var i = 0; i < matrix.length; i++) {
                matrix[i].reverse();
            }
        }
        return matrix;
    }
    // Đảo ngược hàng x cột thành cột x hàng
    function transpose(array) {
        return array[0].map(function(col, i) {
            return array.map(function(row) {
                return row[i];
            });
        });
    }
    
    /**
     * Xuất trạng thái ra màn hình.
     */
    function output() {
        if (draw) {
            var output = document.getElementById("output");
            var html = "<h1>TetNet</h1><h5>Cách tiếp cận tiến hóa đối với AI Tetris</h5>var grid = [";
            var space = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
            for (var i = 0; i < grid.length; i++) {
                if (i === 0) {
                    html += "[" + grid[i] + "]";
                } else {
                    html += "<br />" + space + "[" + grid[i] + "]";
                }
            }
            html += "];";
            for (var c = 0; c < colors.length; c++) {
                html = replaceAll(html, "," + (c + 1), ",<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>");
                html = replaceAll(html, (c + 1) + ",", "<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>,");
            }
            // output.innerHTML = html;
        }
    }
    
    /**
     * Cập nhật thông tin bên cạnh.
     */
    function updateScore() {
        if (draw) {
            var scoreDetails = document.getElementById("score");
            var html = "<br /><br /><h2>&nbsp;</h2><h2>Điểm: " + score + "</h2>";
            html += "<br /><b>--Sắp tới--</b>";
            for (var i = 0; i < upcomingShape.length; i++) {
                var next = replaceAll((upcomingShape[i] + ""), "0", "&nbsp;");
                html += "<br />&nbsp;&nbsp;&nbsp;&nbsp;" + next;
            }
            for (var l = 0; l < 4 - upcomingShape.length; l++) {
                html += "<br />";
            }
            for (var c = 0; c < colors.length; c++) {
                html = replaceAll(html, "," + (c + 1), ",<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>");
                html = replaceAll(html, (c + 1) + ",", "<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>,");
            }
            html += "<br />Tốc độ: " + speed;
            if (ai) {
                html += "<br />Số lượt: " + movesTaken + "/" + moveLimit;
                html += "<br />Thế hệ: " + generation;
                html += "<br />Cá thể: " + (currentGenome + 1)  + "/" + populationSize;
                html += "<br /><pre style=\"font-size:12px\">" + JSON.stringify(genomes[currentGenome], null, 2) + "</pre>";
                if (inspectMoveSelection) {
                    html += "<br /><pre style=\"font-size:12px\">" + JSON.stringify(moveAlgorithm, null, 2) + "</pre>";
                }
            }
            html = replaceAll(replaceAll(replaceAll(html, "&nbsp;,", "&nbsp;&nbsp;"), ",&nbsp;", "&nbsp;&nbsp;"), ",", "&nbsp;");
            // scoreDetails.innerHTML = html;
        }
    }
    /**
     * Trả về trạng thái hiện tại của trò chơi dưới dạng một đối tượng.
     * @return {State} Trạng thái hiện tại của trò chơi.
     */
    function getState() {
        var state = {
            grid: clone(grid),
            currentShape: clone(currentShape),
            upcomingShape: clone(upcomingShape),
            bag: clone(bag),
            bagIndex: clone(bagIndex),
            rndSeed: clone(rndSeed),
            score: clone(score)
        };
        return state;
    }
   
   /**
    * Tải trạng thái trò chơi từ đối tượng trạng thái đã cho.
    * @param  {State} state Trạng thái cần tải.
    */
    function loadState(state) {
        grid = clone(state.grid);
        currentShape = clone(state.currentShape);
        upcomingShape = clone(state.upcomingShape);
        bag = clone(state.bag);
        bagIndex = clone(state.bagIndex);
        rndSeed = clone(state.rndSeed);
        score = clone(state.score);
        output();
        updateScore();
    }
   
   /**
    * Trả về chiều cao tích lũy của tất cả các cột.
    * @return {Number} Chiều cao tích lũy.
    */
    function getCumulativeHeight() {
        removeShape();
        var peaks = [20,20,20,20,20,20,20,20,20,20];
        for (var row = 0; row < grid.length; row++) {
            for (var col = 0; col < grid[row].length; col++) {
                if (grid[row][col] !== 0 && peaks[col] === 20) {
                    peaks[col] = row;
                }
            }
        }
        var totalHeight = 0;
        for (var i = 0; i < peaks.length; i++) {
            totalHeight += 20 - peaks[i];
        }
        applyShape();
        return totalHeight;
    }
   
   /**
    * Trả về số lượng lỗ trong lưới.
    * @return {Number} Số lượng lỗ.
    */
    function getHoles() {
        removeShape();
        var peaks = [20,20,20,20,20,20,20,20,20,20];
        for (var row = 0; row < grid.length; row++) {
            for (var col = 0; col < grid[row].length; col++) {
                if (grid[row][col] !== 0 && peaks[col] === 20) {
                    peaks[col] = row;
                }
            }
        }
        var holes = 0;
        for (var x = 0; x < peaks.length; x++) {
            for (var y = peaks[x]; y < grid.length; y++) {
                if (grid[y][x] === 0) {
                    holes++;
                }
            }
        }
        applyShape();
        return holes;
    }
   
   /**
    * Trả về một mảng thay thế tất cả các lỗ trong lưới bằng -1.
    * @return {Array} Mảng lưới đã được sửa đổi.
    */
    function getHolesArray() {
        var array = clone(grid);
        removeShape();
        var peaks = [20,20,20,20,20,20,20,20,20,20];
        for (var row = 0; row < grid.length; row++) {
            for (var col = 0; col < grid[row].length; col++) {
                if (grid[row][col] !== 0 && peaks[col] === 20) {
                    peaks[col] = row;
                }
            }
        }
        for (var x = 0; x < peaks.length; x++) {
            for (var y = peaks[x]; y < grid.length; y++) {
                if (grid[y][x] === 0) {
                    array[y][x] = -1;
                }
            }
        }
        applyShape();
        return array;
    }
   
   /**
    * Trả về độ gồ ghề của lưới.
    * @return {Number} Độ gồ ghề của lưới.
    */
    function getRoughness() {
        removeShape();
        var peaks = [20,20,20,20,20,20,20,20,20,20];
        for (var row = 0; row < grid.length; row++) {
            for (var col = 0; col < grid[row].length; col++) {
                if (grid[row][col] !== 0 && peaks[col] === 20) {
                    peaks[col] = row;
                }
            }
        }
        var roughness = 0;
        var differences = [];
        for (var i = 0; i < peaks.length - 1; i++) {
            roughness += Math.abs(peaks[i] - peaks[i + 1]);
            differences[i] = Math.abs(peaks[i] - peaks[i + 1]);
        }
        applyShape();
        return roughness;
    }
   
   /**
    * Trả về khoảng cách giữa các chiều cao của các cột trên lưới.
    * @return {Number} Chiều cao tương đối.
    */
    function getRelativeHeight() {
        removeShape();
        var peaks = [20,20,20,20,20,20,20,20,20,20];
        for (var row = 0; row < grid.length; row++) {
            for (var col = 0; col < grid[row].length; col++) {
                if (grid[row][col] !== 0 && peaks[col] === 20) {
                    peaks[col] = row;
                }
            }
        }
        applyShape();
        return Math.max.apply(Math, peaks) - Math.min.apply(Math, peaks);
    }
   
   /**
    * Trả về chiều cao của cột lớn nhất trên lưới.
    * @return {Number} Chiều cao tuyệt đối.
    */
    function getHeight() {
        removeShape();
        var peaks = [20,20,20,20,20,20,20,20,20,20];
        for (var row = 0; row < grid.length; row++) {
            for (var col = 0; col < grid[row].length; col++) {
                if (grid[row][col] !== 0 && peaks[col] === 20) {
                    peaks[col] = row;
                }
            }
        }
        applyShape();
        return 20 - Math.min.apply(Math, peaks);
    }
   
   /**
    * Tải kho lưu trữ đã cho.
    * @param  {String} archiveString Chuỗi kho lưu trữ đã được chuyển đổi.
    */
    function loadArchive(archiveString) {
        archive = JSON.parse(archiveString);
        genomes = clone(archive.genomes);
        populationSize = archive.populationSize;
        generation = archive.currentGeneration;
        currentGenome = 0;
        reset();
        roundState = getState();
        console.log("Kho lưu trữ đã được tải!");
    }
   
   /**
    * Sao chép một đối tượng.
    * @param  {Object} obj Đối tượng cần sao chép.
    * @return {Object}     Đối tượng đã sao chép.
    */
    function clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
   
   /**
    * Trả về một thuộc tính ngẫu nhiên từ đối tượng đã cho.
    * @param  {Object} obj Đối tượng để chọn thuộc tính.
    * @return {Property}     Một thuộc tính ngẫu nhiên.
    */
    function randomProperty(obj) {
        return(obj[randomKey(obj)]);
    }
   
   /**
    * Trả về một khóa thuộc tính ngẫu nhiên từ đối tượng đã cho.
    * @param  {Object} obj Đối tượng để chọn khóa thuộc tính.
    * @return {Property}     Một khóa thuộc tính ngẫu nhiên.
    */
    function randomKey(obj) {
        var keys = Object.keys(obj);
        var i = seededRandom(0, keys.length);
        return keys[i];
    }
   
    function replaceAll(target, search, replacement) {
        return target.replace(new RegExp(search, 'g'), replacement);
    }
   
   /**
    * Trả về một số ngẫu nhiên được xác định từ trình tạo số ngẫu nhiên với hạt giống.
    * @param  {Number} min Số tối thiểu, bao gồm.
    * @param  {Number} max Số tối đa, không bao gồm.
    * @return {Number}     Số ngẫu nhiên được tạo ra.
    */
    function seededRandom(min, max) {
        max = max || 1;
        min = min || 0;
   
        rndSeed = (rndSeed * 9301 + 49297) % 233280;
        var rnd = rndSeed / 233280;
   
        return Math.floor(min + rnd * (max - min));
    }
   
    function randomNumBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
   
    function randomWeightedNumBetween(min, max) {
        return Math.floor(Math.pow(Math.random(), 2) * (max - min + 1) + min);
    }
   
    function randomChoice(propOne, propTwo) {
        if (Math.round(Math.random()) === 0) {
            return clone(propOne);
        } else {
            return clone(propTwo);
        }
    }
   
    function contains(a, obj) {
        var i = a.length;
        while (i--) {
            if (a[i] === obj) {
                return true;
            }
        }
        return false;
    }  
    
    function log(text) {
        console.log(text);
    }

    