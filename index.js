const canvas = document.querySelector('#gameCanvas');
const ctx = canvas.getContext('2d');
const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const TOKEN = "6337929088:AAEz6jGcMKmk9RcGIF1EthMk6L3FuDSlbG8";
const server = express();
const bot = new TelegramBot(TOKEN, {
    polling: true
});
const port = process.env.PORT || 5000;
const gameName = "grimario";
const queries = {};
server.use(express.static(path.join(__dirname, 'Grimario')));
bot.onText(/help/, (msg) => bot.sendMessage(msg.from.id, "Say /game if you want to play."));
bot.onText(/start|game/, (msg) => bot.sendGame(msg.from.id, gameName));
bot.on("callback_query", function (query) {
    if (query.game_short_name !== gameName) {
        bot.answerCallbackQuery(query.id, "Sorry, '" + query.game_short_name + "' is not available.");
    } else {
        queries[query.id] = query;
        let gameurl = "Ссылка на игру в гитхабе";
        bot.answerCallbackQuery({
            callback_query_id: query.id,
            url: gameurl
        });
    }
});
bot.on("inline_query", function (iq) {
    bot.answerInlineQuery(iq.id, [{
        type: "game",
        id: "0",
        game_short_name: gameName
    }]);
});
server.get("/highscore/:score", function (req, res, next) {
    if (!Object.hasOwnProperty.call(queries, req.query.id)) return next();
    let query = queries[req.query.id];
    let options;
    if (query.message) {
        options = {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
        };
    } else {
        options = {
            inline_message_id: query.inline_message_id
        };
    }
    bot.setGameScore(query.from.id, parseInt(req.params.score), options,
        function (err, result) {});
});
server.listen(port);
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

//-----------------------Get Random Number func---------------------------

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

let speedAll = 5;

//-----------------------Mario--------------------------

const mario = new Image();
let spriteIndex = 0;

const marioSprites = [
  'mario1.png',
  'mario2.png',
  'mario3.png'
];

const marioObj = {
    x: 50,
    y: canvas.height - 120,
    width: 40,
    height: 70,
    isJumping: false,
    jumpHeight: 0,
    jumpSpeed: 3,
    hp: 5,
    bullets: 5,
};


mario.src = marioSprites[spriteIndex];

function renderMario() {
    ctx.drawImage(mario, marioObj.x, marioObj.y - marioObj.jumpHeight, marioObj.width, marioObj.height);
}

function changeMarioSprite() {
    if(!marioObj.isJumping) {
        spriteIndex = (spriteIndex + 1) % marioSprites.length;
        mario.src = marioSprites[spriteIndex];
    } else {
        mario.src = 'marioJump.png';
    }
    
}

setInterval(changeMarioSprite, 100);

function marioJump() {
    if (!marioObj.isJumping) {
        marioObj.isJumping = true;
        jump();
    }
}

function jump() {
    if (marioObj.jumpHeight < 80) { // Высота прыжка
        marioObj.jumpHeight += marioObj.jumpSpeed;
        marioObj.y -= marioObj.jumpSpeed; // Обновление координаты Y
        requestAnimationFrame(jump);
    } else {
        fall();
    }
}

function fall() {
    if (marioObj.jumpHeight > 0) {
        marioObj.jumpHeight -= marioObj.jumpSpeed;
        marioObj.y += marioObj.jumpSpeed; // Обновление координаты Y
        requestAnimationFrame(fall);
    } else {
        marioObj.jumpHeight = 0;
        marioObj.isJumping = false;
    }
}

document.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Spacebar") {
        marioJump();
    }
});

//-----------------------Platform--------------------------

const platform = new Image();
platform.src = 'platform.png'

const platformObj = {
    width: 50,
    height: 50,
    array: [],
}

function createPlatform(x, y) {
    return {x, y};
}

for (let i = 0; i < canvas.width; i += platformObj.width) {
    platformObj.array.push(createPlatform(i, canvas.height - platformObj.height));
}

function movePlatfroms() {
    for (let i = 0; i < platformObj.array.length; i++) {
        platformObj.array[i].x -= speedAll;

        if (platformObj.array[i].x + platformObj.width < 0) {
            platformObj.array[i].x = canvas.width;
        }
    }
}

function renderPlatforms() {
    for (let i = 0; i < platformObj.array.length; i++) {
        ctx.drawImage(platform, platformObj.array[i].x, platformObj.array[i].y, platformObj.width, platformObj.height);
    }
}

//-----------------------HP--------------------------

let hpBar = document.querySelector('#hpBar');

const hp = new Image();
hp.src = 'hp.png';

const hpObj = {
    x: 650,
    y: 300,
    width: 50,
    height: 50,
}

function renderBonusCube() {
    ctx.drawImage(hp, hpObj.x, hpObj.y, hpObj.width, hpObj.height);
}

function moveHpObj() {
    hpObj.x -= speedAll;
    checkHpCollision(marioObj, hpObj, 1);
}

function updateHp() {
    hpBar.textContent = marioObj.hp;
}

function checMaxHp() {
    if(marioObj.hp < 5) {
        marioObj.hp++;
    }
}

