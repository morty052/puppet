import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

// async function usePuppet(params) {
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();

//   await page.goto("https://www.fastpeoplesearch.com");

//   await page.setViewport({ width: 1080, height: 1024 });

//   await page.type(".autocomplete-lastname-defer", "Mike Tomlin");
//   await page.click(".search-form-button-submit");

//   await page.waitForSelector(".link-to-details");
//   //   await page.click(".link-to-details");

//   //   await Promise.all([
//   //     page.click(".link-to-details"),
//   //     page.waitForNavigation(), // Wait for navigation to complete
//   //   ]);

//   const result = await page.evaluate(() => {
//     const cardBlocks = Array.from(document.querySelectorAll(".card-block"));
//     const texts = cardBlocks.flatMap((cardBlock) =>
//       Array.from(cardBlock.querySelectorAll(".larger")).map((span) =>
//         span.textContent.trim()
//       )
//     );
//     const addys = cardBlocks.flatMap((cardBlock) =>
//       Array.from(cardBlock.querySelectorAll("a"))
//         .filter((span) =>
//           // span.textContent.trim()
//           //   span.href.includes("address")
//           span.title.includes("living at")
//         )
//         .map((span) => span.textContent.trim().replace("\n", " "))
//     );

//     const people = Array.from(texts).map((span, index) => ({
//       name: texts[index],
//       address: addys[index],
//     }));

//     return people;
//   });

//   console.log(result);

//   async function checkPage(index) {
//     await Promise.all([
//       page.click(".link-to-details"),
//       page.waitForNavigation(),
//       // Wait for navigation to complete
//     ]);

//     const result = await page.evaluate(() => {
//       const emailDiv = document.querySelector(".detail-box-email");
//       const rowDiv = emailDiv.querySelector(".row");
//       const h3Elements = rowDiv.querySelectorAll("h3");

//       const texts = [...h3Elements].map((h3) => h3.textContent.trim());
//       return texts;
//     });
//     console.log(result);
//     await page.goBack(), console.log("clicked");
//     await page.waitForNavigation();
//   }

//   result.forEach(checkPage);

//   //   await page.waitForNavigation();

//   const screenshot = await page.screenshot({
//     path: "example.png",
//     fullPage: true,
//   });

//   //   await browser.close();
// }

async function usePuppet(params) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://www.fastpeoplesearch.com");

  await page.setViewport({ width: 1080, height: 1024 });

  await page.type(".autocomplete-lastname-defer", "Mike Tomlin");
  await page.click(".search-form-button-submit");

  await page.waitForSelector(".link-to-details");

  const result = await page.evaluate(() => {
    const cardBlocks = Array.from(document.querySelectorAll(".card-block"));
    const people = cardBlocks.map((cardBlock) => {
      const name = cardBlock.querySelector(".larger").textContent.trim();
      const address = cardBlock
        .querySelector("a[title*='living at']")
        .textContent.trim()
        .replace("\n", " ");
      return { name, address };
    });
    return people;
  });

  const links = await page.evaluate((i) => {
    const links = Array.from(document.querySelectorAll(".link-to-details"));
    links.forEach((link, index) => {
      link.classList.add(`link-${index}`);
    });

    const stuff = links.map((link, index) => {
      return link.classList;
    });
    return stuff;
  });

  console.log(links);

  let allEmails = [];

  for (let i = 0; i < result.length; i++) {
    // if (i != 0) {
    //   await page.waitForNavigation();
    // }
    await page.waitForSelector(".link-to-details");
    await page.evaluate((i) => {
      const links = Array.from(document.querySelectorAll(".link-to-details"));
      links.forEach((link, index) => {
        link.classList.add(`link-${index}`);
      });
      return links;
    });
    await Promise.all([
      page.click(`.link-${i}`),
      page.waitForNavigation({ timeout: 60000 }),
      // Wait for navigation to complete
    ]);

    try {
      const emails = await page.evaluate(() => {
        const emailDiv = document.querySelector(".detail-box-email");
        const rowDiv = emailDiv.querySelector(".row");
        const h3Elements = rowDiv.querySelectorAll("h3");
        const texts = [...h3Elements].map((h3) => h3.textContent.trim());
        return texts;
      });

      const person = {
        name: result[i].name,
        emails: emails,
        address: result[i].address,
      };

      allEmails.push(person);
    } catch (error) {
      console.log(error);
    }

    await page.goBack();
    // await page.waitForNavigation();
    await page.waitForSelector(".link-to-details");
  }

  try {
    console.log(allEmails);
  } catch (error) {
    console.log(error);
  }
  // const screenshot = await page.screenshot({
  //   path: "example.png",
  //   fullPage: true,
  // });

  await browser.close();
}

usePuppet();
