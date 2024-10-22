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
            output.innerHTML = html;
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
            scoreDetails.innerHTML = html;
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

    
    /**
     * A node, representing a biological neuron.
     * @param {Number} ID  The ID of the node.
     * @param {Number} val The value of the node.
     */
     function Node(ID, val) {
         this.id = ID;
         this.incomingConnections = [];
         this.outgoingConnections = [];
         if (val === undefined) {
             val = 0;
         }
         this.value = val;
         this.bias = 0;
     }
    
    /**
     * A connection, representing a biological synapse.
     * @param {String} inID   The ID of the incoming node.
     * @param {String} outID  The ID of the outgoing node.
     * @param {Number} weight The weight of the connection.
     */
     function Connection(inID, outID, weight) {
         this.in = inID;
         this.out = outID;
         if (weight === undefined) {
             weight = 1;
         }
         this.id = inID + ":" + outID;
         this.weight = weight;
     }
    
    /**
     * The neural network, containing nodes and connections.
     * @param {Object} config The configuration to use.
     */
     function Network(config) {
         this.nodes = {};
         this.inputs = [];
         this.hidden = [];
         this.outputs = [];
         this.connections = {};
         this.nodes.BIAS = new Node("BIAS", 1);
    
         if (config !== undefined) {
             var inputNum = config.inputNodes || 0;
             var hiddenNum = config.hiddenNodes || 0;
             var outputNum = config.outputNodes || 0;
             this.createNodes(inputNum, hiddenNum, outputNum);
    
             if (config.createAllConnections) {
                 this.createAllConnections(true);
             }
         }
     }
    
    /**
     * Populates the network with the given number of nodes of each type.
     * @param  {Number} inputNum The number of input nodes to create.
     * @param  {Number} hiddenNum The number of hidden nodes to create.
     * @param  {Number} outputNum The number of output nodes to create.
     */
     Network.prototype.createNodes = function(inputNum, hiddenNum, outputNum) {
         for (var i = 0; i < inputNum; i++) {
             this.addInput();
         }
         for (var j = 0; j < hiddenNum; j++) {
             this.addHidden();
         }
         for (var k = 0; k < outputNum; k++) {
             this.addOutput();
         }
     };
    
    /**
     * @param {Number} [value] The value to set the node to [Default is 0].
     */
     Network.prototype.addInput = function(value) {
         var nodeID = "INPUT:" + this.inputs.length;
         if (value === undefined) {
             value = 0;
         }
         this.nodes[nodeID] = new Node(nodeID, value);
         this.inputs.push(nodeID);
     };
    
    /**
     * Creates a hidden node.
     */
     Network.prototype.addHidden = function() {
         var nodeID = "HIDDEN:" + this.hidden.length;
         this.nodes[nodeID] = new Node(nodeID);
         this.hidden.push(nodeID);
     };
    
    /**
     * Creates an output node.
     */
     Network.prototype.addOutput = function() {
         var nodeID = "OUTPUT:" + this.outputs.length;
         this.nodes[nodeID] = new Node(nodeID);
         this.outputs.push(nodeID);
     };
    
    /**
     * Returns the node with the given ID.
     * @param  {String} nodeID The ID of the node to return.
     * @return {Node} The node with the given ID.
     */
     Network.prototype.getNodeByID = function(nodeID) {
         return this.nodes[nodeID];
     };
    
    /**
     * Returns the node of the given type at the given index.
     * @param  {String} type  The type of node requested [Accepted arguments: "INPUT", "HIDDEN", "OUTPUT"].
     * @param  {Number} index The index of the node (from the array containing nodes of the requested type).
     * @return {Node} The node requested. Will return null if no node is found.
     */
     Network.prototype.getNode = function(type, index) {
         if (type.toUpperCase() == "INPUT") {
             return this.nodes[this.inputs[index]];
         } else 	if (type.toUpperCase() == "HIDDEN") {
             return this.nodes[this.hidden[index]];
         } else 	if (type.toUpperCase() == "OUTPUT") {
             return this.nodes[this.outputs[index]];
         }
         return null;
     };
    
    /**
     * Returns the connection with the given ID.
     * @param  {String} connectionID The ID of the connection to return.
     * @return {Connection} The connection with the given ID.
     */
     Network.prototype.getConnection = function(connectionID) {
         return this.connections[connectionID];
     };
    
    /**
     * Calculates the values of the nodes in the neural network.
     */
     Network.prototype.calculate = function calculate() {
         this.updateNodeConnections();
         for (var i = 0; i < this.hidden.length; i++) {
             this.calculateNodeValue(this.hidden[i]);
         }
         for (var j = 0; j < this.outputs.length; j++) {
             this.calculateNodeValue(this.outputs[j]);
         }
     };
    
    /**
     * Updates the node's to reference the current connections.
     */
     Network.prototype.updateNodeConnections = function() {
         for (var nodeKey in this.nodes) {
             this.nodes[nodeKey].incomingConnections = [];
             this.nodes[nodeKey].outgoingConnections = [];
         }
         for (var connectionKey in this.connections) {
             this.nodes[this.connections[connectionKey].in].outgoingConnections.push(connectionKey);
             this.nodes[this.connections[connectionKey].out].incomingConnections.push(connectionKey);
         }
     };
    
    /**
     * Calculates and updates the value of the node with the given ID. Node values are computed using a sigmoid function.
     * @param  {String} nodeId The ID of the node to update.
     */
     Network.prototype.calculateNodeValue = function(nodeID) {
         var sum = 0;
         for (var incomingIndex = 0; incomingIndex < this.nodes[nodeID].incomingConnections.length; incomingIndex++) {
             var connection = this.connections[this.nodes[nodeID].incomingConnections[incomingIndex]];
             sum += this.nodes[connection.in].value * connection.weight;
         }
         this.nodes[nodeID].value = sigmoid(sum);
     };
    
    /**
     * Creates a connection with the given values.
     * @param {String} inID The ID of the node that the connection comes from. 
     * @param {String} outID The ID of the node that the connection enters.
     * @param {Number} [weight] The weight of the connection [Default is 1].
     */
     Network.prototype.addConnection = function(inID, outID, weight) {
         if (weight === undefined) {
             weight = 1;
         }
         this.connections[inID + ":" + outID] = new Connection(inID, outID, weight);
     };
    
     /**
     * Creates all possible connections between nodes, not including connections to the bias node.
     * @param  {Boolean} randomWeights Whether to choose a random weight between -1 and 1, or to default to 1.
     */
     Network.prototype.createAllConnections = function(randomWeights) {
         if (randomWeights === undefined) {
             randomWeights = false;
         }
         var weight = 1;
         for (var i = 0; i < this.inputs.length; i++) {
             for (var j = 0; j < this.hidden.length; j++) {
                 if (randomWeights) {
                     weight = Math.random() * 4 - 2;
                 }
                 this.addConnection(this.inputs[i], this.hidden[j], weight);
             }
             if (randomWeights) {
                 weight = Math.random() * 4 - 2;
             }
             this.addConnection("BIAS", this.inputs[i], weight);
         }
         for (var k = 0; k < this.hidden.length; k++) {
             for (var l = 0; l < this.outputs.length; l++) {
                 if (randomWeights) {
                     weight = Math.random() * 4 - 2;
                 }
                 this.addConnection(this.hidden[k], this.outputs[l], weight);
             }
             if (randomWeights) {
                 weight = Math.random() * 4 - 2;
             }
             this.addConnection("BIAS", this.hidden[k], weight);
         }
     };
    
    /**
     * Sets the value of the node with the given ID to the given value.
     * @param {String} nodeID The ID of the node to modify.
     * @param {Number} value The value to set the node to.
     */
     Network.prototype.setNodeValue = function(nodeID, value) {
         this.nodes[nodeID].value = value;
     };
    
    /**
     * Sets the values of the input neurons to the given values.
     * @param {Array} array An array of values to set the input node values to.
     */
     Network.prototype.setInputs = function(array) {
         for (var i = 0; i < array.length; i++) {
             this.nodes[this.inputs[i]].value = array[i];
         }
     };
    
    /**
     * Sets the value of multiple nodes, given an object with node ID's as parameters and node values as values.
     * @param {Object} valuesByID The values to set the nodes to.
     */
     Network.prototype.setMultipleNodeValues = function(valuesByID) {
         for (var key in valuesByID) {
             this.nodes[key].value = valuesByID[key];
         }
     };
    
    
    /**
     * A visualization of the neural network, showing all connections and nodes.
     * @param {Object} config The configuration to use.
     */
     function NetworkVisualizer(config) {
         this.canvas = "NetworkVisualizer";
         this.backgroundColor = "#FFFFFF";
         this.nodeRadius = -1;
         this.nodeColor = "grey";
         this.positiveConnectionColor = "green";
         this.negativeConnectionColor = "red";
         this.connectionStrokeModifier = 1;
         if (config !== undefined) {
             if (config.canvas !== undefined) {
                 this.canvas = config.canvas;
             }
             if (config.backgroundColor !== undefined) {
                 this.backgroundColor = config.backgroundColor;
             }
             if (config.nodeRadius !== undefined) {
                 this.nodeRadius = config.nodeRadius;
             }
             if (config.nodeColor !== undefined) {
                 this.nodeColor = config.nodeColor;
             }
             if (config.positiveConnectionColor !== undefined) {
                 this.positiveConnectionColor = config.positiveConnectionColor;
             }
             if (config.negativeConnectionColor !== undefined) {
                 this.negativeConnectionColor = config.negativeConnectionColor;
             }
             if (config.connectionStrokeModifier !== undefined) {
                 this.connectionStrokeModifier = config.connectionStrokeModifier;
             }
         }
     }
    
    /**
     * Draws the visualized network upon the canvas.
     * @param  {Network} network The network to visualize.
     */
     NetworkVisualizer.prototype.drawNetwork = function(network) {
         var canv = document.getElementById(this.canvas); 
         var ctx = canv.getContext("2d");
         var radius;
         ctx.fillStyle = this.backgroundColor;
         ctx.fillRect(0, 0, canv.width, canv.height);
         if (this.nodeRadius != -1) {
             radius = this.nodeRadius;
         } else {
             radius = Math.min(canv.width, canv.height) / (Math.max(network.inputs.length, network.hidden.length, network.outputs.length, 3)) / 2.5;
         }
         var nodeLocations = {};
         var inputX = canv.width / 5;
         for (var inputIndex = 0; inputIndex < network.inputs.length; inputIndex++) {
             nodeLocations[network.inputs[inputIndex]] = {x: inputX, y: canv.height / (network.inputs.length) * (inputIndex + 0.5)};
         }
         var hiddenX = canv.width / 2;
         for (var hiddenIndex = 0; hiddenIndex < network.hidden.length; hiddenIndex++) {
             nodeLocations[network.hidden[hiddenIndex]] = {x: hiddenX, y: canv.height / (network.hidden.length) * (hiddenIndex + 0.5)};
         }
         var outputX = canv.width / 5 * 4;
         for (var outputIndex = 0; outputIndex < network.outputs.length; outputIndex++) {
             nodeLocations[network.outputs[outputIndex]] = {x: outputX, y: canv.height / (network.outputs.length) * (outputIndex + 0.5)};
         }
         nodeLocations.BIAS = {x: canv.width / 3, y: radius / 2};
         for (var connectionKey in network.connections) {
             var connection = network.connections[connectionKey];
             //if (connection.in != "BIAS" && connection.out != "BIAS") {
                 ctx.beginPath();
                 ctx.moveTo(nodeLocations[connection.in].x, nodeLocations[connection.in].y);
                 ctx.lineTo(nodeLocations[connection.out].x, nodeLocations[connection.out].y);
                 if (connection.weight > 0) {
                     ctx.strokeStyle = this.positiveConnectionColor;
                 } else {
                     ctx.strokeStyle = this.negativeConnectionColor;
                 }
                 ctx.lineWidth = connection.weight * this.connectionStrokeModifier;
                 ctx.lineCap = "round";
                 ctx.stroke();
             //}
         }
         for (var nodeKey in nodeLocations) {
             var node = network.getNodeByID(nodeKey);
             ctx.beginPath();
             if (nodeKey == "BIAS") {
                 ctx.arc(nodeLocations[nodeKey].x, nodeLocations[nodeKey].y, radius / 2.2, 0, 2 * Math.PI);
             } else {
                 ctx.arc(nodeLocations[nodeKey].x, nodeLocations[nodeKey].y, radius, 0, 2 * Math.PI);
             }
             ctx.fillStyle = this.backgroundColor;
             ctx.fill();
             ctx.strokeStyle = this.nodeColor;
             ctx.lineWidth = 3;
             ctx.stroke();
             ctx.globalAlpha = node.value;
             ctx.fillStyle = this.nodeColor;
             ctx.fill();
             ctx.globalAlpha = 1; 	
         }
     };
    
    
     BackpropNetwork.prototype = new Network();
     BackpropNetwork.prototype.constructor = BackpropNetwork;
    
    /**
     * Neural network that is optimized via backpropagation.
     * @param {Object} config The configuration to use.
     */
     function BackpropNetwork(config) {
         Network.call(this, config);
         this.inputData = {};
         this.targetData = {};
         this.learningRate = 0.5;
         this.step = 0;
         this.totalErrorSum = 0;
         this.averageError = [];
    
         if (config !== undefined) {
             if (config.learningRate !== undefined) {
                 this.learningRate = config.learningRate;
             }
             if (config.inputData !== undefined) {
                 this.setInputData(config.inputData);
             }
             if (config.targetData !== undefined) {
                 this.setTargetData(config.targetData);
             }
         }
     }
    
    /**
     * Backpropagates the neural network, using the input and training data given. Currently does not affect connections to the bias node.
     */
     BackpropNetwork.prototype.backpropagate = function() {
         this.step++;
         if (this.inputData[this.step] === undefined) {
             this.averageError.push(this.totalErrorSum / this.step);
             this.totalErrorSum = 0;
             this.step = 0;
         }
         for (var inputKey in this.inputData[this.step]) {
             this.nodes[inputKey].value = this.inputData[this.step][inputKey];
         }
         this.calculate();
         var currentTargetData = this.targetData[this.step];
         var totalError = this.getTotalError();
         this.totalErrorSum += totalError;
         var newWeights = {};
         for (var i = 0; i < this.outputs.length; i++) {
             var outputNode = this.nodes[this.outputs[i]];
             for (var j = 0; j < outputNode.incomingConnections.length; j++) {
                 var hiddenToOutput = this.connections[outputNode.incomingConnections[j]];
                 var deltaRuleResult = -(currentTargetData[this.outputs[i]] - outputNode.value) * outputNode.value * (1 - outputNode.value) * this.nodes[hiddenToOutput.in].value;
                 newWeights[hiddenToOutput.id] = hiddenToOutput.weight - this.learningRate * deltaRuleResult;
             }
         }
         for (var k = 0; k < this.hidden.length; k++) {
             var hiddenNode = this.nodes[this.hidden[k]];
             for (var l = 0; l < hiddenNode.incomingConnections.length; l++) {
                 var inputToHidden = this.connections[hiddenNode.incomingConnections[l]];
                 var total = 0;
                 for (var m = 0; m < hiddenNode.outgoingConnections.length; m++) {
                     var outgoing = this.connections[hiddenNode.outgoingConnections[m]];
                     var outgoingNode = this.nodes[outgoing.out];
                     total += ((-(currentTargetData[outgoing.out] - outgoingNode.value)) * (outgoingNode.value * (1 - outgoingNode.value))) * outgoing.weight;
                 }
                 var outOverNet = hiddenNode.value * (1 - hiddenNode.value);
                 var netOverWeight = this.nodes[inputToHidden.in].value;
                 var result = total * outOverNet * netOverWeight;
                 newWeights[inputToHidden.id] = inputToHidden.weight - this.learningRate * result;
             }
         }
         for (var key in newWeights) {
             this.connections[key].weight = newWeights[key];
         }
     };
    
    /**
     * Adds a target result to the target data. This will be compared to the output in order to determine error.
     * @param {String} outputNodeID The ID of the output node whose value will be compared to the target.
     * @param {Number} target The value to compare against the output when checking for errors.
     */
     BackpropNetwork.prototype.addTarget = function(outputNodeID, target) {
         this.targetData[outputNodeID] = target;
     };
    
    /**
     * Sets the input data that will be compared to the target data.
     * @param {Array} array An array containing the data to be inputted (ex. [0, 1] will set the first input node
     * to have a value of 0 and the second to have a value of 1). Each array argument represents a single
     * step, and will be compared against the parallel set in the target data.
     */
     BackpropNetwork.prototype.setInputData = function() {
         var all = arguments;
         if (arguments.length == 1 && arguments[0].constructor == Array) {
             all = arguments[0];
         } 
         this.inputData = {};
         for (var i = 0; i < all.length; i++) {
             var data = all[i];
             var instance = {};
             for (var j = 0; j < data.length; j++) {
                 instance["INPUT:" + j] = data[j]; 
             }
             this.inputData[i] = instance;
         }
     };
    
    /**
     * Sets the target data that will be used to check for total error.
     * @param {Array} array An array containing the data to be compared against (ex. [0, 1] will compare the first
     * output node against 0 and the second against 1). Each array argument represents a single step.
     */
     BackpropNetwork.prototype.setTargetData = function() {
         var all = arguments;
         if (arguments.length == 1 && arguments[0].constructor == Array) {
             all = arguments[0];
         } 
         this.targetData = {};
         for (var i = 0; i < all.length; i++) {
             var data = all[i];
             var instance = {};
             for (var j = 0; j < data.length; j++) {
                 instance["OUTPUT:" + j] = data[j]; 
             }
             this.targetData[i] = instance;
         }
     };
    
    /**
     * Calculates the total error of all the outputs' values compared to the target data.
     * @return {Number} The total error.
     */
     BackpropNetwork.prototype.getTotalError = function() {
         var sum = 0;
         for (var i = 0; i < this.outputs.length; i++) {
             sum += Math.pow(this.targetData[this.step][this.outputs[i]] - this.nodes[this.outputs[i]].value, 2) / 2;
         }
         return sum;
     };
    
    /**
     * A gene containing the data for a single connection in the neural network.
     * @param {String} inID       The ID of the incoming node.
     * @param {String} outID      The ID of the outgoing node.
     * @param {Number} weight     The weight of the connection to create.
     * @param {Number} innovation The innovation number of the gene.
     * @param {Boolean} enabled   Whether the gene is expressed or not.
     */	
     function Gene(inID, outID, weight, innovation, enabled) {
         if (innovation === undefined) {
             innovation = 0;
         }
         this.innovation = innovation;
         this.in = inID;
         this.out = outID;
         if (weight === undefined) {
             weight = 1;
         }
         this.weight = weight;
         if (enabled === undefined) {
             enabled = true;
         }
         this.enabled = enabled;
     }
    
    /**
     * Returns the connection that the gene represents.
     * @return {Connection} The generated connection.
     */
     Gene.prototype.getConnection = function() {
         return new Connection(this.in, this.out, this.weight);
     };
    
    /**
     * A genome containing genes that will make up the neural network.
     * @param {Number} inputNodes  The number of input nodes to create.
     * @param {Number} outputNodes The number of output nodes to create.
     */
     function Genome(inputNodes, outputNodes) {
         this.inputNodes = inputNodes;
         this.outputNodes = outputNodes;
         this.genes = [];
         this.fitness = -Number.MAX_VALUE;
         this.globalRank = 0;
         this.randomIdentifier = Math.random();
     }
    
     Genome.prototype.containsGene = function(inID, outID) {
         for (var i = 0; i < this.genes.length; i++) {
             if (this.genes[i].inID == inID && this.genes[i].outID == outID) {
                 return true;
             }
         }
         return false;
     };
    
    /**
     * A species of genomes that contains genomes which closely resemble one another, enough so that they are able to breed.
     */
     function Species() {
         this.genomes = [];
         this.averageFitness = 0;
     }
    
    /**
     * Culls the genomes to the given amount by removing less fit genomes.
     * @param  {Number} [remaining] The number of genomes to cull to [Default is half the size of the species (rounded up)].
     */
     Species.prototype.cull = function(remaining) {
         this.genomes.sort(compareGenomesDescending);
         if (remaining === undefined) {
             remaining = Math.ceil(this.genomes.length / 2);
         }
         while (this.genomes.length > remaining) {
             this.genomes.pop();
         }
     };
    
    /**
     * Calculates the average fitness of the species.
     */
     Species.prototype.calculateAverageFitness = function() {
         var sum = 0;
         for (var j = 0; j < this.genomes.length; j++) {
             sum += this.genomes[j].fitness;
         }
         this.averageFitness = sum / this.genomes.length;
     };
    
    /**
     * Returns the network that the genome represents.
     * @return {Network} The generated network.
     */
     Genome.prototype.getNetwork = function() {
         var network = new Network();
         network.createNodes(this.inputNodes, 0, this.outputNodes);
         for (var i = 0; i < this.genes.length; i++) {
             var gene = this.genes[i];
             if (gene.enabled) {
                 if (network.nodes[gene.in] === undefined && gene.in.indexOf("HIDDEN") != -1) {
                     network.nodes[gene.in] = new Node(gene.in);
                     network.hidden.push(gene.in);
                 }
                 if (network.nodes[gene.out] === undefined && gene.out.indexOf("HIDDEN") != -1) {
                     network.nodes[gene.out] = new Node(gene.out);
                     network.hidden.push(gene.out);
                 }
                 network.addConnection(gene.in, gene.out, gene.weight);
             }
         }
         return network;
     };
    
    /**
     * Creates and optimizes neural networks via neuroevolution, using the Neuroevolution of Augmenting Topologies method.
     * @param {Object} config The configuration to use.
     */
     function Neuroevolution(config) {
         this.genomes = [];
         this.populationSize = 100;
         this.mutationRates = {
             createConnection: 0.05,
             createNode: 0.02,
             modifyWeight: 0.15,
             enableGene: 0.05,
             disableGene: 0.1,
             createBias: 0.1,
             weightMutationStep: 2
         };
         this.inputNodes = 0;
         this.outputNodes = 0;
         this.elitism = true;
         this.deltaDisjoint = 2;
         this.deltaWeights = 0.4;
         this.deltaThreshold = 2;
         this.hiddenNodeCap = 10;
         this.fitnessFunction = function (network) {log("ERROR: Fitness function not set"); return -1;};
         this.globalInnovationCounter = 1;
         this.currentGeneration = 0;
         this.species = [];
         this.newInnovations = {};
         if (config !== undefined) {
             if (config.populationSize !== undefined) {
                 this.populationSize = config.populationSize;
             }
             if (config.inputNodes !== undefined) {
                 this.inputNodes = config.inputNodes;
             }
             if (config.outputNodes !== undefined) {
                 this.outputNodes = config.outputNodes;
             }
             if (config.mutationRates !== undefined) {
                 var configRates = config.mutationRates;
                 if (configRates.createConnection !== undefined) {
                     this.mutationRates.createConnection = configRates.createConnection;
                 }
                 if (configRates.createNode !== undefined) {
                     this.mutationRates.createNode = configRates.createNode;
                 }
                 if (configRates.modifyWeight !== undefined) {
                     this.mutationRates.modifyWeight = configRates.modifyWeight;
                 }
                 if (configRates.enableGene !== undefined) {
                     this.mutationRates.enableGene = configRates.enableGene;
                 }
                 if (configRates.disableGene !== undefined) {
                     this.mutationRates.disableGene = configRates.disableGene;
                 }
                 if (configRates.createBias !== undefined) {
                     this.mutationRates.createBias = configRates.createBias;
                 }
                 if (configRates.weightMutationStep !== undefined) {
                     this.mutationRates.weightMutationStep = configRates.weightMutationStep;
                 }
             }
             if (config.elitism !== undefined) {
                 this.elitism = config.elitism;
             }
             if (config.deltaDisjoint !== undefined) {
                 this.deltaDisjoint = config.deltaDisjoint;
             }
             if (config.deltaWeights !== undefined) {
                 this.deltaWeights = config.deltaWeights;
             }
             if (config.deltaThreshold !== undefined) {
                 this.deltaThreshold = config.deltaThreshold;
             }
             if (config.hiddenNodeCap !== undefined) {
                 this.hiddenNodeCap = config.hiddenNodeCap;
             }
         }
     }
    
    /**
     * Populates the population with empty genomes, and then mutates the genomes.
     */
     Neuroevolution.prototype.createInitialPopulation = function() {
         this.genomes = [];
         for (var i = 0; i < this.populationSize; i++) {
             var genome = this.linkMutate(new Genome(this.inputNodes, this.outputNodes));
             this.genomes.push(genome);
         }
         this.mutate();
     };
    
    /**
     * Mutates the entire population based on the mutation rates.
     */
     Neuroevolution.prototype.mutate = function() {
         for (var i = 0; i < this.genomes.length; i++) {
             var network = this.genomes[i].getNetwork();
             if (Math.random() < this.mutationRates.createConnection) {
                 this.genomes[i] = this.linkMutate(this.genomes[i]);
             }
             if (Math.random() < this.mutationRates.createNode && this.genomes[i].genes.length > 0 && network.hidden.length < this.hiddenNodeCap) {
                 var geneIndex = randomNumBetween(0, this.genomes[i].genes.length - 1);
                 var gene = this.genomes[i].genes[geneIndex];
                 if (gene.enabled && gene.in.indexOf("INPUT") != -1 && gene.out.indexOf("OUTPUT") != -1) {
                     var newNum = -1;
                     var found = true;
                     while (found) {
                         newNum++;
                         found = false;
                         for (var j = 0; j < this.genomes[i].genes.length; j++) {
                             if (this.genomes[i].genes[j].in.indexOf("HIDDEN:" + newNum) != -1 || this.genomes[i].genes[j].out.indexOf("HIDDEN:" + newNum) != -1) {
                                 found = true;
                             }
                         }
                     }
                     if (newNum < this.hiddenNodeCap) {
                         var nodeName = "HIDDEN:" + newNum;
                         this.genomes[i].genes[geneIndex].enabled = false;
                         this.genomes[i].genes.push(new Gene(gene.in, nodeName, 1, this.globalInnovationCounter));
                         this.globalInnovationCounter++;
                         this.genomes[i].genes.push(new Gene(nodeName, gene.out, gene.weight, this.globalInnovationCounter));
                         this.globalInnovationCounter++;
                         network = this.genomes[i].getNetwork();
                     }
                 }
             }
             if (Math.random() < this.mutationRates.createBias) {
                 if (Math.random() > 0.5 && network.inputs.length > 0) {
                     var inputIndex = randomNumBetween(0, network.inputs.length - 1);
                     if (network.getConnection("BIAS:" + network.inputs[inputIndex]) === undefined) {
                         this.genomes[i].genes.push(new Gene("BIAS", network.inputs[inputIndex]));
                     }
                 } else if (network.hidden.length > 0) {
                     var hiddenIndex = randomNumBetween(0, network.hidden.length - 1);
                     if (network.getConnection("BIAS:" + network.hidden[hiddenIndex]) === undefined) {
                         this.genomes[i].genes.push(new Gene("BIAS", network.hidden[hiddenIndex]));
                     }
                 }
             }
             for (var k = 0; k < this.genomes[i].genes.length; k++) {
                 this.genomes[i].genes[k] = this.pointMutate(this.genomes[i].genes[k]);
             }
    
         }
     };
    
    /**
     * Attempts to create a new connection gene in the given genome.
     * @param  {Genome} genome The genome to mutate.
     * @return {Genome} The mutated genome.
     */
     Neuroevolution.prototype.linkMutate = function(genome) {
         var network = genome.getNetwork();
         var inNode = "";
         var outNode = "";
         if (Math.random() < 1/3 || network.hidden.length <= 0) {
             inNode = network.inputs[randomNumBetween(0, this.inputNodes - 1)];
             outNode = network.outputs[randomNumBetween(0, this.outputNodes - 1)];
         } else if (Math.random() < 2/3) {
             inNode = network.inputs[randomNumBetween(0, this.inputNodes - 1)];
             outNode = network.hidden[randomNumBetween(0, network.hidden.length - 1)];
         } else {
             inNode = network.hidden[randomNumBetween(0, network.hidden.length - 1)];
             outNode = network.outputs[randomNumBetween(0, this.outputNodes - 1)];
         }
         if (!genome.containsGene(inNode, outNode)) {
             var newGene = new Gene(inNode, outNode, Math.random() * 2 - 1);
             if (this.newInnovations[newGene.in + ":" + newGene.out] === undefined) {
                 this.newInnovations[newGene.in + ":" + newGene.out] = this.globalInnovationCounter;
                 newGene.innovation = this.globalInnovationCounter;
                 this.globalInnovationCounter++;
             } else {
                 newGene.innovation = this.newInnovations[newGene.in + ":" + newGene.out];
             }
             genome.genes.push(newGene);
         }
         return genome;
     };
    
     /**
     * Mutates the given gene based on the mutation rates.
     * @param  {Gene} gene The gene to mutate.
     * @return {Gene} The mutated gene.
     */
     Neuroevolution.prototype.pointMutate = function(gene) {
         if (Math.random() < this.mutationRates.modifyWeight) {
             gene.weight = gene.weight + Math.random() * this.mutationRates.weightMutationStep * 2 - this.mutationRates.weightMutationStep; 
         }
         if (Math.random() < this.mutationRates.enableGene) {
             gene.enabled = true;
         }
         if (Math.random() < this.mutationRates.disableGene) {
             gene.enabled = false;
         }
         return gene;
     };
    
    /**
     * Crosses two parent genomes with one another, forming a child genome.
     * @param  {Genome} firstGenome  The first genome to mate.
     * @param  {Genome} secondGenome The second genome to mate.
     * @return {Genome} The resultant child genome.
     */
     Neuroevolution.prototype.crossover = function(firstGenome, secondGenome) {
         var child = new Genome(firstGenome.inputNodes, firstGenome.outputNodes);
         var firstInnovationNumbers = {};
         for (var h = 0; h < firstGenome.genes.length; h++) {
             firstInnovationNumbers[firstGenome.genes[h].innovation] = h;
         }
         var secondInnovationNumbers = {};
         for (var j = 0; j < secondGenome.genes.length; j++) {
             secondInnovationNumbers[secondGenome.genes[j].innovation] = j;
         }
         for (var i = 0; i < firstGenome.genes.length; i++) {
             var geneToClone;
             if (secondInnovationNumbers[firstGenome.genes[i].innovation] !== undefined) {
                 if (Math.random() < 0.5) {
                     geneToClone = firstGenome.genes[i];
                 } else {
                     geneToClone = secondGenome.genes[secondInnovationNumbers[firstGenome.genes[i].innovation]];
                 }
             } else {
                 geneToClone = firstGenome.genes[i];
             }
             child.genes.push(new Gene(geneToClone.in, geneToClone.out, geneToClone.weight, geneToClone.innovation, geneToClone.enabled)); 		
         }
         for (var k = 0; k < secondGenome.genes.length; k++) {
             if (firstInnovationNumbers[secondGenome.genes[k].innovation] === undefined) {
                 var secondDisjoint = secondGenome.genes[k];
                 child.genes.push(new Gene(secondDisjoint.in, secondDisjoint.out, secondDisjoint.weight, secondDisjoint.innovation, secondDisjoint.enabled)); 		
             }
         }
         return child;
     };
    
    /**
     * Evolves the population by creating a new generation and mutating the children.
     */
     Neuroevolution.prototype.evolve = function() {
         this.currentGeneration++;
         this.newInnovations = {};
         this.genomes.sort(compareGenomesDescending);
         var children = [];
         this.speciate();
         this.cullSpecies();
         this.calculateSpeciesAvgFitness();
    
         var totalAvgFitness = 0;
         var avgFitnesses = [];
         for (var s = 0; s < this.species.length; s++) {
             totalAvgFitness += this.species[s].averageFitness;
             avgFitnesses.push(this.species[s].averageFitness);
         }
         var arr = [];
         for (var j = 0; j < this.species.length; j++) {
             var childrenToMake = Math.floor(this.species[j].averageFitness / totalAvgFitness * this.populationSize);
             arr.push(childrenToMake);
             if (childrenToMake > 0) {
                 children.push(this.species[j].genomes[0]);
             }
             for (var c = 0; c < childrenToMake - 1; c++) {
                 children.push(this.makeBaby(this.species[j]));
             }
         }
         while (children.length < this.populationSize) {
             children.push(this.makeBaby(this.species[randomNumBetween(0, this.species.length - 1)]));
         }
         this.genomes = [];
         this.genomes = this.genomes.concat(children);
         this.mutate();
         this.speciate();
         log(this.species.length);
     };
    
    /**
     * Sorts the genomes into different species.
     */
     Neuroevolution.prototype.speciate = function() {
         this.species = [];
         for (var i = 0; i < this.genomes.length; i++) {
             var placed = false;
             for (var j = 0; j < this.species.length; j++) {
                 if (!placed && this.species[j].genomes.length > 0 && this.isSameSpecies(this.genomes[i], this.species[j].genomes[0])) {
                     this.species[j].genomes.push(this.genomes[i]);
                     placed = true;
                 }
             }
             if (!placed) {
                 var newSpecies = new Species();
                 newSpecies.genomes.push(this.genomes[i]);
                 this.species.push(newSpecies);
             }
         }
     };
    
    /**
     * Culls all the species to the given amount by removing less fit members of each species.
     * @param  {Number} [remaining] The number of genomes to cull all the species to [Default is half the size of the species].
     */
     Neuroevolution.prototype.cullSpecies = function(remaining) {
         var toRemove = [];
         for (var i = 0; i < this.species.length; i++) {
             this.species[i].cull(remaining);
             if (this.species[i].genomes.length < 1) {
                 toRemove.push(this.species[i]);
             }
         }
         for (var r = 0; r < toRemove.length; r++) {
             this.species.remove(toRemove[r]);
         }
     };
    
    /**
     * Calculates the average fitness of all the species.
     */
     Neuroevolution.prototype.calculateSpeciesAvgFitness = function() {
         for (var i = 0; i < this.species.length; i++) {
             this.species[i].calculateAverageFitness();
         }
     };
    
    /**
     * Creates a baby in the given species, with fitter genomes having a higher chance to reproduce.
     * @param  {Species} species The species to create a baby in.
     * @return {Genome} The resultant baby.
     */
     Neuroevolution.prototype.makeBaby = function(species) {
         var mum = species.genomes[randomWeightedNumBetween(0, species.genomes.length - 1)];
         var dad = species.genomes[randomWeightedNumBetween(0, species.genomes.length - 1)];
         return this.crossover(mum, dad);
     };
    
    /**
     * Calculates the fitness of all the genomes in the population.
     */
     Neuroevolution.prototype.calculateFitnesses = function() {
         for (var i = 0; i < this.genomes.length; i++) {
             this.genomes[i].fitness = this.fitnessFunction(this.genomes[i].getNetwork());
         }
     };
    
    /**
     * Returns the relative compatibility metric for the given genomes.
     * @param  {Genome} genomeA The first genome to compare.
     * @param  {Genome} genomeB The second genome to compare.
     * @return {Number} The relative compatibility metric. 
     */
     Neuroevolution.prototype.getCompatibility = function(genomeA, genomeB) {
         var disjoint = 0;
         var totalWeight = 0;
         var aInnovationNums = {};
         for (var i = 0; i < genomeA.genes.length; i++) {
             aInnovationNums[genomeA.genes[i].innovation] = i;
         }
         var bInnovationNums = [];
         for (var j = 0; j < genomeB.genes.length; j++) {
             bInnovationNums[genomeB.genes[j].innovation] = j;
         }
         for (var k = 0; k < genomeA.genes.length; k++) {
             if (bInnovationNums[genomeA.genes[k].innovation] === undefined) {
                 disjoint++;
             } else {
                 totalWeight += Math.abs(genomeA.genes[k].weight - genomeB.genes[bInnovationNums[genomeA.genes[k].innovation]].weight);
             }
         }
         for (var l = 0; l < genomeB.genes.length; l++) {
             if (aInnovationNums[genomeB.genes[l].innovation] === undefined) {
                 disjoint++;
             }
         }
         var n = Math.max(genomeA.genes.length, genomeB.genes.length);
         return this.deltaDisjoint * (disjoint / n) + this.deltaWeights * (totalWeight / n);
     };
    
    /**
     * Determines whether the given genomes are from the same species.
     * @param  {Genome}  genomeA The first genome to compare.
     * @param  {Genome}  genomeB The second genome to compare.
     * @return {Boolean} Whether the given genomes are from the same species.
     */
     Neuroevolution.prototype.isSameSpecies = function(genomeA, genomeB) {
         return this.getCompatibility(genomeA, genomeB) < this.deltaThreshold;
     };
    
    /**
     * Returns the genome with the highest fitness in the population.
     * @return {Genome} The elite genome.
     */
     Neuroevolution.prototype.getElite = function() {
         this.genomes.sort(compareGenomesDescending);
         return this.genomes[0];
     };
    
    
    //Private static functions
    function sigmoid(t) {
        return 1 / (1 + Math.exp(-t));
    }
    
    function randomNumBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    
    function randomWeightedNumBetween(min, max) {
        return Math.floor(Math.pow(Math.random(), 2) * (max - min + 1) + min);
    }
    
    function compareGenomesAscending(genomeA, genomeB) {
        return genomeA.fitness - genomeB.fitness;
    }
    
    function compareGenomesDescending(genomeA, genomeB) {
        return genomeB.fitness - genomeA.fitness;
    }
    
    Array.prototype.remove = function() {
        var what, a = arguments, L = a.length, ax;
        while (L && this.length) {
            what = a[--L];
            while ((ax = this.indexOf(what)) !== -1) {
                this.splice(ax, 1);
            }
        }
        return this;
    };
    
    
    function log(text) {
        console.log(text);
    }