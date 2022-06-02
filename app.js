import puppeteer from "puppeteer";
import fs from 'fs';
// import { dirname } from 'path';
// import { fileURLToPath } from 'url';

import downloadListImage from './downloads.js';
import { removeAccents } from './helper.js';

const mangaTarget = "https://blogtruyen.vn/9947/yeu-than-ky";
const cloneChapterStart = undefined || undefined; // undefined or typeof number
const cloneChapterEnd = undefined || undefined; // undefined or typeof number
const rootPath = 'E:/Download';

const runClone = async () => {
  try {
    
    console.time('>>> DOWNLOAD TOTAL TIME');

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--disable-software-rasterizer", "--disable-gpu"],
    });
    const page = await browser.newPage();
    await page.goto(mangaTarget);
    await page.waitForSelector(".manga-detail");
    // get name of manga
    const elementNameManga = await page.$(".entry-title > a");
    const nameManga = await elementNameManga.getProperty("textContent");
    // get image thumbnail of manga
    const elementThumbnail = await page.$(".thumbnail > img");
    const thumbNail = await page.evaluate(
      (el) => el.getAttribute("src"),
      elementThumbnail
    );
    // get decription of manga
    const elementDesc = await page.$(".detail > .content");
    const desc = await page.evaluate(
      (el) => String(el?.textContent).trim(),
      elementDesc
    );
    // get name other of manga
    const elementNameOther = await page.$(".description span.color-red");
    const nameOther = await page.evaluate(
      (el) => String(el?.textContent).trim(),
      elementNameOther
    );
    // get name author of manga
    const elementNameAuthor = await page.$(".description a.label.label-info");
    const nameAuthor = await page.evaluate(
      (el) => String(el?.textContent).trim(),
      elementNameAuthor
    );
    // get team translate of manga
    const elementTeamTranslate = await page.$(".description span.translater a");
    const teamTranslate = await page.evaluate(
      (el) => String(el?.textContent).trim(),
      elementTeamTranslate
    );
    // get category of manga
    const elementCategory = await page.$$eval(
      ".description p span.category a",
      (categorys) => categorys.map((category) => category?.textContent)
    );
    // get user post manga of manga on blogtruyen
    const elementUserPost = await page.$(".description p a.color-u-1");
    const userPost = await page.evaluate((el) => {
      return {
        name: String(el?.textContent).trim(),
        linkUserOnBlogTruyen: el.getAttribute("href"),
      };
    }, elementUserPost);
    // get user post last entry update manga of manga on blogtruyen
    const elementLastEntryUpdate = await page.$(
      ".description .col-sm-6 span.color-green"
    );
    const lastEntryUpdate = await page.evaluate((el) => {
      const dateTemp = String(el?.textContent).trim().split(" ");
      return {
        data: dateTemp[0],
        hour: dateTemp[1],
      };
    }, elementLastEntryUpdate);
    // get all element chapter of manga on blogtruyen
    let chapters = await page.$$eval(
      "#list-chapters > p > span.title > a",
      (elements, cloneChapterStart, cloneChapterEnd) => {
        elements = elements.reverse();
        return elements.map((item, index) => {
          if (
            (cloneChapterStart === undefined &&
              cloneChapterEnd === undefined) ||
            (index + 1 >= cloneChapterStart && index + 1 <= cloneChapterEnd)
          ) {
            return {
              nameChapter: item.textContent,
              linkChapter: "https://blogtruyen.vn" + item.getAttribute("href"),
            };
          }
        });
      },
      cloneChapterStart,
      cloneChapterEnd
    );

    // filter list chapter is null
    chapters = chapters.filter((value) => value !== null);

    // prints a array of text
    Promise.all(chapters).then(async (chapters) => {
      let start = 0;
      let pathManga = `${rootPath}/${removeAccents(nameManga._remoteObject.value)}`
      if (fs.existsSync(pathManga)) {
        // remove directory
        fs.rmSync(pathManga, { recursive: true, force: true });
      }
      fs.mkdirSync(pathManga, { recursive: true });

      for (let index = 0; index < chapters.length; index++) {
        // console.log(chapter);
        if (chapters[index] === null) {
          continue;
        }
        let status = false;
        let initPathChapter = `${pathManga}/${removeAccents(chapters[index].nameChapter.split(' ').join('-'))}/`
        fs.mkdirSync(initPathChapter, { recursive: true });
        do {
          try {
            const page = await browser.newPage();
            await page.goto(chapters[index].linkChapter);
            await page.waitForSelector("#content");
            const images = await page.$$eval("#content > img", (elements) => {
              return elements.map((item) => item.getAttribute("src"));
            });
            
            const infoResponseFromDownload = await downloadListImage(images, initPathChapter);
            chapters[index].infoSave = infoResponseFromDownload;

            chapters[index].images = images;
            await page.close();
            status = false;
          } catch (error) {
            console.log(error);
            status = true;
          }
        } while (status);
      }
      await browser.close();
      
      let sumItUp = {};
      sumItUp.nameManga = nameManga._remoteObject.value
      sumItUp.thumbNail = thumbNail
      sumItUp.desc = desc
      sumItUp.nameOther = nameOther
      sumItUp.nameAuthor = nameAuthor
      sumItUp.teamTranslate = teamTranslate
      sumItUp.elementCategory = elementCategory
      sumItUp.userPost = { name: userPost.name, linkUserOnBlogTruyen: userPost.linkUserOnBlogTruyen }
      sumItUp.lastEntryUpdate = lastEntryUpdate
      sumItUp.chapters = chapters

      const jsonParse = JSON.stringify(sumItUp);

      fs.writeFileSync(`${pathManga}/info.json`, jsonParse, { mode: 777 });

      console.log('<=< Saved File! >=>');
      console.log('Clone is done it up!');

      console.timeEnd('>>> DOWNLOAD TOTAL TIME');
    });
    
  } catch (error) {
    console.log(error);
  }
}

if (typeof cloneChapterEnd === 'number' && typeof cloneChapterStart === 'number') {
  if(cloneChapterEnd >= cloneChapterStart) {
    runClone();
  }else {
    console.log(`Chapter end: ${cloneChapterEnd} is smaller than chapter start: ${cloneChapterStart}`)
  }
} else if(typeof cloneChapterEnd === 'undefined' && typeof cloneChapterStart === 'undefined') {
  runClone();
}else {
  console.log(`Chapter end: ${cloneChapterEnd} different typeof data: ${cloneChapterStart}`)
}