function checkIsLose() {
    if(marioObj.hp === 0) {
        location.reload();
    }
}

//-----------------------Move All Func---------------------------

function checkHpCollision(player, object, hp) {
    if(player.x + player.width > object.x + 25 &&
        player.x + 25 < object.x + object.width &&
        player.y + player.height > object.y + 25 &&
        player.y + 25 < object.y + object.height) {
            object.x = getRandomInt(4000, 5000);
            checMaxHp();
        }

    if(object.x <= -50) {
        object.x = getRandomInt(4000, 5000);
    }
}

function checkEnemyCollision(player, objectsArr, hp) {
    for(let i in objectsArr) {
        if(objectsArr[i] && 
            player.x + player.width > objectsArr[i].x + 25 &&
            player.x + 25 < objectsArr[i].x + objectsArr[i].width &&
            player.y + player.height > objectsArr[i].y + 25 &&
            player.y + 25 < objectsArr[i].y + objectsArr[i].height) {
                objectsArr.splice(i, 1);
                marioObj.hp -= hp;
            }
    
        if(objectsArr[i] && objectsArr[i].x <= -50) {
            objectsArr.splice(i, 1);
        }
    }
}

//-------------------------Enemy---------------------------

const enemy = new Image();
enemy.src = 'enemy.png';

let enemyArr = [];

let enemySpawnTimer = 0;
function renderEnemy() {
    enemySpawnTimer++;
    if(enemySpawnTimer % getRandomInt(90, 180) === 0) {
        enemyArr.push({
            x: 700,
            y: 300,
            width: 50,
            height: 50,
        })
        console.log(enemyArr);
    }

    for(let i in enemyArr) {
        ctx.drawImage(enemy, enemyArr[i].x, enemyArr[i].y, enemyArr[i].width, enemyArr[i].height);
    }
}

function moveEnemy() {
    for(let i in enemyArr) {
        enemyArr[i].x -= speedAll;
    }   
    checkEnemyCollision(marioObj, enemyArr, 1);
}

//-------------------------Bullet-------------------------
const bulletsBar = document.querySelector('#bulletsBar');
const bullet = new Image();
bullet.src = 'bullet.png';

let bulletsArr = [];
document.addEventListener("keydown", (event) => {
    if(event.key === "ArrowRight" && marioObj.bullets > 0) {
        bulletsArr.push({
            x: marioObj.x,
            y: marioObj.y + marioObj.height / 2,
            width: 80,
            height: 30,
        })
        marioObj.bullets--;
    }
})

function moveBullets() {
    for(let i in bulletsArr) {
        bulletsArr[i].x += 20;
    }
}

function renderBullets() {
    for(let i in bulletsArr) {
        ctx.drawImage(bullet, bulletsArr[i].x, bulletsArr[i].y, bulletsArr[i].width, bulletsArr[i].height);
    }
}

function deleteBullets() {
    for(let i in bulletsArr) {
        if(bulletsArr[i].x >= canvas.width) {
            bulletsArr.splice(i, 1);
        }        
    }
}

function checkBulletsCollision() {
    for(let i in bulletsArr) {
        for(let k in enemyArr) {
            if(bulletsArr[i].x + bulletsArr[i].width > enemyArr[k].x
                && bulletsArr[i].y > enemyArr[k].y) {
                    enemyArr[k].x = getRandomInt(2000, 3000);
                }
        }
        
    }
}

function updateBullets() {
    bulletsBar.textContent = marioObj.bullets;

}

//-----------------------Clouds---------------------------

const cloud = new Image();
cloud.src = 'cloud.png';

let cloudsArr = [];

let timer = 0;
function renderClours() {
    timer++;
    if(timer % 150 === 0) {
        cloudsArr.push({
            x: 800,
            y: getRandomInt(10, 110),
            w: getRandomInt(50, 60),
            h: getRandomInt(30, 40),
        })
    }

    for(let i in cloudsArr) {
        ctx.drawImage(cloud, cloudsArr[i].x, cloudsArr[i].y, cloudsArr[i].w, cloudsArr[i].h);
    }
}

function cloudsMove() {
    for(let i in cloudsArr) {
        cloudsArr[i].x -= 1;
    }
}

function deleteClouds() {
    for(let i in cloudsArr) {
        if(cloudsArr[i].x <= - 50) {
            cloudsArr.splice(i, 1);
        }
    }
}

//-------------------------SCORE---------------------------

const scoreBar = document.querySelector('#scoreBar');
let score = 0;

function updateScore() {
    score++;
    scoreBar.textContent = score;
}

setInterval(updateScore, 1000);

//-------------------------GAME---------------------------

function game() {
  update();
  render();
  requestAnimationFrame(game);
}

function update() {
    movePlatfroms();
    moveHpObj();
    cloudsMove();
    deleteClouds();
    updateHp();
    moveEnemy();
    moveBullets();
    deleteBullets();
    checkBulletsCollision();
    updateBullets();
    checkIsLose();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    renderMario();
    renderPlatforms();
    renderBonusCube();
    renderClours();
    renderEnemy();
    renderBullets();
    
    ctx.closePath();
}
game();

