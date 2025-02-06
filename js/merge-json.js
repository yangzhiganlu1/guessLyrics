const fs = require('fs');
const path = require('path');

// 定义要合并的 JSON 文件列表
const jsonFiles = ['lyrics1.json', 'lyrics2.json','lyrics3.json','lyrics4.json','lyrics5.json']; // 可以动态扩展

// 用于存储合并后的数据
let mergedData = [];

// 遍历每个文件并合并数据
jsonFiles.forEach(file => {
    try {
        const filePath = path.resolve(file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        mergedData = mergedData.concat(data); // 将数据合并到 mergedData 中
    } catch (error) {
        console.error(`读取文件 ${file} 失败:`, error.message);
    }
});

// 将合并后的数据写入新文件
const outputFilePath = path.resolve('merged-data.json');
fs.writeFileSync(outputFilePath, JSON.stringify(mergedData, null, 2), 'utf-8');

console.log(`合并完成！结果已保存到 ${outputFilePath}`);