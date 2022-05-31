import puppeteer from "puppeteer";

const mangaTarget = "https://blogtruyen.vn/27435/kowloon-generic-romance";
const cloneChapterStart = 4 || undefined;
const cloneChapterEnd = 6 || undefined;

const runClone = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
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
    const thumbnail = await page.evaluate(
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
      for (let index = 0; index < chapters.length; index++) {
        // console.log(chapter);
        if (chapters[index] === null) {
          continue;
        }
        let status = false;
        do {
          try {
            const page = await browser.newPage();
            await page.goto(chapters[index].linkChapter);
            await page.waitForSelector("#content");
            const images = await page.$$eval("#content > img", (elements) => {
              return elements.map((item) => item.getAttribute("src"));
            });
            // const result = await page.evaluate(images => {
            //   // return Promise.resolve(8 * x);
            //   let a = document.createElement('a');
            //   for(let image of images) {
            //     let timeFile = Date.now();
            //     a.href = image;
            //     a.download = `image-${timeFile}.jpg`;
            //     a.click();
            //   }
            // }, images);
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
      
      console.log("Name manga:", nameManga._remoteObject.value);
      console.log("Thumbnail:", thumbnail);
      console.log("Desc:", desc);
      console.log("Name other:", nameOther);
      console.log("Name author:", nameAuthor);
      console.log("Team translate:", teamTranslate);
      console.log("Category manga:", elementCategory);
      console.log("User post:", userPost.name);
      console.log("Link User post:", userPost.linkUserOnBlogTruyen);
      console.log("Date last entry update:", lastEntryUpdate);
      console.log(chapters);
    });
    
  } catch (error) {
    console.log(error);
  }
}

if (cloneChapterEnd >= cloneChapterStart) {
  runClone();
}else {
  console.log(`Chapter end: ${cloneChapterEnd} is smaller than chapter start: ${cloneChapterStart}`)
}
