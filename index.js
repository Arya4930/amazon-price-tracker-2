import axios from "axios";
import * as cheerio from "cheerio";
import express from "express";
import cron from "node-cron";
import mongoose from "mongoose";
import 'dotenv/config';

const urls = {
    "Xbox Controller": [
        {
            "A": "https://www.amazon.in/XBOX-Wireless-Controller-Windows-Devices/dp/B0F2NCQYTX/ref=sr_1_3?crid=CWV5QIHNXG8T&dib=eyJ2IjoiMSJ9.a6xh005b7mAjqFb38EIiLoYEQ4Mm6UW1Tfa0bLAFo7R0WAuZPfgSP5N9wbMuPfsLgQ4kJaP1MhE0cGDzkTjUXTN_LKCoWws3p7mawuNE0QIefIlGar6cVToEsoy0kUSnYuMGfrqEBiPxtQm2bnPz002FfY8jhB-rNmUFFxCJbUoRXCY3b94-QgtN7J_WGcGLPrxwh6rUsCD5Kda6fXiwzvDuHH560jAxT-ylSTD8qMI.lKuPrDToXDe6NETAvJxznSIBAN4qED9mXzpd1ZjMa68&dib_tag=se&keywords=xbox+controller+for+pc+wireless&qid=1758783838&sprefix=%2Caps%2C406&sr=8-3",
            // "F": "https://www.flipkart.com/microsoft-xbox-series-x-s-wireless-controller-joystick-gamepad-motion/p/itm4e3f1aba233ed?pid=ACCGYWK42HGBTRHG&lid=LSTACCGYWK42HGBTRHGA57ZLE&marketplace=FLIPKART&q=xbox+controller&store=4rr%2Fkm5%2Fr39&srno=s_1_13&otracker=search&otracker1=search&fm=Search&iid=280329bb-c4fd-4d7b-8018-f1c2f85ab189.ACCGYWK42HGBTRHG.SEARCH&ppt=sp&ppn=sp&ssid=4r0f8swl29o4ny0w1759002292084&qH=29c89c2648eceff6"
        },
        {
            "A": "https://www.amazon.in/XBOX-Wireless-Controller-Windows-Devices/dp/B0F2NC69KK/ref=asc_df_B0F2NC69KK?mcid=5479dca6d67a3df694a461f56149d77e&tag=googleshopdes-21&linkCode=df0&hvadid=709856235279&hvpos=&hvnetw=g&hvrand=10400310680892745832&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=9061936&hvtargid=pla-2422845771537&psc=1&gad_source=1",
            // "F": "https://www.flipkart.com/microsoft-xbox-series-x-s-wireless-controller-joystick-gamepad-motion/p/itm4e3f1aba233ed?pid=ACCGYWMHHHH4VRTS&lid=LSTACCGYWMHHHH4VRTSGUBEXB&marketplace=FLIPKART&q=xbox+controller&store=4rr%2Fkm5%2Fr39&srno=s_1_5&otracker=search&otracker1=search&fm=Search&iid=280329bb-c4fd-4d7b-8018-f1c2f85ab189.ACCGYWMHHHH4VRTS.SEARCH&ppt=sp&ppn=sp&ssid=4r0f8swl29o4ny0w1759002292084&qH=29c89c2648eceff6"
        },
        {
            "A": "https://www.amazon.in/Microsoft-Wireless-Controller-Windows-Devices/dp/B0859XX6HC/ref=asc_df_B0859XX6HC?mcid=6601d9c03fae3e6fa4d3b4e2aed97200&tag=googleshopdes-21&linkCode=df0&hvadid=709856235291&hvpos=&hvnetw=g&hvrand=3005275834703029423&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=9061936&hvtargid=pla-1162093702697&psc=1&gad_source=1",
            // "F": "https://www.flipkart.com/microsoft-xbox-s-x-wireless-controller-gamepad/p/itm538873e868073?pid=ACCGFSB9GKHT5FYK&lid=LSTACCGFSB9GKHT5FYK4JM6JN&marketplace=FLIPKART&q=xbox+controller+red&store=4rr%2Fkm5%2Fr39&srno=s_1_1&otracker=search&otracker1=search&fm=Search&iid=5a6cac1c-0a0c-4823-9b6f-2268ada5a27d.ACCGFSB9GKHT5FYK.SEARCH&ppt=sp&ppn=sp&ssid=opgm4ntm4nb6598g1759002686939&qH=6f027f4265983fdc"
        },
        {
            "A": "https://www.amazon.in/Microsoft-Xbox-Wireless-Controller-Velocity/dp/B0BYJMXHR3/ref=sr_1_52?dib=eyJ2IjoiMSJ9.ZYrGb1fhPVUDVryxP9bEIFlu4ayFLoX_n7K5OdlAEw5KeXf-b8lgi19LTU4t3wxJg5KbCAs8ZS9jBp-Fvwnj2_TF9sDo4Ay3Fbt6fc1SxsgDvXz9F-3lHoel_s_zBn4CLhuYdYt_YB82mDy89v9GhmRUMCR_mIAP4hdB_wP7_-GhL6mV9Six5qynWCcT88h9cSbmpYbZ_9T_xVLTaV2fJ3_2LuNmUuB8nQirbphKVj9MGKixFUtcZC9cGAhVgXF4d29nDMxfSbTdVedVY0Hh-rhtXn66XdgI_0-jv7w-TXM.5XWRaKOh10Gf2Hne_Ysm_St49oyCXIXGHKH3u74AokQ&dib_tag=se&qid=1758809396&refinements=p_89%3AMicrosoft&sr=8-52&srs=83159015031&xpid=N02VJ_p91qdDi",
            "F": null
        },

    ],
    "PS5 Controller": [
        {
            "A": "https://www.amazon.in/DualSense-Wireless-Controller-PlayStation-White/dp/B08GZ6QNTC/ref=sr_1_2?crid=M1I7JG23CSDK&dib=eyJ2IjoiMSJ9.mlEXdBGseypru5gfvv3h9D0EFa0AOj8kRaLYa4oj5aGZlpOtQRD99HOyPb2LLWdnu589NVBSAPOwv--BME3ZK44kYYgLWwdsM70pPYkh9NwPkH-iq_96LBZiDWi8lacE3tmp9Hkt9zgBuVAcSRAX-D07a7wlNrTvbZg1n856svmoGHlnYAlrkLn1FsSp9y1jNobbN7DH--XlJeoMUB91NQBx3xROc0cCw66QE1RgL5w.2M6-W1txZH7S8Qv_8tY1ckMp8TakmG2yN1DmhyxSLmw&dib_tag=se&keywords=ps5+controller&qid=1758783885&sprefix=ps5+con%2Caps%2C966&sr=8-2",
            // "F": "https://www.flipkart.com/sony-ps5-dualsense-wireless-controller/p/itm236e858323977?pid=ACCFZ552CD5VPNFQ&lid=LSTACCFZ552CD5VPNFQ5G4HUS&marketplace=FLIPKART&q=ps5+controller&store=4rr%2Fkm5%2Fr39&spotlightTagId=default_BestsellerId_4rr%2Fkm5%2Fr39&srno=s_1_1&otracker=search&otracker1=search&fm=Search&iid=b5509e0b-adb7-422b-b856-28a546f32889.ACCFZ552CD5VPNFQ.SEARCH&ppt=sp&ppn=sp&ssid=ev71zm6v2m81pszk1759002728636&qH=8c05184b069f4990"
        },
        {
            "A": "https://www.amazon.in/Sony-DualSense-Controller-Grey-PlayStation/dp/B0BQXZ11B8/ref=asc_df_B0BQXZ11B8?mcid=d8d3b01794013dea96b68178b2ca5fea&tag=googleshopdes-21&linkCode=df0&hvadid=709856235291&hvpos=&hvnetw=g&hvrand=2128592959874100535&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=9061936&hvtargid=pla-1945925233334&psc=1&gad_source=1",
            // "F": "https://www.flipkart.com/sony-dualsense-controller-gamepad/p/itmd7ebbd0c9a3da?pid=ACCGSGC7E2KNTVZD&lid=LSTACCGSGC7E2KNTVZDOTUABN&marketplace=FLIPKART&q=ps5+controller&store=4rr%2Fkm5%2Fr39&srno=s_1_2&otracker=search&otracker1=search&fm=Search&iid=13ce0fd7-f5e1-4a7d-8239-7ed28363418c.ACCGSGC7E2KNTVZD.SEARCH&ppt=sp&ppn=sp&ssid=jjqrg2z74eu1bmkg1759002763915&qH=8c05184b069f4990"
        },
        {
            "A": "https://www.amazon.in/DualSense-Wireless-Controller-Red-PlayStation/dp/B098439Y2G/ref=ast_sto_dp_puis",
            // "F": "https://www.flipkart.com/playstation-sony-ps5-controller-dualsense-wireless-bluetooth-gamepad/p/itm31c02e490ff73?pid=ACCHAP6TPAKXYDMG&lid=LSTACCHAP6TPAKXYDMGIPGRTH&marketplace=FLIPKART&q=ps5+controller&store=4rr%2Fkm5%2Fr39&srno=s_1_6&otracker=search&otracker1=search&fm=Search&iid=13ce0fd7-f5e1-4a7d-8239-7ed28363418c.ACCHAP6TPAKXYDMG.SEARCH&ppt=sp&ppn=sp&ssid=jjqrg2z74eu1bmkg1759002763915&qH=8c05184b069f4990"
        },
        {
            "A": "https://www.amazon.in/Sony-DualSense-Wireless-Controller-Playstation/dp/B0CM3F28YR/ref=ast_sto_dp_puis",
            // "F": "https://www.flipkart.com/playstation-sony-ps5-controller-metallic-editionsony-dualsense-wireless-bluetooth-gamepad/p/itm3a1d9dab9f0e2?pid=ACCHAZZKSHZEQFSJ&lid=LSTACCHAZZKSHZEQFSJHQK2IG&marketplace=FLIPKART&q=ps5+controller&store=4rr%2Fkm5%2Fr39&srno=s_1_8&otracker=search&otracker1=search&fm=Search&iid=13ce0fd7-f5e1-4a7d-8239-7ed28363418c.ACCHAZZKSHZEQFSJ.SEARCH&ppt=sp&ppn=sp&ssid=jjqrg2z74eu1bmkg1759002763915&qH=8c05184b069f4990"
        },
        {
            "A": "https://www.amazon.in/Sony-Dualsense-Sterling-Wireless-Controller/dp/B0CRYKNBSD/ref=ast_sto_dp_puis",
            "F": null
        },
        {
            "A": "https://www.amazon.in/Sony-PlayStation-Dualsense-Wireless-Controller/dp/B0DJSZH7R3/ref=ast_sto_dp_puis",
            // "F": "https://www.flipkart.com/playstation-sony-ps5-controller-metallic-editionsony-dualsense-wireless-bluetooth-gamepad/p/itm3a1d9dab9f0e2?pid=ACCHAZZKSHZEQFSJ&lid=LSTACCHAZZKSHZEQFSJHQK2IG&marketplace=FLIPKART&q=ps5+controller+indigo&store=4rr%2Fkm5%2Fr39&srno=s_1_1&otracker=search&otracker1=search&fm=Search&iid=fb9f279e-c68b-4288-836b-de95f6db3813.ACCHAZZKSHZEQFSJ.SEARCH&ppt=sp&ppn=sp&ssid=w5er5z98d8bdmigw1759002855083&qH=38c0a760754421e0"
        }
    ]
};

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/priceTracker";

