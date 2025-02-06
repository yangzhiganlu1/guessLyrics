const fs = require('fs');
const readline = require('readline'); // 用于从终端读取用户输入

// 读取数据文件
let data = JSON.parse(fs.readFileSync('filtered-data.json', 'utf-8'));

// 创建一个对象来存储歌手及其歌曲数量
const singerSongCount = {};

// 统计每个歌手的歌曲数量
data.forEach(song => {
    const singer = song.singer;
    if (singerSongCount[singer]) {
        singerSongCount[singer]++;
    } else {
        singerSongCount[singer] = 1;
    }
});

// 显示所有歌手及其歌曲数量
console.log("歌手及其对应的歌曲总数:");
for (const [singer, count] of Object.entries(singerSongCount)) {
    console.log(`${singer}: ${count} 首歌曲`);
}

// 创建 readline 接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 提示用户输入要删除的歌手名称（多个用空格隔开）
rl.question('请输入要删除的歌手名称（多个用空格隔开，输入后按回车）：', singersToDelete => {
    // 将输入的歌手名称分割成数组
    const singersArray = singersToDelete.split(' ').map(s => s.trim());

    // 过滤掉要删除的歌手的所有歌曲
    const filteredData = data.filter(song => !singersArray.includes(song.singer));

    // 检查是否有歌手被删除
    if (filteredData.length === data.length) {
        console.log(`未找到所输入的歌手，未删除任何数据。`);
    } else {
        // 将过滤后的数据保存到原始文件
        fs.writeFileSync('merged-data.json', JSON.stringify(filteredData, null, 2), 'utf-8');
        console.log(`已删除歌手 "${singersToDelete}" 的所有歌曲，结果已保存到 merged-data.json`);
    }

    // 关闭 readline 接口
    rl.close();
});