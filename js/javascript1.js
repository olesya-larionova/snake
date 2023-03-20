const height = 10;
const width = 10;
const speed = 4;
//localStorage.clear();
let score = 0;
let bestScore = localStorage.getItem("bestScore");

/***********************************************************************************************************
/ класс Game принимает следующие параметры:
/ height - высота игрового поля
/ width - ширина игрового поля
/ pane - элемент страницы, в котором размещается игровое поле
/ scoreUpdater - функция, ведущая подсчет очков игры (если ей передан один, то она должна увеличивать счет)
/ dataSaver - функция, сохраняющая результаты игры, параметров требовать не должна
***********************************************************************************************************/
class Game {

    constructor(height, width, pane, scoreUpdater, dataSaver) {
        //свойства класса, они позволяют ему не зависеть от имен глобальных переменных 
        this._pane = pane;  
        this._height = height;
        this._width = width;
        this._scoreUpdater = scoreUpdater;
        this._dataSaver = dataSaver;
        this._createGameGrid(); // создание сетки игрового поля в браузере, оно не в init, так как сетка создается до запуска игрового процесса
    }

    // инициализация игровых объектов
    init() {
        this._pane.onclick = undefined; // чтобы повторные клики мышки снова не запускали игру поверх уже начатой
        this.snake = new Snake(Math.floor((this._height-1)/2), Math.floor((this._width)/2)); // создание змеюки приблизительно в центре игрового поля
        this.snake.body.forEach(cell => { this._updateCellOnPane(cell) }); // отображение змейки в игровом поле
        this._createFood();
        this.play();
    }

    // запуск процесса игры
    play() {
        this.delay = setInterval(this.updatePosition.bind(this), 1000 / speed); // пришлось долго искать про bind
    }

    // перемещение змейки с проверкой столкновений, в общем-то здесь вся логика игры
    updatePosition() {
    
        if(this.snake.isPlaying) {

            let newPosX, newPosY;
            let headCell = this.snake.body[0]; // голова змеюки
        
            // расчет новой позиции головы
            switch (this.snake.getDirection()) {
                case "Up":
                    newPosX = headCell.getX() - 1;
                    newPosY = headCell.getY();
                    break;
                case "Down":
                    newPosX = headCell.getX() + 1;
                    newPosY = headCell.getY();
                    break;
                case "Left":                                                                                                                                
                    newPosX = headCell.getX();
                    newPosY = headCell.getY() - 1;
                    break;
                case "Right":
                    newPosX = headCell.getX();
                    newPosY = headCell.getY() + 1;
                    break;
                default:
                    break;
            }
            
            if (newPosX < 0 || newPosX > this._height-1 || newPosY < 0 || newPosY > this._width-1) { // проверка на выход за пределы игрового поля
                this.gameOver();
            } else {
                let head = new Cell(newPosX, newPosY, "snake"); // новая голова
                if (this.snake.isCollided(head)) {  // проверка на столкновение змейки с собой
                    this.gameOver();
                }
                this.snake.body.unshift(head); // прикручивание к змеюке новой головы (старая перестает быть головой, поэтому многоглавой гидрой змея не становится)
                if (head.isCollided(this.food)) { // новая голова наткнулась на еду
                    this._clearCellOnPane(this.food); // убрать еду с поля, ведь она уже в пасти змеи
                    this._createFood();
                    this._scoreUpdater(true);
                } else {
                    let tail = this.snake.body.pop();  // хвостик, отрываем его от змейки, ведь змейка без еды не растет
                    this._clearCellOnPane(tail); // убрать хвостик с игрового поля
                }
                this._updateCellOnPane(head); // нарисовать на поле новую голову
            }
        } 
    }
    
    // обработка нажатий клавиш  
    processKeyEvent(evnt) {
        this.snake.processKeyEvent(evnt);
    }

    // :-(
    gameOver() {
        clearInterval(this.delay);
        this._dataSaver();
        delete this.snake; 
        delete this.food;
        this._pane.innerHTML = '<div class="gameover">Game Over!<div><div class="button"><button id="button_start">Restart game</button></div>';
        let button = document.getElementById("button_start");
        button.onclick = this._createGameGrid.bind(this);
        console.log("Game Over!");
    }