// ========== MongoDB Setup ==========
const historySchema = new mongoose.Schema({
    price_Amazon_INR: { type: Number, default: null },
    price_Flipkart_INR: { type: Number, default: null },
    price_Amazon_USD: { type: Number, default: null },
    price_Flipkart_USD: { type: Number, default: null },
    date: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
    name: String,
    product_image: String,
    url_Amazon: String,
    url_Flipkart: String,
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

//========== Scrapers ==========
async function scrapeAmazon(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0",
                "Accept-Language": "en-IN,en;q=0.9"
            }
        });
        const $ = cheerio.load(response.data);
        const rawPrice = $(".priceToPay .a-price-whole").first().text().replace(/,/g, "");
        const price = rawPrice ? parseInt(rawPrice) : null;
        const title = $(".product-title-word-break").first().text().split(",")[0].trim() || null;
        const product_image = $(".a-dynamic-image").first().attr("src") || null;
        return { title, price, product_image };
    } catch (err) {
        console.error("| ❌ Amazon scrape error:", err.message);
        return { title: null, price: null, product_image: null };
    }
}
// MODIFIED: Accepts a browser instance and has a robust finally block
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Safari/605.1.15',
];


async function scrapeFlipkart(link) {
    if (!link) return null;

    const randomUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    const headers = {
        'User-Agent': randomUserAgent,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Referer': 'https://www.google.com/',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
    };

    try {
        const { data } = await axios.get(link, {
            headers: headers,
        });

        const $ = cheerio.load(data);

        const priceText = $('div._30jeq3._16Jk6d').first().text().trim();
        const price = priceText ? Number(priceText.replace(/[^0-9.]/g, '')) : null;

        if (!price) {
            console.log(`Could not find price for link: ${link}. The page structure might have changed.`);
            return null;
        }

        return price;

    } catch (error) {
        console.error(`Error scraping Flipkart link (${link}):`, error.message);
        if (error.response) {
            console.error('Status Code:', error.response.status);
        }
        return null;
    }
}


