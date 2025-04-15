
const lyricsArray = lyrics;
const lyricsArrayLength = lyricsArray.length;
new Vue({
    el: '#app',
    data: {
        showSaveButton: false, // 是否显示保存按钮
        wrongMessage: '',
        successMessage: '',
        message: '',
        visible: false,
        clickShowAnswer: false,
        loading: true,
        vipVersion: false,
        centerDialogVisible: false,//普通成功提示弹框
        badgeDialogVisible: false,//徽章成功提示弹框
        overLimit: false,
        showSingerSetting: false,
        showSingerSetting: false,
        inputVisible: false,
        cantSearch: false,
        inputLetter: '',
        notFoundMessage: '',
        quizInput: '',
        inputValue: '',
        inputForID: '',
        searchParam: {
            singer: '',
            song: ''
        },
        searchList: [],
        memorySetting: {
            singerMode: 'all',
            dynamicTags: ['王菲', '张惠妹', '蔡依林', '周杰伦', '林俊杰', '陈奕迅'],
            easyMode: false,
            easyFactor: 30
        },
        currentSongSetting: {
            success: false,
            titleLetters: [],
            lyricLetters: [],
            singerLetters: [],
            wrongGuesses: [],
            correctGuesses: [],
            songID: '',
            guessCount: 0,
            tipCount: 0,
            isEveryDayMode: false,
        },
        everyDaySetting: {
            success: false,
            guessCount: 0,
            tipCount: 0,
            titleLetters: [],
            lyricLetters: [],
            singerLetters: [],
            wrongGuesses: [],
            correctGuesses: [],
            guessDate: 0,
            songID: '',
        },

        inputText: "", // 用户输入的署名
        showSaveButton: false, // 是否显示保存按钮
        canvasWidth: 800, // 画布宽度（需与图片尺寸一致）
        canvasHeight: 600, // 画布高度（需与图片尺寸一致）
        fontLoaded: false, // 字体是否加载完成
        baseImage: null, // 基础图片对象
        //徽章放在本地数据库indexDB
        dbName: 'badgeDB',
        storeName: 'badgeStore',
        db: '',//indexDB
        dbList: '',//indexDB读到的数据
        currentBadge: {
            badgeID: '',
            photo: '',
            desc: ''
        }

    },
    watch: {
        'memorySetting.singerMode': function (newValue, oldValue) {
            // 处理 singerMode 变化的逻辑
            this.saveMemorySetting()
            // 你可以在这里添加其他逻辑，比如 API 调用或状态更新
        }
    },
    async mounted() {
        //测试
        // this.initCanvas();

        //打开数据库——openDB
        // this.db = await openDB(this.dbName, this.storeName, 1);



        let memorySetting = localStorage.getItem('guessLyrics');
        let currentSongSetting = localStorage.getItem('currentSongSetting');
        let everyDaySetting = localStorage.getItem('everyDaySetting');
        if (memorySetting) {
            this.memorySetting = JSON.parse(memorySetting);
        }
        if (currentSongSetting) {
            this.currentSongSetting = JSON.parse(currentSongSetting);
        }
        //只获取今天存储的每日挑战数据
        if (everyDaySetting && this.getCurrentDate() == JSON.parse(everyDaySetting).guessDate) {
            this.everyDaySetting = JSON.parse(everyDaySetting);
        } else {
            this.everyDaySetting.guessDate = this.getCurrentDate()
            this.resetGuess();
        }
        const params = this.getQueryParams();
        // console.log(params)

        //分情况加载题目
        if (params?.songID) {
            this.jumpBySongID(params?.songID);
        }
        //如果有缓存就获取缓存最近猜测的歌曲,如果缓存里显示猜测次数或提示次数大于0说明是猜了一半
        else if (this.currentSongSetting.guessCount > 0 || this.currentSongSetting.tipCount > 0) {

        }
        //查看每日挑战做完了没
        else if (!this.everyDaySetting.success) {
            this.currentSongSetting.success = false;
            this.currentSongSetting = JSON.parse(JSON.stringify(this.everyDaySetting));
            this.clickEveryDay();
        }
        //做完了就随机开始
        else {
            this.currentSongSetting.isEveryDayMode = false;
            this.setQuestion();
        }
        const _this = this;
        window.addEventListener('scroll', this.handleScroll);
        this.inputLetter = '';
        setTimeout(() => {
            _this.$refs.guessInput.focus()
        }, 300)
    },
    beforeDestroy() {
        window.removeEventListener('scroll', this.handleScroll);
    },
    methods: {
        // 初始化画布
        async initCanvas() {
            // 加载自定义字体
            await this.loadFont();
            // 加载图片
            await this.loadBaseImage();
            // 绘制基础图片
            this.drawBaseImage();
        },

        // 加载自定义字体
        loadFont() {
            return new Promise((resolve, reject) => {
                const font = new FontFace("hanchan", "url('./badge/hanchan.otf')"); // 替换为你的字体路径

                font
                    .load()
                    .then(() => {
                        document.fonts.add(font);
                        this.fontLoaded = true;
                        resolve();
                    })
                    .catch((err) => {
                        console.error("字体加载失败:", err);
                        reject(err);
                    });
            });
        },

        // 加载图片
        loadBaseImage() {
            return new Promise((resolve, reject) => {
                this.baseImage = new Image();
                // this.baseImage.crossOrigin = "anonymous"; // 关键代码
                this.baseImage.src = this.currentBadge.photo;

                this.baseImage.onload = () => resolve();
                this.baseImage.onerror = (err) => {
                    console.error("图片加载失败:", err);
                    reject(err);
                };
            });
        },
        // 绘制基础图片
        drawBaseImage() {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(this.baseImage, 0, 0, 304, 394);
        },
        // 添加文字到画布
        addTextToCanvas() {
            if (!this.inputText.trim()) return;
            if (!this.fontLoaded) {
                alert("字体正在加载，请稍后...");
                return;
            }

            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext("2d");

            // 文字样式配置,
            //测试
            //女鬼
            const textStyle = {
                fontSize: 25,
                fontFamily: "hanchan",
                fillColor: "#fdf8da",
                strokeColor: "#f1b596",
                strokeWidth: 5,
                posX: 55, // 文字X坐标
                posY: 317, // 文字Y坐标
            };

            // 绘制描边文字
            ctx.font = `${textStyle.fontSize}px ${textStyle.fontFamily}`;
            ctx.strokeStyle = textStyle.strokeColor;
            ctx.lineWidth = textStyle.strokeWidth;
            ctx.strokeText(this.inputText, textStyle.posX, textStyle.posY);

            // 绘制填充文字
            ctx.fillStyle = textStyle.fillColor;
            ctx.fillText(this.inputText, textStyle.posX, textStyle.posY);

            this.showSaveButton = true;
        },

        // 保存图片
        saveImage() {
            const canvas = this.$refs.canvas;
            const link = document.createElement("a");
            link.download = "custom-image.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        },



        blackIndex() {
            // "来自草莓点歌～",

            // 预定义的歌曲索引列表（按顺序播放）
            const predefinedPlaylist = [
                7446,   // 彼得与狼
                25122,  // 欲加之罪
25144,//赚点窝囊费
                25110,  // 樱花草
                25124,  // 吉祥三宝
                25140,//南三环东路
                25135,//蠢货
                25131,  // 星期三的下午，我砸碎了花盆，跑了出去
                2,//难念的经
                5095,   // 春雨里洗过的太阳
                25136,//罗曼星废墟
                25137,//既白梨
                25138,//不太周的情歌

                2952,   // 兰亭序
                25134,  // 海娃与3丫
                5924,   // 侠客行
                25119,  // 上城名媛
                25139,//滥俗的歌
                25133,   // 相爱就是说了100次对不起

                25141,//取一念
                25142,//千秋渡

25143,//好胆你就来




            ];

            // 解析当前日期（假设getCurrentDate()返回YYYYMMDD格式的数字）
            const currentDateNum = this.getCurrentDate();
            const currentDateStr = currentDateNum.toString();
            const currentDate = new Date(
                parseInt(currentDateStr.substring(0, 4)),  // 年
                parseInt(currentDateStr.substring(4, 6)) - 1, // 月（JavaScript月份从0开始）
                parseInt(currentDateStr.substring(6, 8))   // 日
            );

            // 开始日期（2025年4月14日）
            const startDate = new Date(2025, 3, 14); // 注意：月份从0开始（3表示4月）

            // 计算日期差（单位：天）
            const timeDiff = currentDate - startDate;
            const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

            // 如果是工作日且在歌单范围内
            if (dayDiff >= 0 && dayDiff < predefinedPlaylist.length) {
                const dayOfWeek = currentDate.getDay(); // 0是周日，1是周一，...，6是周六
                // 检查是否是工作日（周一到周五）
                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    return predefinedPlaylist[dayDiff]; // 按顺序返回歌单中的歌曲
                }
            }

            // 默认情况：随机选择歌曲
            return this.getRandomIndex(lyricsArray, this.getCurrentDate());
        },
        //判定是否为空格
        isBlank(char) {
            // console.log(char, /^\s*$/.test(char));
            // return /^\s*$/.test(char);
            return /^\s*$|^[.·：、？：！～&~]$/.test(char);
        },
        //去除空格字母数字汉字之外的字符
        cleanString(input, singer) {
            if (singer) {
                if (input.includes(`- ${singer}`)) {
                    return '';
                }
            }
            if (!input) return '';
            input = removeDoubleParentheses(input);
            // 使用正则表达式匹配需要保留的字符————保留中英文和数字和空格
            input = input.replace(/[^：、.·a-zA-Z0-9'“”"<>《》：？！～&~\s\u4e00-\u9fa5]/g, ' ');
            //一些字和符号直接删掉
            input = this.replaceCharacters(input);
            //校正异常空格
            input = this.checkAndFixStringSpacing(input);
            // 将连续三个及以上的空格替换为一个空格
            input = input.replace(/\s{3,}/g, ' ');
            // 去掉开头的所有空格
            input = input.replace(/^\s+/, '');
            //一个英文的话 删掉
            if (input.length == 1 && /^[a-zA-Z0-9]+$/.test(input)) return '';
            if (input.length <= 4 && /[：:]/.test(input.charAt(input.length - 1))) {
                return ''; // 返回空字符串
            }
            const keywords = [
                '编曲 ', '作曲', '作词', '词 ', '曲 ', '词曲 ', '制作人', '改编', '乐谱：',
                'OP', '曲：', '词：', 'SP', '配唱制作', '录音', '编辑：', '吉他：', '人声',
                '吉他 ', '出品', '贝斯：', '鼓：', '监制', '弦乐', '编写', '贝斯', '鼓 ', '主唱', '同步', '旁白',
                '乐谱 ', '混音', '母带', '制作 ', '配唱', '和音：', '小号：', '乐队',
                '提琴：', 'Bass：', 'Vocal edite：', '版权 ', '小号 ', '设计 ', '总监', '统筹', 'Violin：', 'A&R：', '企划', '文案', 'Viola：', 'Cello：', '录制：', '发行', 'by：'

            ];
            // 检查是否包含关键词
            for (const keyword of keywords) {
                if (input.includes(keyword)) {
                    return ''; // 如果包含关键词，返回空字符串，表示这一行歌词应被删除
                }
            }
            input = this.replaceCharacter(input);
            return input;
        },
        sliderChange(value) {
            // console.log(value)
            if (value) {
                this.resetGuess()
                this.showHalfAnswer()
            }
        },
        //简单模式开关
        easyChange(value) {
            if (value) this.showHalfAnswer()
            else {
                this.resetGuess()
            }
        },
        //禁止下拉刷新
        handleScroll(event) {
            if (window.scrollY === 0 && event.deltaY < 0) {
                console.log('handleScroll')
                event.preventDefault();
            }
        },
        //用ID跳转
        jumpBySongID(id) {
            this.resetGuess();
            id = id.toString().trim();
            if (!id) return;
            if (id.includes('S') || id.includes('s')) {
                id = this.replaceCharacter(id, 'S');
                id = this.replaceCharacter(id, 's');
            }
            id = Number(id);
            let findObj = lyrics[id];
            if (!findObj) return false;
            //获取今日ID
            let index = this.blackIndex();
            this.currentSongSetting.isEveryDayMode = index == id ? true : false;
            this.currentSongSetting.isEveryDayMode ? this.clickEveryDay() : this.setQuestion('custom', id);
            if (this.memorySetting.easyMode) this.showHalfAnswer()
        },
        //切歌
        switchSong(index) {
            this.currentSongSetting.titleLetters = [];
            this.currentSongSetting.singerLetters = [];
            this.currentSongSetting.lyricLetters = [];
            this.currentSongSetting.songID = this.searchList[index].id;
            this.convertQuestion(this.searchList[index]);
            this.searchList = [];
            this.searchParam = {
                singer: '',
                song: ''
            };
            this.showSingerSetting = false;
            this.showMessage('已切换~');
            this.resetGuess();
        },
        //搜索歌曲
        searchSong() {
            const _this = this;
            this.searchList = lyricsArray.filter(f => {
                if (_this.searchParam.singer && f.singer.indexOf(_this.searchParam.singer) == -1)
                    return false;
                if (_this.searchParam.song && f.name.indexOf(_this.searchParam.song) == -1)
                    return false;
                return true;
            });
            if (this.searchList.length == 0) {
                this.cantSearch = true;
            } else {
                this.cantSearch = false;
            }
            if (this.searchList.length > 9) {
                this.overLimit = true;
                this.searchList = this.searchList.slice(0, 9);
            } else {
                this.overLimit = false;
            }
            this.searchList.forEach(f => {
                f.concatLyric = f.lyric.join(' ');
            });
        },
        //存到本地记忆
        saveMemorySetting() {
            localStorage.setItem('guessLyrics', JSON.stringify(this.memorySetting));
            localStorage.setItem('currentSongSetting', JSON.stringify(this.currentSongSetting));
            if (this.currentSongSetting.isEveryDayMode) {
                this.everyDaySetting = JSON.parse(JSON.stringify(this.currentSongSetting));
                localStorage.setItem('everyDaySetting', JSON.stringify(this.everyDaySetting));
            }
        },
        //删除标签
        handleClose(tag) {
            this.memorySetting.dynamicTags.splice(this.memorySetting.dynamicTags.indexOf(tag), 1);
            this.saveMemorySetting();
            this.changeAnother();
        },
        //显示标签新增输入框
        showInput() {
            this.inputVisible = true;
            this.$nextTick(_ => {
                this.$refs.saveTagInput.$refs.input.focus();
            });
        },
        //确认添加歌手标签
        handleInputConfirm() {
            let inputValue = this.inputValue;
            if (!inputValue) return;
            if (this.memorySetting.dynamicTags.includes(inputValue)) {

                this.showMessage(`"${inputValue}" 已经存在`);
                // return;
            } else if (lyricsArray.filter(f => f.singer == inputValue).length == 0) {

                this.showMessage(`曲库里没有“${inputValue}”的歌...`);
            } else {
                this.memorySetting.dynamicTags.push(inputValue);
                this.saveMemorySetting();
            };
            this.inputVisible = false;
            this.inputValue = '';
            this.changeAnother();
        },
        //题目格式转换
        convertQuestion(question) {
            const _this = this;
            let title = this.cleanString(question.name).trim();
            let singer = this.cleanString(question.singer).trim();
            //截取前80行
            let lyricDetail = question.lyric.filter(f => _this.cleanString(f, question.singer) != '');
            //将歌名转换为数组
            this.currentSongSetting.titleLetters = title.split('').map(char => ({
                letter: char.toString(),
                revealed: false,
                auto: false,
                blank: _this.isBlank(char.toString())
            }));
            //将歌手转换为数组
            this.currentSongSetting.singerLetters = singer.split('').map(char => ({
                letter: char.toString(),
                revealed: false,
                auto: false,
                blank: _this.isBlank(char.toString())
            }));
            //将歌词转换为数组
            let lys = [];
            lyricDetail.forEach((line, index) => {
                lys.push([]);
                line = _this.cleanString(line);
                lys[lys.length - 1] = line.split('').map(char => ({
                    letter: char.toString(),
                    revealed: false,
                    auto: false,
                    blank: _this.isBlank(char.toString())
                }));
            });
            this.currentSongSetting.lyricLetters = lys;
        },
        //显示消息
        showMessage(message) {
            this.message = message;
            this.visible = true;

            // 3秒后自动隐藏消息
            setTimeout(() => {
                this.visible = false;
            }, 1500);
        },
        //设置题目
        setQuestion(type, index) {
            const _this = this;
            let question = {};
            let randomIndex = 0;
            //指定index
            if (type = 'custom' && index) {
                question = lyricsArray[index];
                if (!question) this.changeAnother();
            }
            //随机
            else {
                if (this.memorySetting.singerMode == 'all') {
                    randomIndex = Math.floor(Math.random() * lyricsArrayLength);
                    question = lyricsArray[randomIndex];
                } else {
                    //随机选择一个歌手
                    randomIndex = Math.floor(Math.random() * this.memorySetting.dynamicTags.length);
                    let searchList = lyricsArray.filter(f => f.singer == this.memorySetting.dynamicTags[
                        randomIndex]);
                    const randomIndex2 = Math.floor(Math.random() * searchList.length);
                    question = searchList[randomIndex2];
                }
            }
            this.currentSongSetting.songID = question.id;
            this.currentSongSetting.isEveryDayMode = this.currentSongSetting.songID == this.everyDaySetting.songID;
            // 返回选择的问题
            // console.log(question);
            this.convertQuestion(question);
        },
        //换一首
        changeAnother() {
            this.currentSongSetting.isEveryDayMode = false;
            this.setQuestion();
            this.resetGuess();
            if (this.memorySetting.easyMode) this.showHalfAnswer()
        },

        //复制链接
        copyURL() {
            navigator.clipboard.writeText(`https://yangzhiganlu1.github.io/guessLyrics?songID=${this.currentSongSetting.songID}`);
            this.showMessage('链接已复制！')
        },
        ///将输入字符替换成无
        replaceCharacter(str, charToReplace) {
            return str.replace(new RegExp(charToReplace, 'gi'), ''); // 使用正则表达式进行全局替换
        },
        //一些字和符号直接删掉
        replaceCharacters(input) {
            input = input.replace(/'/g, '');
            input = this.replaceCharacter(input, 'Album');
            input = this.replaceCharacter(input, 'Version');
            input = this.replaceCharacter(input, '“');
            input = this.replaceCharacter(input, '”');
            input = this.replaceCharacter(input, '"');
            input = this.replaceCharacter(input, '<');
            input = this.replaceCharacter(input, '>');
            input = this.replaceCharacter(input, '《');
            input = this.replaceCharacter(input, '》');
            return input;
        },
        //重置猜测状态
        resetGuess() {
            this.wrongMessage = '';
            this.successMessage = '';
            this.currentSongSetting.guessCount = 0;
            this.currentSongSetting.tipCount = 0;
            this.currentSongSetting.wrongGuesses = [];
            this.currentSongSetting.correctGuesses = [];
            this.notFoundMessage = '';
            this.inputLetter = '';
            this.currentSongSetting.success = false;
            this.clickShowAnswer = false;
            this.overLimit = false;
            this.currentSongSetting.lyricLetters.forEach(line => line.forEach(letter => {
                letter.revealed = false;
                letter.auto = false;
            })); // 清除已显示的歌词
            this.currentSongSetting.titleLetters.forEach(letter => {
                letter.revealed = false;
                letter.auto = false;
            }); // 清除已显示的歌名
            this.currentSongSetting.singerLetters.forEach(letter => {
                letter.revealed = false;
                letter.auto = false;
            }); // 清除已显示的歌手
            if (this.memorySetting.easyMode) this.showHalfAnswer()
        },
        //清空输入框
        clearInput() {
            const _this = this;
            this.inputLetter = '';
            // const inputElement = this.$refs.guessInput.$el.querySelector('input');
            // console.log(inputElement);  // 获取输入框的值
            this.$nextTick(() => {
                const inputElement = this.$refs.guessInput.$el.querySelector('input');
                // console.log(inputElement);  // 检查是否获取到了 input 元素
                inputElement.focus();  // 聚焦到输入框
            });
        },
        //点击猜测按钮
        async guess(type) {
            // this.wrongMessage = '';
            // this.successMessage = '';
            if (this.currentSongSetting.success) return;
            let guessValue = this.inputLetter.trim();
            guessValue = [...new Set(guessValue.replace(/\s+/g, '').split(''))].join('');

            if (!guessValue) return;
            // const uniqueChars = new Set();
            // for (const char of guessValue) {
            // 	if (/^[a-zA-Z]$/.test(char)) {
            // 		uniqueChars.add(char.toLowerCase());
            // 		uniqueChars.add(char.toUpperCase());
            // 	} else {
            // 		uniqueChars.add(char); // 如果不是英文字符，则直接添加
            // 	}
            // }
            // // 转换为字符串并去重
            // guessValue = [...uniqueChars].join('');

            let haveGuessesIn = [];
            let haveGuessesNotIn = [];
            let guessIn = [];
            let guessNotIn = [];

            for (let i = 0; i < guessValue.length; i++) {
                const char = guessValue[i];
                const lowerChar = char.toLowerCase();
                const upperChar = char.toUpperCase();

                // 检查是否已猜过且在正确猜测中
                if (this.currentSongSetting.correctGuesses.includes(char) ||
                    this.currentSongSetting.correctGuesses.includes(lowerChar) ||
                    this.currentSongSetting.correctGuesses.includes(upperChar)) {
                    haveGuessesIn.push(char)

                    // this.showMessage(`${char} 已猜过！在歌词中！`);
                    // this.successMessage = `${char} 已猜过！在歌词中！`;

                    // 清空输入框
                    // this.clearInput();
                    continue;//还是写continue
                }

                // 检查是否已猜过且在错误猜测中
                if (this.currentSongSetting.wrongGuesses.includes(char) ||
                    this.currentSongSetting.wrongGuesses.includes(lowerChar) ||
                    this.currentSongSetting.wrongGuesses.includes(upperChar)) {
                    haveGuessesNotIn.push(char)
                    // this.showMessage(`${char} 已猜过！不在歌词中！`);
                    // this.wrongMessage = `${char} 已猜过！不在歌词中！`;
                    // 清空输入框
                    // this.clearInput();
                    continue;
                }
                // 增加猜测次数
                if (type == 'tips') {
                    this.currentSongSetting.tipCount++;
                    if (this.currentSongSetting.isEveryDayMode)
                        this.currentSongSetting.everyDayTipCount++
                }
                else {
                    this.currentSongSetting.guessCount++;
                    if (this.currentSongSetting.isEveryDayMode)
                        this.currentSongSetting.everyDayGuessCount++;
                }

                let found = false;
                this.currentSongSetting.titleLetters.forEach(letter => {
                    if (letter.letter === char || letter.letter === lowerChar || letter.letter === upperChar) {
                        letter.revealed = true;
                        found = true;
                    }
                });

                this.currentSongSetting.singerLetters.forEach(letter => {
                    if (letter.letter === char || letter.letter === lowerChar || letter.letter === upperChar) {
                        letter.revealed = true;
                        found = true;
                    }
                });
                this.currentSongSetting.lyricLetters.forEach(line => {
                    line.forEach(letter => {
                        if (letter.letter === char || letter.letter === lowerChar || letter.letter === upperChar) {
                            letter.revealed = true;
                            found = true;
                        }
                    });
                });
                if (!found) {
                    // this.showMessage(`"${guessValue}" 不在歌词中`);
                    // this.wrongMessage = `"${guessValue}" 不在歌词中`;
                    guessNotIn.push(char)

                    if (!this.currentSongSetting.wrongGuesses.includes(char)) {
                        this.currentSongSetting.wrongGuesses.push(char);
                    }
                } else {
                    if (!this.currentSongSetting.correctGuesses.includes(char)) {
                        this.currentSongSetting.correctGuesses.push(char);
                    }
                    if (!await this.checkCompleted()) {
                        // this.successMessage = `"${char}" 在歌词中!!`
                        guessIn.push(char)
                    } else {
                        this.successMessage = '';
                        this.wrongMessage = '';
                        return;
                    }
                    // this.wrongMessage = '';
                }

            }
            const concatenateAndSetMessage = (array, messagePrefix) => {
                if (array.length > 0) {
                    const truncatedArray = array.length > 20 ? array.slice(0, 20).concat('...') : array;
                    const words = truncatedArray.join(' '); // 用空格连接每个字
                    return `${words} ${messagePrefix}`;
                }
                return '';
            };

            const haveGuessesMessage = concatenateAndSetMessage(haveGuessesIn, '已猜过！在歌词中！');
            const guessInMessage = concatenateAndSetMessage(guessIn, '在歌词中！');
            const haveNotGuessesMessage = concatenateAndSetMessage(haveGuessesNotIn, '已猜过！不在歌词中！');
            const guessNotInMessage = concatenateAndSetMessage(guessNotIn, '不在歌词中！');

            this.successMessage = '';
            this.wrongMessage = '';

            if (haveGuessesMessage) {
                this.successMessage = `${this.successMessage} ${haveGuessesMessage}`.trim();
            }

            if (guessInMessage) {
                this.successMessage = `${this.successMessage} ${guessInMessage}`.trim();
            }

            if (haveNotGuessesMessage) {
                this.wrongMessage = haveNotGuessesMessage;
            }

            if (guessNotInMessage) {
                this.wrongMessage = `${this.wrongMessage} ${guessNotInMessage}`.trim();
            }

            // 清空输入框
            this.clearInput();
            //加缓存
            this.saveMemorySetting()
        },
        //加点提示
        addTips() {
            const _this = this;
            let string = '';
            this.currentSongSetting.lyricLetters.forEach(
                (line) => {
                    line.forEach(letter => {
                        if (!_this.isBlank(letter) && !letter.revealed) {
                            string += letter.letter;
                        }
                    })
                }
            );
            if (string.length == 0) return;
            const randomIndex = Math.floor(Math.random() * string.length);
            this.inputLetter = string[randomIndex];
            this.guess('tips');
        },
        //检查是否猜出歌名
        async checkCompleted() {
            if (this.currentSongSetting.titleLetters.filter(f => !f.revealed && !this.isBlank(f.letter)).length == 0) {
                //做撒彩带特效
                //.................
                if (await this.checkAchievementAfterGame()) {
                    //弹出徽章弹框
                    this.badgeDialogVisible = true;
                } else {
                    //弹出普通成功弹框
                    this.centerDialogVisible = true;
                }

                this.currentSongSetting.success = true;
                if (this.currentSongSetting.isEveryDayMode) {
                    this.everyDaySetting.success = true;
                    this.saveMemorySetting();
                }

                this.showAnswer('completed');
                return true;
            }
            return false;
        },
        //检查是否解锁成就
        async checkAchievementAfterGame() {
            return false;
            let searchedData = [];
            //成就01-猜出1次歌名，新人徽章
            searchedData = await cursorGetDataByIndex(this.db, this.storeName, 'badgeID', 'B01');
            if (!searchedData) return true;
            //成就02-猜测次数500次以上
            if (this.currentSongSetting.guessCount > 500) {
                searchedData = await cursorGetDataByIndex(this.db, this.storeName, 'badgeID', 'B02');
                if (!searchedData) return true;
            }

            //查出
            return false;
        },
        //解析URL
        getQueryParams() {
            const queryString = window.location.search; // 获取查询字符串
            const params = {};

            if (queryString) {
                // 去掉开头的 "?"，然后按 "&" 分割
                queryString
                    .substring(1) // 去掉 "?"
                    .split('&')   // 按 "&" 分割成键值对
                    .forEach((pair) => {
                        const [key, value] = pair.split('='); // 按 "=" 分割键和值
                        params[decodeURIComponent(key)] = decodeURIComponent(value || ''); // 解码并存储
                    });
            }

            return params;
        },

        //检查空格是否异常
        checkAndFixStringSpacing(str) {
            // 如果字符串长度小于等于3，直接返回原字符串
            if (str.length <= 3) {
                return str;
            }
            //

            // 检查是否是异常情况
            let isAbnormal = true;
            for (let i = 0; i < str.length - 1; i++) {
                // 如果当前字符不是空格，且下一个字符不是空格，则属于正常
                if (str[i] !== ' ' && str[i + 1] !== ' ') {
                    isAbnormal = false;
                    break;
                }
            }
            // 如果是正常情况，直接返回原字符串
            if (!isAbnormal) {
                return str;
            }
            // 如果是异常情况，删除每个非空格字符后面的一个空格
            let result = '';
            for (let i = 0; i < str.length; i++) {
                // 如果当前字符不是空格，且下一个字符是空格，则跳过下一个字符
                if (str[i] !== ' ' && str[i + 1] === ' ') {
                    result += str[i];
                    i++; // 跳过下一个空格
                } else {
                    result += str[i];
                }
            }
            return result;
        },
        //显示答案
        showAnswer(type) {
            const _this = this;
            this.wrongMessage = '';
            this.clickShowAnswer = type == 'completed' ? false : true;
            this.currentSongSetting.success = true;
            //显示全部歌词
            this.currentSongSetting.lyricLetters.forEach(
                (line) => {
                    line.forEach(letter => {
                        if (!letter.revealed && !letter.blank) {
                            letter.auto = true;
                        }
                    })
                }
            );

            this.currentSongSetting.titleLetters.forEach(letter => {
                if (!letter.revealed && !letter.blank) {
                    letter.auto = true
                }
            }); // 显示全部歌名

            this.currentSongSetting.singerLetters.forEach(letter => {
                if (!letter.revealed && !letter.blank) {
                    letter.auto = true
                }
            }); // 显示全部歌手
        },
        //显示一半答案
        showHalfAnswer() {
            const _this = this;
            this.wrongMessage = '';
            let string = '';
            this.currentSongSetting.lyricLetters.forEach(
                (line) => {
                    line.forEach(letter => {
                        if (!_this.isBlank(letter) && !letter.revealed && !string.includes(letter.letter)) {
                            string += letter.letter;
                        }
                    })
                }
            );
            // 将字符串转换为数组
            let letterArray = string.split('');
            // Fisher-Yates 洗牌算法
            for (let i = letterArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [letterArray[i], letterArray[j]] = [letterArray[j], letterArray[i]]; // 交换
            }
            // 将打乱后的字符数组重新转换为字符串
            string = letterArray.join('');
            // 计算字符串长度并取前一半
            const halfLength = Math.floor(string.length * Number(this.memorySetting.easyFactor) / 100);
            string = string.substring(0, halfLength);
            this.currentSongSetting.titleLetters.forEach(f => {
                string = this.replaceCharacter(string, f.letter);
            })
            string = string.split('');
            string.forEach(guessValue => {
                let lower = guessValue;
                let upper = guessValue;
                if (/^[a-zA-Z]+$/.test(guessValue)) {
                    lower = guessValue.toLowerCase();
                    upper = guessValue.toUpperCase();
                }
                this.currentSongSetting.titleLetters.forEach(letter => {
                    if (letter.letter === guessValue || letter.letter === lower || letter.letter === upper) {
                        if (!letter.revealed && !letter.blank) {
                            letter.auto = true;
                        }
                    }
                });
                this.currentSongSetting.singerLetters.forEach(letter => {
                    if (letter.letter === guessValue || letter.letter === lower || letter.letter === upper) {
                        if (!letter.revealed && !letter.blank) {
                            letter.auto = true;
                        }
                    }
                });
                this.currentSongSetting.lyricLetters.forEach(line => {
                    line.forEach(letter => {
                        if (letter.letter === guessValue || letter.letter === lower || letter.letter === upper) {
                            if (!letter.revealed && !letter.blank) {
                                letter.auto = true;
                            }
                        }
                    });
                });
            })
            // 清空输入框
            this.clearInput();
            //加缓存
            this.saveMemorySetting()
        },
        //每日挑战
        clickEveryDay() {
            //获取今日ID
            let index = this.blackIndex();
            //如果是还没开始猜
            if (this.everyDaySetting.guessCount == 0 && this.everyDaySetting.tipCount == 0) {
                this.setQuestion('custom', index);
            }
            //已经开始猜了
            else {
                this.currentSongSetting = JSON.parse(JSON.stringify(this.everyDaySetting));
            }
            if (this.memorySetting.easyMode) this.showHalfAnswer()
            this.currentSongSetting.isEveryDayMode = true;
        },

        //分享战绩
        clickShare() {
            navigator.clipboard.writeText(`「杨枝甘露小测验」${this.memorySetting.easyMode ? '[简单版]' : ''}⭐~猜歌词\n${this.currentSongSetting.isEveryDayMode ? '每日挑战成功！\n' : '随机挑战成功！\n'}猜测${this.currentSongSetting.guessCount}次 提示${this.currentSongSetting.tipCount}次\nhttps://yangzhiganlu1.github.io/guessLyrics?songID=${this.currentSongSetting.songID}`);
            this.showMessage('已复制到剪贴板~')
            this.centerDialogVisible = false;
        },
        //获取日期
        getCurrentDate() {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始
            const day = String(date.getDate()).padStart(2, '0');
            return Number(`${year}${month}${day}`); // 转换为数字
        },
        //获取每天随机索引
        createSeededRandom(seed) {
            let m = 0x80000000; // 2^31
            let a = 1103515245;
            let c = 12345;
            let currentSeed = seed;
            return function () {
                currentSeed = (a * currentSeed + c) % m;
                return currentSeed / m; // 返回 [0, 1) 之间的随机数
            };
        },
        getRandomIndex(array, seed) {
            if (array.length === 0) {
                throw new Error("Array is empty.");
            }
            const rng = this.createSeededRandom(seed);
            const randomValue = rng(); // 生成随机数
            return Math.floor(randomValue * array.length); // 转换为数组索引
        }

    }
});
