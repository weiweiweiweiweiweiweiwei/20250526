let video;
let facemesh;
let handpose;
let predictions = [];
let handPredictions = [];
// let circleIndex = 94; // 不再只用一個索引，而是根據手勢決定顯示內容

// 新增：表情符號/圖示變數
let currentEmoji = '❓'; // 預設表情
let emojiSize = 80; // 表情大小

function setup() {
  createCanvas(640, 480).position(
    (windowWidth - 640) / 2,
    (windowHeight - 480) / 2
  );
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on('predict', results => {
    predictions = results;
  });

  handpose = ml5.handpose(video, handModelReady);
  handpose.on('predict', results => {
    handPredictions = results;
  });

  textAlign(CENTER, CENTER); // 讓表情符號置中
}

function modelReady() {
  console.log('臉部模型載入完成!');
}

function handModelReady() {
  console.log('手部模型載入完成!');
}

function detectHandGesture(hand) {
  if (!hand || !hand.landmarks) return 'paper';

  const tips = [8, 12, 16, 20];
  let extended = 0;
  for (let i = 0; i < tips.length; i++) {
    if (hand.landmarks[tips[i]][1] < hand.landmarks[tips[i] - 2][1]) {
      extended++;
    }
  }
  // 大拇指判斷稍微調整，使其更穩定一些 (食指指根的x座標作為參考)
  // let thumbExtended = hand.landmarks[4][0] > hand.landmarks[3][0]; // 原判斷
  let thumbExtended = hand.landmarks[4][0] < hand.landmarks[5][0] && Math.abs(hand.landmarks[4][1] - hand.landmarks[5][1]) < 30; // 假設向左伸直且Y軸差異不大


  if (extended === 0 && !thumbExtended) return 'rock'; // 石頭：0指伸直 (且拇指彎曲)
  if (extended === 2) return 'scissors'; // 剪刀：2指伸直
  if (extended >= 3) return 'paper'; // 布：3指或以上伸直
  
  return 'unknown'; // 其他狀況
}

function draw() {
  // 稍微翻轉影像，讓它像鏡子一樣
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  // 翻轉回來，讓之後繪製的文字或圖形是正的
  translate(width, 0);
  scale(-1, 1);

  let gesture = 'unknown';

  if (handPredictions.length > 0) {
    gesture = detectHandGesture(handPredictions[0]);
  }

  // 根據手勢更新表情符號
  switch (gesture) {
    case 'rock':
      currentEmoji = '✊'; // 或 🧱
      emojiSize = 100;
      break;
    case 'paper':
      currentEmoji = '🖐️'; // 或 📄
      emojiSize = 120;
      break;
    case 'scissors':
      currentEmoji = '✌️'; // 或 ✂️
      emojiSize = 100;
      break;
    default:
      currentEmoji = '🤔'; // 未知手勢
      emojiSize = 80;
      break;
  }

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;

    // 我們選擇臉部的一個中心點，例如鼻子尖端 (索引 1)
    // 或者你可以選擇眉心 (索引 10) 或下巴 (索引 152) 等
    // 你可以參考 facemesh 的 landmark 圖: https://github.com/tensorflow/tfjs-models/blob/master/facemesh/mesh_map.jpg
    const noseTip = keypoints[1]; 
    const [x, y] = noseTip;

    // 繪製表情符號
    textSize(emojiSize);
    // 由於影像翻轉了，繪製文字時x座標也要翻轉回來
    text(currentEmoji, width - x, y); 
  }
}
