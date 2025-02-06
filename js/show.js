const fs = require('fs');

// 读取数据文件
const data = JSON.parse(fs.readFileSync('filtered-data.json', 'utf-8'));

// 创建一个对象来存储歌手及其歌曲数量
const singerSongCount = {};

// 遍历数据
data.forEach(song => {
    const singer = song.singer;
    
    // 如果歌手已经在对象中，增加歌曲数量
    if (singerSongCount[singer]) {
        singerSongCount[singer]++;
    } else {
        // 如果歌手不在对象中，初始化歌曲数量为1
        singerSongCount[singer] = 1;
    }
});

// 输出结果
console.log("歌手及其对应的歌曲总数:");
for (const [singer, count] of Object.entries(singerSongCount)) {
    console.log(`${singer}: ${count} 首歌曲`);
}