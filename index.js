import axios from "axios";
import * as cheerio from "cheerio";
import express from "express";
import cron from "node-cron";
import mongoose from "mongoose";
import 'dotenv/config';
import puppeteer from "puppeteer";

const urls = {
    "Xbox Controller": [
        {
            "A": "https://www.amazon.in/XBOX-Wireless-Controller-Windows-Devices/dp/B0F2NCQYTX/ref=sr_1_3?crid=CWV5QIHNXG8T&dib=eyJ2IjoiMSJ9.a6xh005b7mAjqFb38EIiLoYEQ4Mm6UW1Tfa0bLAFo7R0WAuZPfgSP5N9wbMuPfsLgQ4kJaP1MhE0cGDzkTjUXTN_LKCoWws3p7mawuNE0QIefIlGar6cVToEsoy0kUSnYuMGfrqEBiPxtQm2bnPz002FfY8jhB-rNmUFFxCJbUoRXCY3b94-QgtN7J_WGcGLPrxwh6rUsCD5Kda6fXiwzvDuHH560jAxT-ylSTD8qMI.lKuPrDToXDe6NETAvJxznSIBAN4qED9mXzpd1ZjMa68&dib_tag=se&keywords=xbox+controller+for+pc+wireless&qid=1758783838&sprefix=%2Caps%2C406&sr=8-3",
            "F": "https://www.flipkart.com/microsoft-xbox-series-x-s-wireless-controller-joystick-gamepad-motion/p/itm4e3f1aba233ed?pid=ACCGYWK42HGBTRHG&lid=LSTACCGYWK42HGBTRHGA57ZLE&marketplace=FLIPKART&q=xbox+controller&store=4rr%2Fkm5%2Fr39&srno=s_1_13&otracker=search&otracker1=search&fm=Search&iid=280329bb-c4fd-4d7b-8018-f1c2f85ab189.ACCGYWK42HGBTRHG.SEARCH&ppt=sp&ppn=sp&ssid=4r0f8swl29o4ny0w1759002292084&qH=29c89c2648eceff6"
        },
        {
            "A": "https://www.amazon.in/XBOX-Wireless-Controller-Windows-Devices/dp/B0F2NC69KK/ref=asc_df_B0F2NC69KK?mcid=5479dca6d67a3df694a461f56149d77e&tag=googleshopdes-21&linkCode=df0&hvadid=709856235279&hvpos=&hvnetw=g&hvrand=10400310680892745832&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=9061936&hvtargid=pla-2422845771537&psc=1&gad_source=1",
            "F": "https://www.flipkart.com/microsoft-xbox-series-x-s-wireless-controller-joystick-gamepad-motion/p/itm4e3f1aba233ed?pid=ACCGYWMHHHH4VRTS&lid=LSTACCGYWMHHHH4VRTSGUBEXB&marketplace=FLIPKART&q=xbox+controller&store=4rr%2Fkm5%2Fr39&srno=s_1_5&otracker=search&otracker1=search&fm=Search&iid=280329bb-c4fd-4d7b-8018-f1c2f85ab189.ACCGYWMHHHH4VRTS.SEARCH&ppt=sp&ppn=sp&ssid=4r0f8swl29o4ny0w1759002292084&qH=29c89c2648eceff6"
        },
        {
            "A": "https://www.amazon.in/Microsoft-Wireless-Controller-Windows-Devices/dp/B0859XX6HC/ref=asc_df_B0859XX6HC?mcid=6601d9c03fae3e6fa4d3b4e2aed97200&tag=googleshopdes-21&linkCode=df0&hvadid=709856235291&hvpos=&hvnetw=g&hvrand=3005275834703029423&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=9061936&hvtargid=pla-1162093702697&psc=1&gad_source=1",
            "F": "https://www.flipkart.com/microsoft-xbox-s-x-wireless-controller-gamepad/p/itm538873e868073?pid=ACCGFSB9GKHT5FYK&lid=LSTACCGFSB9GKHT5FYK4JM6JN&marketplace=FLIPKART&q=xbox+controller+red&store=4rr%2Fkm5%2Fr39&srno=s_1_1&otracker=search&otracker1=search&fm=Search&iid=5a6cac1c-0a0c-4823-9b6f-2268ada5a27d.ACCGFSB9GKHT5FYK.SEARCH&ppt=sp&ppn=sp&ssid=opgm4ntm4nb6598g1759002686939&qH=6f027f4265983fdc"
        },
        {
            "A": "https://www.amazon.in/Microsoft-Xbox-Wireless-Controller-Velocity/dp/B0BYJMXHR3/ref=sr_1_52?dib=eyJ2IjoiMSJ9.ZYrGb1fhPVUDVryxP9bEIFlu4ayFLoX_n7K5OdlAEw5KeXf-b8lgi19LTU4t3wxJg5KbCAs8ZS9jBp-Fvwnj2_TF9sDo4Ay3Fbt6fc1SxsgDvXz9F-3lHoel_s_zBn4CLhuYdYt_YB82mDy89v9GhmRUMCR_mIAP4hdB_wP7_-GhL6mV9Six5qynWCcT88h9cSbmpYbZ_9T_xVLTaV2fJ3_2LuNmUuB8nQirbphKVj9MGKixFUtcZC9cGAhVgXF4d29nDMxfSbTdVedVY0Hh-rhtXn66XdgI_0-jv7w-TXM.5XWRaKOh10Gf2Hne_Ysm_St49oyCXIXGHKH3u74AokQ&dib_tag=se&qid=1758809396&refinements=p_89%3AMicrosoft&sr=8-52&srs=83159015031&xpid=N02VJ_p91qdDi",
            "F": null
        },

    ],
    "PS5 Controller": [
        {
            "A": "https://www.amazon.in/DualSense-Wireless-Controller-PlayStation-White/dp/B08GZ6QNTC/ref=sr_1_2?crid=M1I7JG23CSDK&dib=eyJ2IjoiMSJ9.mlEXdBGseypru5gfvv3h9D0EFa0AOj8kRaLYa4oj5aGZlpOtQRD99HOyPb2LLWdnu589NVBSAPOwv--BME3ZK44kYYgLWwdsM70pPYkh9NwPkH-iq_96LBZiDWi8lacE3tmp9Hkt9zgBuVAcSRAX-D07a7wlNrTvbZg1n856svmoGHlnYAlrkLn1FsSp9y1jNobbN7DH--XlJeoMUB91NQBx3xROc0cCw66QE1RgL5w.2M6-W1txZH7S8Qv_8tY1ckMp8TakmG2yN1DmhyxSLmw&dib_tag=se&keywords=ps5+controller&qid=1758783885&sprefix=ps5+con%2Caps%2C966&sr=8-2",
            "F": "https://www.flipkart.com/sony-ps5-dualsense-wireless-controller/p/itm236e858323977?pid=ACCFZ552CD5VPNFQ&lid=LSTACCFZ552CD5VPNFQ5G4HUS&marketplace=FLIPKART&q=ps5+controller&store=4rr%2Fkm5%2Fr39&spotlightTagId=default_BestsellerId_4rr%2Fkm5%2Fr39&srno=s_1_1&otracker=search&otracker1=search&fm=Search&iid=b5509e0b-adb7-422b-b856-28a546f32889.ACCFZ552CD5VPNFQ.SEARCH&ppt=sp&ppn=sp&ssid=ev71zm6v2m81pszk1759002728636&qH=8c05184b069f4990"
        },
        {
            "A": "https://www.amazon.in/Sony-DualSense-Controller-Grey-PlayStation/dp/B0BQXZ11B8/ref=asc_df_B0BQXZ11B8?mcid=d8d3b01794013dea96b68178b2ca5fea&tag=googleshopdes-21&linkCode=df0&hvadid=709856235291&hvpos=&hvnetw=g&hvrand=2128592959874100535&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=9061936&hvtargid=pla-1945925233334&psc=1&gad_source=1",
            "F": "https://www.flipkart.com/sony-dualsense-controller-gamepad/p/itmd7ebbd0c9a3da?pid=ACCGSGC7E2KNTVZD&lid=LSTACCGSGC7E2KNTVZDOTUABN&marketplace=FLIPKART&q=ps5+controller&store=4rr%2Fkm5%2Fr39&srno=s_1_2&otracker=search&otracker1=search&fm=Search&iid=13ce0fd7-f5e1-4a7d-8239-7ed28363418c.ACCGSGC7E2KNTVZD.SEARCH&ppt=sp&ppn=sp&ssid=jjqrg2z74eu1bmkg1759002763915&qH=8c05184b069f4990"
        },
        {
            "A": "https://www.amazon.in/DualSense-Wireless-Controller-Red-PlayStation/dp/B098439Y2G/ref=ast_sto_dp_puis",
            "F": "https://www.flipkart.com/playstation-sony-ps5-controller-dualsense-wireless-bluetooth-gamepad/p/itm31c02e490ff73?pid=ACCHAP6TPAKXYDMG&lid=LSTACCHAP6TPAKXYDMGIPGRTH&marketplace=FLIPKART&q=ps5+controller&store=4rr%2Fkm5%2Fr39&srno=s_1_6&otracker=search&otracker1=search&fm=Search&iid=13ce0fd7-f5e1-4a7d-8239-7ed28363418c.ACCHAP6TPAKXYDMG.SEARCH&ppt=sp&ppn=sp&ssid=jjqrg2z74eu1bmkg1759002763915&qH=8c05184b069f4990"
        },
        {
            "A": "https://www.amazon.in/Sony-DualSense-Wireless-Controller-Playstation/dp/B0CM3F28YR/ref=ast_sto_dp_puis",
            "F": "https://www.flipkart.com/playstation-sony-ps5-controller-metallic-editionsony-dualsense-wireless-bluetooth-gamepad/p/itm3a1d9dab9f0e2?pid=ACCHAZZKSHZEQFSJ&lid=LSTACCHAZZKSHZEQFSJHQK2IG&marketplace=FLIPKART&q=ps5+controller&store=4rr%2Fkm5%2Fr39&srno=s_1_8&otracker=search&otracker1=search&fm=Search&iid=13ce0fd7-f5e1-4a7d-8239-7ed28363418c.ACCHAZZKSHZEQFSJ.SEARCH&ppt=sp&ppn=sp&ssid=jjqrg2z74eu1bmkg1759002763915&qH=8c05184b069f4990"
        },
        {
            "A": "https://www.amazon.in/Sony-Dualsense-Sterling-Wireless-Controller/dp/B0CRYKNBSD/ref=ast_sto_dp_puis",
            "F": null
        },
        {
            "A": "https://www.amazon.in/Sony-PlayStation-Dualsense-Wireless-Controller/dp/B0DJSZH7R3/ref=ast_sto_dp_puis",
            "F": "https://www.flipkart.com/playstation-sony-ps5-controller-metallic-editionsony-dualsense-wireless-bluetooth-gamepad/p/itm3a1d9dab9f0e2?pid=ACCHAZZKSHZEQFSJ&lid=LSTACCHAZZKSHZEQFSJHQK2IG&marketplace=FLIPKART&q=ps5+controller+indigo&store=4rr%2Fkm5%2Fr39&srno=s_1_1&otracker=search&otracker1=search&fm=Search&iid=fb9f279e-c68b-4288-836b-de95f6db3813.ACCHAZZKSHZEQFSJ.SEARCH&ppt=sp&ppn=sp&ssid=w5er5z98d8bdmigw1759002855083&qH=38c0a760754421e0"
        }
    ]
};

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/priceTracker";

