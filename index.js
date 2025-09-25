import axios from "axios";
import * as cheerio from "cheerio";
import express from "express";
import cron from "node-cron";
import mongoose from "mongoose";
import 'dotenv/config'

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
    history: [historySchema]
});

const Product = mongoose.model("Product", productSchema);

// Connect DB
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("| ✅ MongoDB connected"))
    .catch(err => console.error("| ❌ MongoDB error:", err));

// ========== Scraper ==========
async function scrapeWebsite(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
                "Accept-Language": "en-IN,en;q=0.9"
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        const price_inr = parseInt(
            $(".a-price-whole").first().text().replace(/,/g, "")
        );

        const curr = await (await fetch("https://latest.currency-api.pages.dev/v1/currencies/inr.json")).json();
        const price_usd = price_inr * curr.inr.usd;

        const title = $(".product-title-word-break").first().text().split(",")[0].trim();
        const product_image = $(".a-dynamic-image").first().attr("src");

        let product = await Product.findOne({ name: title });

        const now = new Date();

        if (!product) {
            // create new product
            product = new Product({
                name: title,
                product_image,
                url,
                history: []
            });
            console.log(`| 🆕 Added new product: ${title}`);
        }

        // get last recorded entry
        const lastEntry = product.history[product.history.length - 1];

        if (!lastEntry) {
            product.history.push({
                price_INR: price_inr,
                price_USD: price_usd,
                date: now
            });
            console.log(`| 🔄 Price recorded: ${title} → ${price_inr.toLocaleString()} INR | ${price_usd.toFixed(2)} USD`);
        } else {
            console.log(`| ✅ ${title}: No price change (${price_inr} INR)`);
        }

        await product.save();
    } catch (error) {
        console.error("| ❌ Error scraping:", error.message);
    }
}

