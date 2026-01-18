const express = require('express');
const router = express.Router();
const { supabase } = require('../helpers/supabase');

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
    }).format(amount);
};

router.get('/product/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch product details
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (productError || !product) {
            console.error('Error fetching product for share:', productError);
            // Fallback redirect to home if product not found
            return res.redirect('/');
        }

        // Fetch seller details for extra metadata
        const { data: seller } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', product.user_id)
            .single();

        const sellerName = seller ? (seller.full_name || seller.username) : 'MarketHub Seller';
        const price = formatCurrency(product.price);
        const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://sellhubshop.co.ke/placeholder.svg';
        const title = `${product.name} - ${price}`;
        const description = product.description
            ? product.description.substring(0, 150) + (product.description.length > 150 ? '...' : '')
            : `Check out this amazing product on MarketHub! Sold by ${sellerName}.`;

        // Determine the frontend URL (redirect target)
        // Assuming the backend is running on a different port/domain than frontend in some envs, 
        // or this is accessed via the same domain.
        // We want to redirect the user's browser to the actual product page.
        // If usage is via a shared link, we should try to determine the frontend base URL.
        // For now, we'll try to use a REFERER or a hardcoded base, or assume relative if primarily for bots.
        // BUT bots just read the meta tags. Humans clicking need to go to the app.

        // In production, everything might be on `sellhubshop.co.ke`. 
        // In dev, frontend is localhost:8080, backend localhost:3000.
        // We can use an env var for FRONTEND_URL or deduce it.
        const frontendUrl = process.env.FRONTEND_URL || 'https://sellhubshop.co.ke';
        const finalRedirectUrl = `${frontendUrl}/product/${id}`;

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <title>${title} | MarketHub</title>
  <meta name="description" content="${description}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="product">
  <meta property="og:url" content="${finalRedirectUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="MarketHub">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">

  <!-- Product Specific -->
  <meta property="product:price:amount" content="${product.price}">
  <meta property="product:price:currency" content="KES">
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0fdf4; color: #166534; }
    .loader { border: 4px solid #f3f3f3; border-top: 4px solid #16a34a; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .btn { background: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="loader"></div>
  <h2>Redirecting to MarketHub...</h2>
  <p>If you are not redirected automatically, click the button below.</p>
  <a href="${finalRedirectUrl}" class="btn">View Product</a>

  <script>
    // Immediate redirect
    window.location.href = "${finalRedirectUrl}";
  </script>
</body>
</html>
    `;

        res.send(html);

    } catch (error) {
        console.error('Share endpoint error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
