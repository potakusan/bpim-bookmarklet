"use strict";
//import cheerio from 'cheerio';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const leggendariaSongs = [
    "ABSOLUTE",
    "Clione",
    "RED ZONE",
    "spiral galaxy",
    "Little Little Princess",
    "CONTRACT",
    "waxing and wanding",
    "KAMAITACHI",
    "Blue Rain",
    "THE DEEP STRIKER",
    "Kung-fu Empire",
    "THANK YOU FOR PLAYING",
    "凛として咲く花の如く",
    "Golden Palms",
    "QUANTUM TELEPORTATION",
    "Howling",
    "朧",
    "龍と少女とデコヒーレンス",
    "廿",
    "Beat Radiance",
    "CHRONO DIVER -NORNIR-",
    "Cosmic Cat",
    "恋は白帯、サンシロー",
    "超青少年ノ為ノ超多幸ナ超古典的超舞曲",
    "Damage Per Second",
    "STARLIGHT DANCEHALL",
    "Amazing Mirage",
    "冬椿 ft. Kanae Asaba",
    "Wanna Party?",
    "AIR RAID FROM THA UNDAGROUND",
    "Twelfth Style",
    "B4U(BEMANI FOR YOU MIX)",
    "Welcome",
    "GRID KNIGHT",
    "RUGGED ASH",
    "Ubertreffen",
];
class Main {
    constructor() {
        this.mode = 0;
        this.getter = new Getter();
        this.scraper = new Scraper();
        this.result = [];
        this.wait = (msec) => new Promise((resolve, _reject) => setTimeout(resolve, msec));
    }
    exec() {
        return __awaiter(this, void 0, void 0, function* () {
            if (document.domain.indexOf("eagate.573.jp") === -1) {
                return alert("対応外のページです。");
            }
            console.log("v0.0.1");
            const dani = yield this.getter.getDaniList();
            const list = dani.list;
            let songsList = {};
            for (let i = 0; i < list.length; ++i) {
                this.getter.setRivalId(list[i]["rival"]);
                for (let j = 0; j < 7; ++j) {
                    this.getter.setOffset(j);
                    console.log(i, list[i]["rival"], "offset:" + j * 50);
                    //await this.wait(200);
                    const body = yield this.getter.get();
                    const b = this.scraper.setRawBody(body).exec();
                    Object.keys(b).map(item => {
                        if (!songsList[item]) {
                            songsList[item] = [b[item]];
                        }
                        else {
                            songsList[item].push(b[item]);
                        }
                    });
                }
            }
            console.log(songsList, JSON.stringify(songsList));
        });
    }
    showResult() {
        console.log(this.result);
        document.body.innerHTML = JSON.stringify(this.result);
    }
}
class Getter {
    constructor() {
        this.diff = 11;
        this.offset = 0;
        this.rivalId = "";
    }
    setDiff(val) {
        this.diff = val;
    }
    setOffset(val) {
        this.offset = (val) * 50;
    }
    setRivalId(val) {
        this.rivalId = val;
    }
    parseBlob(blob) {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => { resolve(reader.result); };
            reader.readAsText(blob, 'shift-jis');
        });
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(this.rivalId);
                const res = yield fetch(`https://p.eagate.573.jp/game/2dx/27/djdata/music/difficulty_rival.html?rival=${this.rivalId}&difficult=${this.diff}&style=0&disp=1&offset=${this.offset}`, {
                    method: "GET",
                    credentials: "same-origin",
                });
                if (!res.ok || res.status !== 200) {
                    throw new Error(`statuscode:${res.status}`);
                }
                const text = (yield this.parseBlob(yield res.blob()));
                return text;
            }
            catch (e) {
                console.log(e);
                alert("error!");
            }
        });
    }
    getDaniList() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const obj = {
                    "grade_id": "18",
                    "play_style": "0",
                    "page": "0",
                    "limit": "5000",
                    "release_9_10_kaiden": "2",
                };
                let res = yield fetch(`https://p.eagate.573.jp/game/2dx/27/ranking/json/dani.html?grade_id=${obj["grade_id"]}&play_style=${obj["play_style"]}&page=${obj["page"]}&limit=${obj["limit"]}&release_9_10_kaiden=${obj["release_9_10_kaiden"]}`, {
                    method: "POST",
                    credentials: "same-origin",
                });
                if (!res.ok || res.status !== 200) {
                    throw new Error(`statuscode:${res.status}`);
                }
                const json = JSON.parse(yield this.parseBlob(yield res.blob()));
                return json;
            }
            catch (e) {
                console.log(e);
            }
        });
    }
}
class Scraper {
    constructor() {
        this.rawBody = "";
    }
    setRawBody(input) {
        this.rawBody = input;
        return this;
    }
    exec() {
        this.getTable();
        return this.getEachSongs();
    }
    getTable() {
        const matcher = this.rawBody.match(/<div class="series-difficulty">.*?<div id="page-top">/);
        this.setRawBody((!matcher || matcher.length === 0) ? "" : matcher[0]);
        return this;
    }
    getEachSongs() {
        if (!this.rawBody) {
            return {};
        }
        let res = {};
        let lastSongName = "";
        const matcher = this.rawBody.match(/<tr>.*?<\/tr>/g);
        if (!matcher) {
            return {};
        }
        for (let key in matcher) {
            const eachSong = matcher[key];
            const _matcher = eachSong.match(/(?<=<td>).*?(?=<\/td>)/g);
            if (_matcher) {
                const songName = _matcher[0].match(/(?<=\"music_win\">).*?(?=<\/a>)/);
                if (songName) {
                    const score = _matcher[3].split(/<br>/);
                    if (score && score[0] !== "0") {
                        //another譜面が別レベルに存在するleggendaria譜面を識別
                        let suffix = "(A)";
                        if (leggendariaSongs.indexOf(songName[0]) > -1) {
                            suffix = "(L)";
                        }
                        else {
                            //同名別譜面の識別(先にanotherが、後にleggendaria譜面が並ぶことを利用)
                            if (lastSongName === songName[0]) {
                                suffix = "(L)";
                                if (songName[0] === "gigadelic" || songName[0] === "Innocent Walls") {
                                    suffix = "(A)";
                                }
                            }
                            else {
                                //gigadelic,Innocent Wallsのみ例外
                                if (songName[0] === "gigadelic" || songName[0] === "Innocent Walls") {
                                    suffix = "(H)";
                                }
                            }
                        }
                        res[songName[0] + suffix] = Number(score[0]);
                    }
                    lastSongName = songName[0];
                }
            }
        }
        return res;
    }
}
const init = new Main();
init.exec();