// ========== MongoDB Setup ==========
const historySchema = new mongoose.Schema({
    source: { type: String, enum: ["Amazon", "Flipkart"], required: true },
    price_INR: { type: Number, default: null },
    price_USD: { type: Number, default: null },
    date: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
    name: String,
    product_image: String,
    url: String,
    category: String,
    history: [historySchema]
});

const Product = mongoose.model("Product", productSchema);

// Connect DB
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("| ✅ MongoDB connected"))
    .catch(err => console.error("| ❌ MongoDB error:", err));

//========== Scraper ==========

let browser;

async function getBrowser() {
    if (!browser) {
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: puppeteer.executablePath(),
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
    }
    return browser;
}

process.on("exit", async () => {
    if (browser) await browser.close();
});

async function scrapeWebsite(url, category, now, type) {
    try {
        let title = null;
        let product_image = null;
        let price_inr = null;
        let price_usd = null;
        let source = null;

        if (type === "Amazon") {
            // ===== AMAZON SCRAPER =====
            source = "Amazon";
            const response = await axios.get(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
                    "Accept-Language": "en-IN,en;q=0.9"
                }
            });

            const html = response.data;
            const $ = cheerio.load(html);

            const rawPrice = $(".priceToPay .a-price-whole").first().text().replace(/,/g, "");
            price_inr = rawPrice ? parseInt(rawPrice) : null;

            title = $(".product-title-word-break").first().text().split(",")[0].trim() || null;
            product_image = $(".a-dynamic-image").first().attr("src") || null;

        } else if (type === "Flipkart") {
            // ===== FLIPKART SCRAPER =====
            source = "Flipkart";
            const browser = await getBrowser();
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: "domcontentloaded" });

            const product = await page.evaluate(() => {
                const safeText = (selector) =>
                    document.querySelector(selector)?.innerText.trim() || null;

                const title = safeText("span.VU-ZEz, span.B_NuCI");
                const currentPriceRaw = safeText("div.Nx9bqj.CxhGGd, ._30jeq3._16Jk6d");
                const currentPrice = currentPriceRaw
                    ? parseInt(currentPriceRaw.replace(/[^0-9]/g, ""))
                    : null;

                return { title, currentPrice };
            });

            await browser.close();
            title = product.title;
            price_inr = product.currentPrice;
            product_image = null; // Flipkart image scraper can be added later
        } else {
            console.log("| ⚠️ Unknown site, skipping:", url);
            return;
        }

        // === Currency Conversion ===
        const curr = await (await fetch("https://latest.currency-api.pages.dev/v1/currencies/inr.json")).json();
        price_usd = price_inr ? price_inr * curr.inr.usd : null;

        // === Save to DB ===
        if (!title) {
            console.log("| ❌ Could not fetch product title for:", url);
            return;
        }

        let product = await Product.findOne({ name: title });
        if (!product) {
            product = new Product({
                name: title,
                product_image,
                url,
                category,
                history: []
            });
            console.log(`| 🆕 Added new product: ${title} (${source}, category: ${category})`);
        }

        const safeNumber = (value) => (Number.isFinite(value) ? value : null);

        product.history.push({
            source,
            price_INR: safeNumber(price_inr),
            price_USD: safeNumber(price_usd),
            date: now
        });

        await product.save();
        console.log(`| 🔄 ${source} Price recorded: ${title} → ${price_inr ?? "null"} INR | ${price_usd?.toFixed(2) ?? "null"} USD`);
    } catch (error) {
        console.error("| ❌ Error scraping:", error.message, "| URL:", url);
    }
}