    // создание еды на свободном месте поля
    _createFood() {
        do {
            this.food = new Food(this._height, this._width); // попытка создания новой еды
        } while (this.snake.isCollided(this.food)); // повторять, если еда оказывается в змейке
        this._updateCellOnPane(this.food);
    }

    // создание игровой сетки
    _createGameGrid() {
        this._pane.innerHTML = "";
        for(let x = 0; x < height; x++){
            for(let y = 0; y < width; y++) {
                this._createCellOnPane(new Cell(x,y, "cell")); // создание одной ячейки
            }
        }
        this._scoreUpdater(false);
        this._pane.onclick = this.init.bind(this); // без bind как-то ненормально себя ведет
    }

    // создание одной ячейки
    _createCellOnPane(cell) {
        let div = document.createElement("div");
        div.classList.add(cell.getCssClassName());
        div.style.width = `calc(${100/width}% - 2px)`; // перерасчет стиля по умолчанию
        div.style.paddingBottom = `calc(${100/height}% - 2px)`; // перерасчет стиля по умолчанию
        div.setAttribute("data-x", cell.getX()); // и что потом с этим делать?
        div.setAttribute("data-y", cell.getY());
        this._pane.appendChild(div);
    }

    // добавление css-класса к ячейке
    _updateCellOnPane(cell) {
        let div = this._pane.children[ cell.getX() * this._height + cell.getY() ];
        div.classList.add(cell.getCssClassName());
    }

    // уборка css-класса из ячейки
    _clearCellOnPane(cell) {
        let div = this._pane.children[ cell.getX() * this._height + cell.getY() ];
        div.classList.remove(cell.getCssClassName());
    }

}

class Cell {
    
    constructor(x, y, cssClassName) {
        this._x = x;
        this._y = y;
        this._cssClassName = cssClassName;
    }

    setCssClassName(cssClassName) {
        this._cssClassName = cssClassName;
    }

    getCssClassName() {
        return this._cssClassName;
    }

    getX() {
        return this._x;
    }

    getY() {this.snake
        return this._y;
    }

    isCollided(cell) {
        return this._x === cell.getX() && this._y === cell.getY();
    }    
}

class Snake {
    constructor(x,y) {
        this.body = new Array();
        this.body.push(new Cell(x, y, "snake")); //голова
        this.body.push(new Cell(x, y-1, "snake")); //хвост
        this.direction = "Right"; //направление
        this.isPlaying = true;
        this.initKeysProcessor();
    }

    initKeysProcessor() {
        // 37 - left, 38 - up, 39 - right, 40 - down
        this.dirs = new Map();
        this.dirs.set(37, () => { if(this.isPlaying && this.direction != "Right") {this.direction = "Left"} });
        this.dirs.set(38, () => { if(this.isPlaying && this.direction != "Down") {this.direction = "Up"} });
        this.dirs.set(39, () => { if(this.isPlaying && this.direction != "Left") {this.direction = "Right"} });
        this.dirs.set(40, () => { if(this.isPlaying && this.direction != "Up") {this.direction = "Down"} });
        this.dirs.set(13, () => { this.isPlaying = !this.isPlaying }); // просто добавлено, чтобы можно было сделать паузу в игре, мало ли зачем

    }

    isCollided(cell) {
        return this.body.some((part) => part.isCollided(cell)); // истина, если хотя бы один из элементов имеет те же координаты, что и проверяемая ячейка
    }

    getDirection() {
        return this.direction;
    }

    processKeyEvent(evnt) {
        const f = this.dirs.get(evnt.keyCode);
        f == undefined || f();
    }

}

class Food extends Cell {
    constructor(height, width) {
        super(Math.floor(Math.random() * height), Math.floor(Math.random() * width), "food");
    }
}

function keyPress(evnt) {
    evnt.preventDefault();
    game.processKeyEvent(evnt);
}   

function saveData() {
    if (bestScore == undefined || score > bestScore) {
        bestScore = score;
        localStorage.setItem("bestScore", score);
    }
    updateScore(false);
    score = 0;
} 

const updateScore = function(increase) {
    if (increase) {
        score++;
    }
    document.getElementById("score").innerHTML = `Score: ${score}`;
    if (bestScore) {
        document.getElementById("bestscore").innerHTML = `Best: ${bestScore}`;
    }
}

updateScore();
game = new Game(height, width, document.getElementById("pane"), updateScore, saveData);
document.onkeydown = keyPress;
