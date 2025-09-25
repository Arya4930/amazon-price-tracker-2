import axios from "axios";
import * as cheerio from "cheerio";
import express from "express";
import cron from "node-cron";
import mongoose from "mongoose";
import 'dotenv/config'

const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
];
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/priceTracker";

// ========== MongoDB Setup ==========
const historySchema = new mongoose.Schema({
    price_INR: Number,
    price_USD: Number,
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
async function scrapeWebsite(url, category, now) {
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
                "Accept-Language": "en-IN,en;q=0.9"
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const price_inr = parseInt($(".a-price-whole").first().text().replace(/,/g, ""));
        const curr = await (await fetch("https://latest.currency-api.pages.dev/v1/currencies/inr.json")).json();
        const price_usd = price_inr * curr.inr.usd;
        const title = $(".product-title-word-break").first().text().split(",")[0].trim();
        const product_image = $(".a-dynamic-image").first().attr("src");

        let product = await Product.findOne({ name: title });

        if (!product) {
            product = new Product({
                name: title,
                product_image,
                url,
                category,
                history: []
            });
            console.log(`| 🆕 Added new product: ${title} (category: ${category})`);
        }

        product.history.push({
            price_INR: price_inr,
            price_USD: price_usd,
            date: now
        });

        console.log(`| 🔄 Price recorded: ${title} → ${price_inr.toLocaleString()} INR | ${price_usd.toFixed(2)} USD`);
        await product.save();
    } catch (error) {
        console.error("| ❌ Error scraping:", error.message);
    }
}

async function scrapeWebsites() {
    console.log("===== Running scraper at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), "=====");
    const now = new Date();
    for (const [category, links] of Object.entries(urls)) {
        for (const url of links) {
            await scrapeWebsite(url, category, now);
        }
    }
    console.log("Done scraping.\n");
}

// Example product URLs
const urls = {
    "Xbox Controller": [
        "https://www.amazon.in/XBOX-Wireless-Controller-Windows-Devices/dp/B0F2NCQYTX/ref=sr_1_3?crid=CWV5QIHNXG8T&dib=eyJ2IjoiMSJ9.a6xh005b7mAjqFb38EIiLoYEQ4Mm6UW1Tfa0bLAFo7R0WAuZPfgSP5N9wbMuPfsLgQ4kJaP1MhE0cGDzkTjUXTN_LKCoWws3p7mawuNE0QIefIlGar6cVToEsoy0kUSnYuMGfrqEBiPxtQm2bnPz002FfY8jhB-rNmUFFxCJbUoRXCY3b94-QgtN7J_WGcGLPrxwh6rUsCD5Kda6fXiwzvDuHH560jAxT-ylSTD8qMI.lKuPrDToXDe6NETAvJxznSIBAN4qED9mXzpd1ZjMa68&dib_tag=se&keywords=xbox+controller+for+pc+wireless&qid=1758783838&sprefix=%2Caps%2C406&sr=8-3",
        "https://www.google.com/aclk?sa=L&ai=DChsSEwjS0umKhfSPAxWNo2YCHZneBowYACICCAEQAxoCc20&co=1&gclid=Cj0KCQjw0NPGBhCDARIsAGAzpp1m-q3Xrx1MYJcOmP8FOwJablbTS_btckY934JXYWztsVVm7TBTM5waAon1EALw_wcB&cce=2&sig=AOD64_3OILuWfhwvx0mZd-c51Tz5HdhyNA&ctype=5&q=&ved=2ahUKEwiTu-CKhfSPAxV1zzgGHcUDIScQ9aACKAB6BAgJEBU&adurl=",
        "https://www.google.com/aclk?sa=L&ai=DChsSEwi-zIbnivSPAxUagksFHYjeOtsYACICCAEQBxoCc2Y&co=1&gclid=Cj0KCQjw0NPGBhCDARIsAGAzpp0ZsdHY56myXCMaDyS40BiGv7WzcgSdwsNkLuYkjfhMH5PIWzwESBIaAgGeEALw_wcB&cce=2&sig=AOD64_15m6mYFLyv8iLEfO5w1doC74uZeg&ctype=5&q=&ved=2ahUKEwi-x_fmivSPAxV93TgGHa_mGhsQ5bgDKAB6BAgIEBI&adurl=",
        "https://www.amazon.in/Microsoft-Xbox-Wireless-Controller-Velocity/dp/B0BYJMXHR3/ref=sr_1_52?dib=eyJ2IjoiMSJ9.ZYrGb1fhPVUDVryxP9bEIFlu4ayFLoX_n7K5OdlAEw5KeXf-b8lgi19LTU4t3wxJg5KbCAs8ZS9jBp-Fvwnj2_TF9sDo4Ay3Fbt6fc1SxsgDvXz9F-3lHoel_s_zBn4CLhuYdYt_YB82mDy89v9GhmRUMCR_mIAP4hdB_wP7_-GhL6mV9Six5qynWCcT88h9cSbmpYbZ_9T_xVLTaV2fJ3_2LuNmUuB8nQirbphKVj9MGKixFUtcZC9cGAhVgXF4d29nDMxfSbTdVedVY0Hh-rhtXn66XdgI_0-jv7w-TXM.5XWRaKOh10Gf2Hne_Ysm_St49oyCXIXGHKH3u74AokQ&dib_tag=se&qid=1758809396&refinements=p_89%3AMicrosoft&sr=8-52&srs=83159015031&xpid=N02VJ_p91qdDi",

    ],
    "PS5 Controller": [
        "https://www.amazon.in/DualSense-Wireless-Controller-PlayStation-White/dp/B08GZ6QNTC/ref=sr_1_2?crid=M1I7JG23CSDK&dib=eyJ2IjoiMSJ9.mlEXdBGseypru5gfvv3h9D0EFa0AOj8kRaLYa4oj5aGZlpOtQRD99HOyPb2LLWdnu589NVBSAPOwv--BME3ZK44kYYgLWwdsM70pPYkh9NwPkH-iq_96LBZiDWi8lacE3tmp9Hkt9zgBuVAcSRAX-D07a7wlNrTvbZg1n856svmoGHlnYAlrkLn1FsSp9y1jNobbN7DH--XlJeoMUB91NQBx3xROc0cCw66QE1RgL5w.2M6-W1txZH7S8Qv_8tY1ckMp8TakmG2yN1DmhyxSLmw&dib_tag=se&keywords=ps5+controller&qid=1758783885&sprefix=ps5+con%2Caps%2C966&sr=8-2",
        "https://www.google.com/aclk?sa=L&ai=DChsSEwjkxuKHi_SPAxUTq2YCHRbKHMkYACICCAEQAxoCc20&co=1&gclid=Cj0KCQjw0NPGBhCDARIsAGAzpp0mcIgMuko8ZdG4D7jINbzdsrAwFy2YCAiZIxU4BcYstftYJtpvtAwaAhncEALw_wcB&cce=2&sig=AOD64_21rU--sUhHm-ltP2EBwgtij8QErQ&ctype=5&q=&ved=2ahUKEwi5tNqHi_SPAxWvg2MGHUTcOv4Q9aACKAB6BAgGEDM&adurl=",
        "https://www.amazon.in/DualSense-Wireless-Controller-Red-PlayStation/dp/B098439Y2G/ref=ast_sto_dp_puis",
        "https://www.amazon.in/Sony-DualSense-Wireless-Controller-Playstation/dp/B0CM3F28YR/ref=ast_sto_dp_puis",
        "https://www.amazon.in/Sony-Dualsense-Sterling-Wireless-Controller/dp/B0CRYKNBSD/ref=ast_sto_dp_puis",
        "https://www.amazon.in/Sony-PlayStation-Dualsense-Wireless-Controller/dp/B0DJSZH7R3/ref=ast_sto_dp_puis"
    ]
};

// Schedule scraper (every 2 hours)
cron.schedule("0 */2 * * *", scrapeWebsites);

// Run immediately
scrapeWebsites();

//========== Helper ==========
function getPriceStats(history) {
    if (history.length === 0) return null;

    const prices = history.map(h => h.price_INR);
    const current = prices[prices.length - 1];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

    let trend = "stable";
    if (history.length > 1) {
        const previous = prices[prices.length - 2];
        if (current > previous) trend = "up";
        else if (current < previous) trend = "down";
    }

    return { current, min, max, avg: Math.round(avg), trend };
}

function getCategoryStats(products) {
    const allPrices = products.flatMap(p => p.history.map(h => h.price_INR));
    const latestPrices = products.map(p => p.history.length > 0 ? p.history[p.history.length - 1].price_INR : 0);

    if (allPrices.length === 0) return null;

    return {
        min: Math.min(...allPrices),
        max: Math.max(...allPrices),
        avg: Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length),
        currentMin: Math.min(...latestPrices),
        currentMax: Math.max(...latestPrices)
    };
}

// Serve HTML page
app.get("/", async (req, res) => {
    try {
        const data = await Product.find({}).lean();
        const dateOptions = {
            timeZone: "Asia/Kolkata",
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        };

        // Group products by category
        const groupedByCategory = data.reduce((acc, product) => {
            const category = product.category || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(product);
            return acc;
        }, {});

        const allTimestamps = data.flatMap(p => p.history.map(h => new Date(h.date).getTime()));
        const lastUpdated = allTimestamps.length > 0
            ? new Date(Math.max(...allTimestamps)).toLocaleString("en-IN", dateOptions)
            : "No data available";

        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 Price Tracker Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 2rem 0;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle {
            color: #666;
            font-size: 1.1rem;
            opacity: 0.8;
        }
        .last-updated {
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: rgba(102, 126, 234, 0.1);
            border-radius: 20px;
            display: inline-block;
            font-size: 0.9rem;
            color: #667eea;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        .stats-overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 1.5rem;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        .stat-label {
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .category-section {
            margin-bottom: 4rem;
        }
        .category-header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 2rem;
            border-radius: 20px 20px 0 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            margin-bottom: 0;
        }
        .category-title {
            font-size: 1.8rem;
            color: #333;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .category-subtitle {
            color: #666;
            font-size: 1rem;
            margin-bottom: 1rem;
        }
        .category-stats {
            display: flex;
            gap: 2rem;
            flex-wrap: wrap;
        }
        .category-stat-item {
            text-align: center;
            padding: 0.5rem 1rem;
            background: rgba(102, 126, 234, 0.1);
            border-radius: 12px;
        }
        .category-stat-value {
            font-weight: bold;
            color: #667eea;
            font-size: 1.1rem;
        }
        .category-stat-label {
            font-size: 0.8rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 0.3rem;
        }
        .category-content {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 0 0 20px 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            overflow: hidden;
        }
        .products-row {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 0;
            min-height: 400px;
        }
        .products-list {
            padding: 1.5rem;
            border-right: 1px solid rgba(0, 0, 0, 0.05);
            overflow-y: auto;
            max-height: 600px;
        }
        .product-item {
            display: flex;
            gap: 1rem;
            align-items: center;
            padding: 1rem;
            margin-bottom: 1rem;
            background: rgba(102, 126, 234, 0.05);
            border-radius: 12px;
            transition: all 0.3s ease;
        }
        .product-item:hover {
            background: rgba(102, 126, 234, 0.1);
            transform: translateX(5px);
        }
        .product-image {
            width: 60px;
            height: 60px;
            object-fit: contain;
            border-radius: 8px;
            background: #f8f9fa;
            padding: 0.3rem;
        }
        .product-details {
            flex: 1;
        }
        .product-name {
            font-weight: 600;
            font-size: 0.95rem;
            margin-bottom: 0.3rem;
            color: #333;
        }
        .product-price {
            font-size: 1.1rem;
            font-weight: bold;
            color: #28a745;
            margin-bottom: 0.2rem;
        }
        .product-price-usd {
            font-size: 0.8rem;
            color: #666;
        }
        .product-link {
            padding: 0.4rem 0.8rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            text-decoration: none;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
        }
        .product-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .chart-section {
            padding: 1.5rem;
            height: 500px;
        }
        .chart-wrapper {
            position: relative;
            height: 100%;
        }
        .no-data {
            text-align: center;
            padding: 3rem;
            color: #666;
        }
        .no-data i {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.3;
        }
        .footer {
            text-align: center;
            padding: 2rem;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
        }
        @media (max-width: 768px) {
            .header h1 { font-size: 2rem; }
            .container { padding: 1rem; }
            .products-row {
                grid-template-columns: 1fr;
            }
            .products-list {
                border-right: none;
                border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                max-height: 300px;
            }
            .category-stats {
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1><i class="fas fa-chart-line"></i> Price Tracker Dashboard</h1>
        <p class="subtitle">Monitor your favorite products and never miss a deal</p>
        <div class="last-updated">
            <i class="fas fa-clock"></i> Last updated: ${lastUpdated}
        </div>
    </div>

    <div class="container">
        <div class="stats-overview">
            <div class="stat-card">
                <div class="stat-number">${Object.keys(groupedByCategory).length}</div>
                <div class="stat-label">Categories</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.length}</div>
                <div class="stat-label">Products Tracked</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.reduce((sum, p) => sum + p.history.length, 0)}</div>
                <div class="stat-label">Price Points</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.filter(p => {
            const stats = getPriceStats(p.history);
            return stats && stats.trend === 'down';
        }).length}</div>
                <div class="stat-label">Price Drops</div>
            </div>
        </div>

        ${Object.keys(groupedByCategory).length === 0 ? `
        <div class="no-data">
            <i class="fas fa-shopping-cart"></i>
            <h2>No products tracked yet</h2>
            <p>Add some product URLs to start tracking prices</p>
        </div>
        ` : Object.entries(groupedByCategory).map(([category, products], categoryIdx) => {
            const categoryStats = getCategoryStats(products);
            return `
            <div class="category-section">
                <div class="category-header">
                    <h2 class="category-title">
                        <i class="fas fa-gamepad"></i>
                        ${category}
                        <span style="font-size: 0.8rem; background: rgba(102, 126, 234, 0.1); color: #667eea; padding: 0.3rem 0.8rem; border-radius: 15px;">${products.length} variants</span>
                    </h2>
                    <p class="category-subtitle">Compare different variants and track price changes</p>
                    ${categoryStats ? `
                    <div class="category-stats">
                        <div class="category-stat-item">
                            <div class="category-stat-value">₹${categoryStats.currentMin.toLocaleString()} - ₹${categoryStats.currentMax.toLocaleString()}</div>
                            <div class="category-stat-label">Current Range</div>
                        </div>
                        <div class="category-stat-item">
                            <div class="category-stat-value">₹${categoryStats.min.toLocaleString()}</div>
                            <div class="category-stat-label">Lowest Ever</div>
                        </div>
                        <div class="category-stat-item">
                            <div class="category-stat-value">₹${categoryStats.max.toLocaleString()}</div>
                            <div class="category-stat-label">Highest Ever</div>
                        </div>
                        <div class="category-stat-item">
                            <div class="category-stat-value">₹${categoryStats.avg.toLocaleString()}</div>
                            <div class="category-stat-label">Average</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="category-content">
                    <div class="products-row">
                        <div class="products-list">
                            ${products.map(product => {
                const latestHistory = product.history[product.history.length - 1];
                const latestPrice = latestHistory ? latestHistory.price_INR : 0;
                const latestUSD = latestHistory ? latestHistory.price_USD : 0;
                return `
                                <div class="product-item">
                                    <img src="${product.product_image}" alt="${product.name}" class="product-image" loading="lazy">
                                    <div class="product-details">
                                        <div class="product-name">${product.name}</div>
                                        <div class="product-price">₹${latestPrice.toLocaleString()}</div>
                                        <div class="product-price-usd">$${latestUSD.toFixed(2)}</div>
                                    </div>
                                    <a href="${product.url}" target="_blank" class="product-link">
                                        <i class="fas fa-external-link-alt"></i>
                                        View
                                    </a>
                                </div>
                                `;
            }).join('')}
                        </div>
                        <div class="chart-section">
                            <div class="chart-wrapper">
                                <canvas id="categoryChart${categoryIdx}"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('')}
    </div>

    <div class="footer">
        <p><i class="fas fa-robot"></i> Powered by automated price tracking • Updates every 2 hours</p>
    </div>

    <script>

        // Initialize category charts
        ${Object.entries(groupedByCategory).map(([category, products], categoryIdx) => `
        if (document.getElementById('categoryChart${categoryIdx}')) {
            const ctx${categoryIdx} = document.getElementById('categoryChart${categoryIdx}').getContext('2d');
            
            // Create gradient backgrounds for each product
            ${products.map((product, productIdx) => `
            const gradient${categoryIdx}_${productIdx} = ctx${categoryIdx}.createLinearGradient(0, 0, 0, 400);
            gradient${categoryIdx}_${productIdx}.addColorStop(0, '${colors[productIdx % colors.length]}20');
            gradient${categoryIdx}_${productIdx}.addColorStop(1, '${colors[productIdx % colors.length]}02');
            `).join('')}

            // Get all unique dates across all products in this category
            const allDates = [...new Set(${JSON.stringify(products.flatMap(p => p.history.map(h => new Date(h.date).toLocaleString("en-IN", dateOptions))))})].sort();
            
            new Chart(ctx${categoryIdx}, {
                type: 'line',
                data: {
                    labels: allDates,
                    datasets: [
                        ${products.map((product, productIdx) => `{
                            label: '${product.name}',
                            data: allDates.map(date => {
                                const entry = ${JSON.stringify(product.history.map(h => ({
            date: new Date(h.date).toLocaleString("en-IN", dateOptions),
            price: h.price_INR
        })))}.find(h => h.date === date);
                                return entry ? entry.price : null;
                            }),
                            borderColor: '${colors[productIdx % colors.length]}',
                            backgroundColor: gradient${categoryIdx}_${productIdx},
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '${colors[productIdx % colors.length]}',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 8,
                            spanGaps: true
                        }`).join(',')}
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                boxWidth: 12,
                                padding: 15,
                                font: {
                                    size: 11
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: '#333',
                            bodyColor: '#666',
                            borderColor: '#667eea',
                            borderWidth: 1,
                            cornerRadius: 12,
                            displayColors: true,
                            callbacks: {
                                title: function(context) {
                                    return context[0].label;
                                },
                                label: function(context) {
                                    if (context.parsed.y === null) return null;
                                    return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString();
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            grid: {
                                display: false
                            },
                            ticks: {
                                maxTicksLimit: 8,
                                color: '#666'
                            }
                        },
                        y: {
                            display: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                },
                                color: '#666'
                            }
                        }
                    },
                    elements: {
                        point: {
                            hoverBorderWidth: 3
                        }
                    }
                }
            });
        }
        `).join('\n')}

        // Add smooth scroll behavior
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });

        // Add loading states for external links
        document.querySelectorAll('.product-link').forEach(btn => {
            btn.addEventListener('click', function() {
                const icon = this.querySelector('i');
                icon.className = 'fas fa-spinner fa-spin';
                setTimeout(() => {
                    icon.className = 'fas fa-external-link-alt';
                }, 2000);
            });
        });
    </script>
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

// ========== API ==========
app.get("/api/data", async (req, res) => {
    const products = await Product.find();

    // Group by category
    const grouped = {};
    for (const p of products) {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
    }

    res.json({
        products: grouped, // 👈 grouped by category
        totalProducts: products.length,
        totalPricePoints: products.reduce((sum, p) => sum + p.history.length, 0),
        lastUpdated: products.length > 0
            ? Math.max(...products.flatMap(p => p.history.map(h => new Date(h.date).getTime())))
            : Date.now()
    });
});