async function scrapeWebsites() {
    console.log("===== Running scraper at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), "=====");
    const now = new Date();
    for (const [category, links] of Object.entries(urls)) {
        for (const site of links) {
            if (site.A) await scrapeWebsite(site.A, category, now, "Amazon");
            if (site.F) await scrapeWebsite(site.F, category, now, "Flipkart");
        }
    }
    console.log("Done scraping.\n");
}

async function cleanPriceHistory() {
    console.log(
        "===== Running price history cleanup at",
        new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        "====="
    );

    try {
        const products = await Product.find({});
        for (const product of products) {
            const originalCount = product.history.length;
            if (originalCount <= 2) continue;

            const grouped = {
                Amazon: product.history.filter(h => h.source === "Amazon").sort((a, b) => a.date - b.date),
                Flipkart: product.history.filter(h => h.source === "Flipkart").sort((a, b) => a.date - b.date),
            };

            const cleanedHistory = [];

            for (const source of ["Amazon", "Flipkart"]) {
                const entries = grouped[source];
                if (!entries || entries.length === 0) continue;

                const cleaned = [];
                cleaned.push(entries[0]);

                for (let i = 1; i < entries.length - 1; i++) {
                    const prevPrice = entries[i - 1].price_INR;
                    const currentPrice = entries[i].price_INR;
                    const nextPrice = entries[i + 1].price_INR;

                    if (!(areEqual(currentPrice, prevPrice) && areEqual(currentPrice, nextPrice))) {
                        cleaned.push(entries[i]);
                    }
                }

                cleaned.push(entries[entries.length - 1]);
                cleanedHistory.push(...cleaned);
            }

            cleanedHistory.sort((a, b) => a.date - b.date);

            if (cleanedHistory.length < originalCount) {
                product.history = cleanedHistory;
                await product.save();
                console.log(
                    `| ✨ Cleaned ${product.name}: Removed ${originalCount - cleanedHistory.length} redundant entries.`
                );
            }
        }
    } catch (error) {
        console.error("| ❌ Error cleaning price history:", error.message);
    }
    console.log("Done cleaning.\n");
}

function areEqual(a, b) {
    if (a === null && b === null) return true;
    return a === b;
}

// Schedule scraper (every 30 minutes)
cron.schedule("*/15 * * * *", scrapeWebsites);
cron.schedule("5 */6 * * *", cleanPriceHistory);

// Serve HTML page
app.get("/", async (req, res) => {
    try {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 Price Tracker Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <div>hi</div>
</body>
</html>`;

        res.send(html);
    } catch (err) {
        console.error("❌ Error rendering dashboard:", err.message);
        res.status(500).send("Internal Server Error");
    }
});

// ========== Start Server ==========
app.listen(PORT, () => {
    console.log(`| 🚀 Server running on http://localhost:${PORT}`);
});