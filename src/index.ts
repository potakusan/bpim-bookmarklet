//import cheerio from 'cheerio';

interface score{
  title:string,

}

class Main {

  private mode:number = 0;
  private getter = new Getter();
  private scraper = new Scraper();
  private result:any[] = [];

  constructor(){
  }

  wait = (msec:number) => new Promise((resolve, _reject) => setTimeout(resolve, msec))

  async exec():Promise<void>{
    if(document.domain.indexOf("eagate.573.jp") === -1){
      return alert("対応外のページです。");
    }
    //await this.getter.get();
    const dani = await this.getter.getDaniList();
    const list = dani.list;
    let songsList:{[key:string]:number[]} = {};
    for(let i =0; i < list.length; ++i){
      this.getter.setRivalId(list[i]["rival"]);
      for(let j =0; j < 8; ++j){
        this.getter.setOffset(j);
        console.log(i,list[i]["rival"],"offset:" + j * 50)
        //await this.wait(200);
        const body = await this.getter.get();
        const b = this.scraper.setRawBody(body).exec();
        Object.keys(b).map(item=>{
          if(!songsList[item]){
            songsList[item] = [b[item]];
          }else{
            songsList[item].push(b[item]);
          }
        })
      }
    }
    console.log(songsList,JSON.stringify(songsList));

  }

  showResult(){
    console.log(this.result);
    document.body.innerHTML = JSON.stringify(this.result);
  }

}

class Getter {

  private diff:number = 11;
  private offset:number = 0;
  private rivalId:string = "";

  setDiff(val:number){
    this.diff = val;
  }

  setOffset(val:number){
    this.offset = (val) * 50;
  }

  setRivalId(val:string){
    this.rivalId = val;
  }

  parseBlob(blob:any):Promise<string>{
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => { resolve(reader.result as string) };
        reader.readAsText(blob, 'shift-jis');
    });
  }

  async get():Promise<any>{
    try{
      console.log(this.rivalId)
      const res = await fetch(`https://p.eagate.573.jp/game/2dx/27/djdata/music/difficulty_rival.html?rival=${this.rivalId}&difficult=${this.diff}&style=0&disp=1&offset=${this.offset}`,{
        method:"GET",
        credentials: "same-origin",
      })
      if(!res.ok || res.status !== 200){
        throw new Error(`statuscode:${res.status}`);
      }
      const text = (await this.parseBlob(await res.blob()));
      return text;
    }catch(e){
      console.log(e);
      alert("error!");
    }
  }

  async getDaniList():Promise<any>{
    try{
      const obj:{[key:string]:string} = {
        "grade_id":"18",
        "play_style":"0",
        "page":"0",
        "limit":"5000",
        "release_9_10_kaiden":"2",
      };
      let res = await fetch(
        `https://p.eagate.573.jp/game/2dx/27/ranking/json/dani.html?grade_id=${obj["grade_id"]}&play_style=${obj["play_style"]}&page=${obj["page"]}&limit=${obj["limit"]}&release_9_10_kaiden=${obj["release_9_10_kaiden"]}`,
        {
        method:"POST",
        credentials: "same-origin",
        }
      );
      if(!res.ok || res.status !== 200){
        throw new Error(`statuscode:${res.status}`);
      }
      const json = JSON.parse(await this.parseBlob(await res.blob()));
      return json;
    }catch(e){
      console.log(e);
    }
  }

}

interface songs {[key:string]:number}

class Scraper{

  private rawBody:string = "";

  setRawBody(input:string){
    this.rawBody = input;
    return this;
  }

  exec(){
    this.getTable();
    return this.getEachSongs();
  }

  getTable(){
    const matcher = this.rawBody.match(/<div class="series-difficulty">.*?<div id="page-top">/);
    this.setRawBody((!matcher || matcher.length === 0) ? "" : matcher[0]);
    return this;
  }

  getEachSongs():songs{
    if(!this.rawBody){
      return {};
    }
    let res:songs = {};
    const matcher = this.rawBody.match(/<tr>.*?<\/tr>/g);
    if(!matcher){return {};}
    for(let key in matcher){
      const eachSong = matcher[key];
      const _matcher = eachSong.match(/(?<=<td>).*?(?=<\/td>)/g);
      if(_matcher){
        const songName = _matcher[0].match(/(?<=\"music_win\">).*?(?=<\/a>)/);
        if(songName){
          const score = _matcher[3].split(/<br>/);
          if(score && score[0] !== "0"){
            res[songName[0]] = Number(score[0]);
          }
        }
      }
    }
    return res;
  }

}

const init = new Main();
init.exec();