async function scrapeWebsites() {
    console.log("===== Running scraper at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), "=====");

    try {
        const now = new Date();

        let conversion = 0.012;
        try {
            const curr = await (await fetch("https://latest.currency-api.pages.dev/v1/currencies/inr.json")).json();
            conversion = curr.inr.usd;
        } catch (e) {
            console.log("| ⚠️ Currency fetch failed, using fallback.");
        }

        for (const [category, links] of Object.entries(urls)) {
            for (const site of links) {
                const amazonData = await scrapeAmazon(site.A);

                let product = await Product.findOne({ url_Amazon: site.A });
                let title;
                let product_image;

                if (amazonData.title) {
                    title = amazonData.title;
                    product_image = amazonData.product_image;
                } else {
                    console.log(`| ⚠️ Amazon scrape failed for ${site.A}. Using existing data if available.`);
                    if (product) {
                        title = product.name;
                        product_image = product.product_image;
                        amazonData.price = null;
                        console.log(`| ℹ️ Using existing DB data for: ${title}`);
                    } else {
                        console.log(`| ⏭️ Skipping: Cannot scrape new product details for ${amazonUrl}.`);
                        continue;
                    }
                }

                const flipPrice = await scrapeFlipkart(site.F);
                if (!product) {
                    product = new Product({
                        name: title,
                        product_image,
                        url_Amazon: site.A,
                        url_Flipkart: site.F,
                        category,
                        history: []
                    });
                    console.log(`| 🆕 Added new product: ${title} (${category})`);
                }
                const entry = {
                    price_Amazon_INR: amazonData.price ?? null,
                    price_Flipkart_INR: flipPrice ?? null,
                    price_Amazon_USD: amazonData.price ? parseFloat((amazonData.price * conversion).toFixed(2)) : null,
                    price_Flipkart_USD: flipPrice ? parseFloat((flipPrice * conversion).toFixed(2)) : null,
                    date: now
                };
                product.history.push(entry);
                await product.save();
                console.log(`| 💾 Saved: ${title.substring(0, 30)}... → A: ${entry.price_Amazon_INR ?? "N/A"} INR, F: ${entry.price_Flipkart_INR ?? "N/A"} INR`);
            }
        }
    } catch (error) {
        console.error("| 💥 An unexpected error occurred during the scraping process:", error);
    } finally {
        console.log("Done scraping.\n");
    }
}

// ========== Cleanup (optional) ==========
async function cleanPriceHistory() {
    console.log("===== Running cleanup =====");
    const products = await Product.find({});
    for (const product of products) {
        const original = product.history.length;
        if (original <= 2) continue;

        const cleaned = [product.history[0]];
        for (let i = 1; i < product.history.length - 1; i++) {
            const prev = product.history[i - 1];
            const curr = product.history[i];
            const next = product.history[i + 1];

            // only keep if it's different from both neighbors
            if (!(isEqual(prev.price_Amazon_INR, curr.price_Amazon_INR) && isEqual(next.price_Amazon_INR, curr.price_Amazon_INR))) {
                cleaned.push(curr);
            }
        }
        cleaned.push(product.history[product.history.length - 1]);

        if (cleaned.length < original) {
            product.history = cleaned;
            await product.save();
            console.log(`| ✨ Cleaned ${product.name}: removed ${original - cleaned.length}`);
        }
    }
    console.log("Done cleanup.\n");
}

function isEqual(a, b) {
    if(a == null && b == null) return true;
    return a == b
}

// Schedule scraper + cleanup
cron.schedule("*/15 * * * *", scrapeWebsites);
cron.schedule("5 */6 * * *", cleanPriceHistory);

// ========== Serve HTML ==========
app.get("/", async (req, res) => {
    res.send("<h1>📊 Price Tracker</h1><p>Data is being scraped and stored in MongoDB.</p>");
});

app.listen(PORT, () => {
    console.log(`| 🚀 Server running on http://localhost:${PORT}`);
});
