import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://blogtruyen.vn/27113/khi-anh-hung-moi-chinh-la-ac-quy');
  await page.waitForSelector('.manga-detail');
  // get name of manga
  const elementNameManga = await page.$('.entry-title > a');
  const nameManga = await elementNameManga.getProperty('textContent');
  // get image thumbnail of manga
  const elementThumbnail = await page.$('.thumbnail > img');
  const thumbnail = await page.evaluate(el => el.getAttribute("src"), elementThumbnail);
  // get decription of manga
  const elementDesc = await page.$('.detail > .content');
  const desc = await page.evaluate(el => String(el?.textContent).trim(), elementDesc);
  // get name other of manga
  const elementNameOther = await page.$('.description span.color-red');
  const nameOther = await page.evaluate(el => String(el?.textContent).trim(), elementNameOther);
  // get name author of manga
  const elementNameAuthor = await page.$('.description a.label.label-info');
  const nameAuthor = await page.evaluate(el => String(el?.textContent).trim(), elementNameAuthor);
  // get team translate of manga
  const elementTeamTranslate = await page.$('.description span.translater a');
  const teamTranslate = await page.evaluate(el => String(el?.textContent).trim(), elementTeamTranslate);
  // get category of manga
  const elementCategory = await page.$$eval('.description p span.category a', (categorys) => categorys.map(category => category?.textContent));
  // get user post manga of manga on blogtruyen
  const elementUserPost = await page.$('.description p a.color-u-1');
  const userPost = await page.evaluate(el => { return { name: String(el?.textContent).trim(), linkUserOnBlogTruyen: el.getAttribute('href') } }, elementUserPost);
  // get user post last entry update manga of manga on blogtruyen
  const elementLastEntryUpdate = await page.$('.description .col-sm-6 span.color-green');
  const lastEntryUpdate = await page.evaluate(el => { 
    const dateTemp = String(el?.textContent).trim().split(' ');
    return { 
      data: dateTemp[0], 
      hour: dateTemp[1] 
    } 
  }, elementLastEntryUpdate);

  console.log('Name manga:', nameManga._remoteObject.value);
  console.log('Thumbnail:', thumbnail);
  console.log('Desc:', desc);
  console.log('Name other:', nameOther);
  console.log('Name author:', nameAuthor);
  console.log('Team translate:', teamTranslate);
  console.log('Category manga:', elementCategory);
  console.log('User post:', userPost.name);
  console.log('Link User post:', userPost.linkUserOnBlogTruyen);
  console.log('Date last entry update:', lastEntryUpdate);
  await browser.close();
})();