async function scrapeWebsites() {
    console.log("===== Running scraper at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), "=====");
    for (const url of urls) {
        await scrapeWebsite(url);
    }
}

// Example product URLs
const urls = [
    "https://www.amazon.in/XBOX-Wireless-Controller-Windows-Devices/dp/B0F2NCQYTX/ref=sr_1_3?crid=CWV5QIHNXG8T&dib=eyJ2IjoiMSJ9.a6xh005b7mAjqFb38EIiLoYEQ4Mm6UW1Tfa0bLAFo7R0WAuZPfgSP5N9wbMuPfsLgQ4kJaP1MhE0cGDzkTjUXTN_LKCoWws3p7mawuNE0QIefIlGar6cVToEsoy0kUSnYuMGfrqEBiPxtQm2bnPz002FfY8jhB-rNmUFFxCJbUoRXCY3b94-QgtN7J_WGcGLPrxwh6rUsCD5Kda6fXiwzvDuHH560jAxT-ylSTD8qMI.lKuPrDToXDe6NETAvJxznSIBAN4qED9mXzpd1ZjMa68&dib_tag=se&keywords=xbox+controller+for+pc+wireless&qid=1758783838&sprefix=%2Caps%2C406&sr=8-3",
    "https://www.amazon.in/DualSense-Wireless-Controller-PlayStation-White/dp/B08GZ6QNTC/ref=sr_1_2?crid=M1I7JG23CSDK&dib=eyJ2IjoiMSJ9.mlEXdBGseypru5gfvv3h9D0EFa0AOj8kRaLYa4oj5aGZlpOtQRD99HOyPb2LLWdnu589NVBSAPOwv--BME3ZK44kYYgLWwdsM70pPYkh9NwPkH-iq_96LBZiDWi8lacE3tmp9Hkt9zgBuVAcSRAX-D07a7wlNrTvbZg1n856svmoGHlnYAlrkLn1FsSp9y1jNobbN7DH--XlJeoMUB91NQBx3xROc0cCw66QE1RgL5w.2M6-W1txZH7S8Qv_8tY1ckMp8TakmG2yN1DmhyxSLmw&dib_tag=se&keywords=ps5+controller&qid=1758783885&sprefix=ps5+con%2Caps%2C966&sr=8-2"
];

// Schedule scraper (every 2 hours)
cron.schedule("0 */2 * * *", scrapeWebsites);

// Run immediately
scrapeWebsites();

// ========== Helper ==========
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
        const allTimestamps = data.flatMap(p =>
            p.history.map(h => new Date(h.date).getTime())
        );

        // Find last updated date
        const lastUpdated = allTimestamps.length > 0
            ? new Date(Math.max(...allTimestamps)).toLocaleString("en-IN", dateOptions)
            : "No date available";

        let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>📊 Price Tracker Dashboard</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
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
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
        }
        
        .product-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }
        
        .product-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .product-info {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }
        
        .product-image {
          width: 80px;
          height: 80px;
          object-fit: contain;
          border-radius: 12px;
          background: #f8f9fa;
          padding: 0.5rem;
          flex-shrink: 0;
        }
        
        .product-details {
          flex: 1;
        }
        
        .product-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #333;
          line-height: 1.4;
        }
        
        .current-price {
          font-size: 1.5rem;
          font-weight: bold;
          color: #28a745;
          margin-bottom: 0.5rem;
        }
        
        .price-usd {
          color: #666;
          font-size: 0.9rem;
        }
        
        .price-stats {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }
        
        .stat-item {
          text-align: center;
          padding: 0.5rem;
          background: rgba(102, 126, 234, 0.05);
          border-radius: 8px;
          flex: 1;
          min-width: 70px;
        }
        
        .stat-value {
          font-weight: bold;
          color: #667eea;
          font-size: 0.9rem;
        }
        
        .stat-title {
          font-size: 0.7rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 0.2rem;
        }
        
        .trend-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .trend-up {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
        }
        
        .trend-down {
          background: rgba(40, 167, 69, 0.1);
          color: #28a745;
        }
        
        .trend-stable {
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
        }
        
        .product-actions {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          gap: 1rem;
        }
        
        .btn {
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 25px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .chart-container {
          padding: 1.5rem;
          height: 350px;
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
        
        .loading {
          text-align: center;
          padding: 2rem;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .footer {
          text-align: center;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
          .header h1 {
            font-size: 2rem;
          }
          
          .container {
            padding: 1rem;
          }
          
          .products-grid {
            grid-template-columns: 1fr;
          }
          
          .product-info {
            flex-direction: column;
            text-align: center;
          }
          
          .product-image {
            align-self: center;
          }
          
          .price-stats {
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
        
        ${data.length === 0 ? `
        <div class="no-data">
          <i class="fas fa-shopping-cart"></i>
          <h2>No products tracked yet</h2>
          <p>Add some product URLs to start tracking prices</p>
        </div>
        ` : `
        <div class="products-grid">
          ${data.map((p, idx) => {
            const stats = getPriceStats(p.history);
            const latestPrice = stats ? stats.current : 0;
            const latestUSD = p.history.length > 0 ? p.history[p.history.length - 1].price_USD : 0;

            return `
            <div class="product-card">
              <div class="product-header">
                <div class="product-info">
                  <img src="${p.product_image}" alt="${p.name}" class="product-image" loading="lazy">
                  <div class="product-details">
                    <h3 class="product-title">${p.name}</h3>
                    <div class="current-price">
                      ₹${latestPrice.toLocaleString()}
                      <div class="price-usd">$${latestUSD.toFixed(2)}</div>
                    </div>
                    ${stats ? `
                    <div class="trend-indicator trend-${stats.trend}">
                      <i class="fas fa-arrow-${stats.trend === 'up' ? 'up' : stats.trend === 'down' ? 'down' : 'right'}"></i>
                      ${stats.trend}
                    </div>
                    ` : ''}
                  </div>
                </div>
                ${stats ? `
                <div class="price-stats">
                  <div class="stat-item">
                    <div class="stat-value">₹${stats.min.toLocaleString()}</div>
                    <div class="stat-title">Lowest</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">₹${stats.max.toLocaleString()}</div>
                    <div class="stat-title">Highest</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">₹${stats.avg.toLocaleString()}</div>
                    <div class="stat-title">Average</div>
                  </div>
                </div>
                ` : ''}
              </div>
              
              <div class="product-actions">
                <a href="${p.url}" target="_blank" class="btn btn-primary">
                  <i class="fas fa-external-link-alt"></i>
                  View on Amazon
                </a>
              </div>
              
              <div class="chart-container">
                <div class="chart-wrapper">
                  <canvas id="chart${idx}"></canvas>
                </div>
              </div>
            </div>
            `;
        }).join('')}
        </div>
        `}
      </div>
      
      <div class="footer">
        <p>
          <i class="fas fa-robot"></i> 
          Powered by automated price tracking • Updates every 2 hours
        </p>
      </div>
      
      <script>
        // Initialize charts
        ${data.map((p, idx) => `
          if (document.getElementById('chart${idx}')) {
            const ctx${idx} = document.getElementById('chart${idx}').getContext('2d');
            
            const gradient${idx} = ctx${idx}.createLinearGradient(0, 0, 0, 400);
            gradient${idx}.addColorStop(0, 'rgba(102, 126, 234, 0.2)');
            gradient${idx}.addColorStop(1, 'rgba(102, 126, 234, 0.02)');
            
            new Chart(ctx${idx}, {
              type: 'line',
              data: {
                labels: ${JSON.stringify(p.history.map(h =>
            new Date(h.date).toLocaleString("en-IN", dateOptions)
        ))},
                datasets: [{
                  label: 'Price (INR)',
                  data: ${JSON.stringify(p.history.map(h => h.price_INR))},
                  borderColor: '#667eea',
                  backgroundColor: gradient${idx},
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#667eea',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                  pointRadius: 5,
                  pointHoverRadius: 8
                }]
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
                    display: false
                  },
                  tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    cornerRadius: 12,
                    displayColors: false,
                    callbacks: {
                      title: function(context) {
                        return context[0].label;
                      },
                      label: function(context) {
                        const usdPrice = ${JSON.stringify(p.history.map(h => h.price_USD))}[context.dataIndex];
                        return [
                          'INR: ₹' + context.parsed.y.toLocaleString(),
                          'USD: $' + usdPrice.toFixed(2)
                        ];
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
                      maxTicksLimit: 6,
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
        document.querySelectorAll('.btn-primary').forEach(btn => {
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
    </html>
  `;
        res.send(html);
    } catch (err) {
        console.error("❌ Error rendering dashboard:", err.message);
        res.status(500).send("Internal Server Error");
    }
});

// ========== API ==========
app.get("/api/data", async (req, res) => {
    const products = await Product.find();
    res.json({
        products,
        totalProducts: products.length,
        totalPricePoints: products.reduce((sum, p) => sum + p.history.length, 0),
        lastUpdated: products.length > 0
            ? Math.max(...products.flatMap(p => p.history.map(h => new Date(h.date).getTime())))
            : Date.now()
    });
});

// ========== Start Server ==========
app.listen(PORT, () => {
    console.log(`| 🚀 Server running on http://localhost:${PORT}`);
});