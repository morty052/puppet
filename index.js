import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";

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
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function usePuppet(props) {
  const { name, city, targets } = props;
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  async function ScrapeNames(name, city) {
    try {
      await page.type(".autocomplete-lastname-defer", `${name}`);
      await page.type("#search-name-address", `${city}`);
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

      // const links = await page.evaluate((i) => {
      //   const links = Array.from(document.querySelectorAll(".link-to-details"));
      //   links.forEach((link, index) => {
      //     link.classList.add(`link-${index}`);
      //   });

      //   const stuff = links.map((link, index) => {
      //     return link.classList;
      //   });
      //   return stuff;
      // });

      let allEmails = [];

      for (let i = 0; i < result.length; i++) {
        try {
          await page.waitForSelector(".link-to-details", { timeout: 5000 });
          await page.evaluate((i) => {
            const links = Array.from(
              document.querySelectorAll(".link-to-details")
            );
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

          await page.waitForSelector("text/Email Addresses", { timeout: 5000 });
          const emails = await page.evaluate(() => {
            const emailDiv = document?.querySelector(".detail-box-email");
            const rowDiv = emailDiv?.querySelector(".row");
            const h3Elements = rowDiv?.querySelectorAll("h3");
            const texts = [...h3Elements].map((h3) => h3.textContent.trim());
            return texts;
          });

          const fullNameSelector = await page.waitForSelector(".fullname");

          const fullTitle = await fullNameSelector?.evaluate((el) =>
            el.textContent.trim()
          );

          const person = {
            name: fullTitle,
            emails: emails,
            address: result[i].address,
          };

          allEmails.push(person);

          console.log("scraped", person);

          await page.goBack();
        } catch (error) {
          if (error) {
            console.log("reloading from 1st suspect", error);
            await page.reload();
          }
        }
      }

      // try {
      //   console.log(allEmails);
      //   // Generate a unique filename
      //   const timestamp = new Date().getTime();
      //   const filename = `emails_${timestamp}.txt`;
      //   const filepath = path.resolve(__dirname, filename); // Change '__dirname' to the appropriate directory if needed

      //   // Write allEmails to a text file
      //   fs.writeFile(filepath, JSON.stringify(allEmails), (err) => {
      //     if (err) {
      //       console.log("Error writing to file:", err);
      //     } else {
      //       console.log(`Emails written to file: ${filename}`);
      //     }
      //   });
      // } catch (error) {
      //   console.log(error, "error");
      // }
      console.log(allEmails);
      return new Promise((resolve, reject) => {
        resolve(allEmails);
      });
    } catch (error) {
      console.log(error, "error");
    }
  }

  for (let i = 0; i < targets.length; i++) {
    await page.goto("https://www.fastpeoplesearch.com");
    await page.setViewport({ width: 1080, height: 1024 });
    const { name, city } = targets[i];
    await ScrapeNames(name, city);
  }

  await browser.close();
  // ScrapeNames(name, city);
}

async function useTwitter(params) {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto("https://twitter.com");

    await page.setViewport({ width: 1080, height: 600 });

    await page.waitForSelector("text/Sign in");

    await Promise.all([
      await page.click("text/Sign in"),
      // await page.waitForNavigation(),
    ]);

    await wait(2000);
    await page.waitForSelector("input[name='text']");
    await page.type("input[name='text']", "evilmorty052@proton.me");

    // await page.waitForSelector("input[name='password']");
    await page.click("text/Next");
    await wait(2000);
    await page.type("input[name='password']", "evilmorty2A.");

    await Promise.all([
      await page.click("text/Log in"),
      await page.waitForNavigation({ timeout: 60000 }),
    ]);

    await page.waitForSelector("text/Following");

    await wait(20000);

    const result = await page.evaluate(() => {
      const cardBlocks = Array.from(
        document.querySelectorAll("div[data-testid = 'cellInnerDiv']")
      );

      const tweets = cardBlocks.map((cardBlock) => {
        const name = cardBlock.querySelector(
          "div[data-testid = 'tweetText' ] span"
        );
        // .textContent.trim();
        return { name };
      });

      return {
        length: tweets.length,
        tweets: tweets,
      };
    });

    console.log(result);
  } catch (error) {
    console.log(error);
  }
}

const targets = [
  {
    name: "johan",
    city: "new york",
  },
  {
    name: "freddy",
    city: "los angeles",
  },
];

async function useGmail(params) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://www.gmail.com");

  await page.setViewport({ width: 1080, height: 600 });

  await page.waitForSelector("text/Create account");

  await page.click("text/Create account"),
    await page.waitForSelector("text/For my personal use");

  await page.click("text/For my personal use");

  await page.waitForSelector("input[name='firstName']");

  await wait(2000);

  await page.type("input[name='firstName']", "Mike");

  await wait(2000);

  await page.type("input[name='lastName']", "Tomlin");

  await page.click("text/Next");

  await page.waitForSelector("#month");

  await wait(2000);

  await page.type("#month", "january");

  await wait(2000);

  await page.type("input[name='day']", "10");

  await wait(2000);

  await page.type("input[name='year']", "1987");

  await wait(2000);

  await page.type("#gender", "Male");

  await wait(2000);

  await page.click("text/Next");

  // await wait(2000);

  // await page.waitForSelector("input[name='Username']");

  // await page.type("input[name='Username']", "abizugbe49876");

  // await wait(2000);

  // await page.click("text/Next");

  // await wait(2000);

  try {
    await page.waitForSelector("text/Create your own Gmail address", {
      timeout: 5000,
    });
    console.log("create your own Gmail address found");
    await page.click("text/Create your own Gmail address");
    await page.waitForSelector("input[name='Username']");
    await page.type("input[name='Username']", "abizugbe49876");
    await page.click("text/Next");

    await wait(2000);

    await page.waitForSelector("input[name='Passwd']");

    await page.type("input[name='Passwd']", "evilmorty2A.");

    await wait(2000);

    await page.waitForSelector("input[name='PasswdAgain']");

    await page.type("input[name='PasswdAgain']", "evilmorty2A.");

    await wait(2000);

    await page.click("text/Next");
  } catch (error) {
    console.log(error, "error: username came out first");
    await page.waitForSelector("input[name='Username']");
    await page.type("input[name='Username']", "abizugbe49876");
    await page.click("text/Next");

    await wait(2000);

    await page.waitForSelector("input[name='Passwd']");

    await page.type("input[name='Passwd']", "evilmorty2A.");

    await wait(2000);

    await page.waitForSelector("input[name='PasswdAgain']");

    await page.type("input[name='PasswdAgain']", "evilmorty2A.");

    await wait(2000);

    await page.click("text/Next");
  }
}

async function useAbstract(params) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://app.abstractapi.com/users/signup");

  await page.setViewport({ width: 1080, height: 600 });

  await page.waitForSelector("input[name='email']");

  await wait(2000);

  await page.type("input[name='email']", "tuna@dashrecruiters.com");

  await wait(2000);

  await page.type("input[name='password']", "evilmorty2A.");

  await wait(20000);

  // await page.click("text/ Continue");
}

useAbstract({});
