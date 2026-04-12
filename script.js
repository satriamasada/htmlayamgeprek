// UI Elements
const header = document.querySelector('#header');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const openCartBtn = document.getElementById('open-cart');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsList = document.getElementById('cart-items-list');
const cartBadge = document.querySelector('.cart-badge');
const cartTotalText = document.getElementById('cart-total-price');

// Navigation Elements
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');

// Checkout Elements
const checkoutModal = document.getElementById('checkout-modal');
const checkoutOverlay = document.getElementById('checkout-modal-overlay');
const closeCheckoutBtn = document.getElementById('close-checkout');
const goToCheckoutBtn = document.getElementById('go-to-checkout');
const waCheckoutBtn = document.getElementById('wa-checkout-btn');
const mtCheckoutBtn = document.getElementById('mt-checkout-btn');

// Cart State
let cart = [];

// Sticky Header
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Navigation Toggle
menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    const icon = menuToggle.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
});

// Close menu on link click
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        navMenu.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
    }
});

// Cart Toggle
const toggleCart = () => {
    cartDrawer.classList.toggle('active');
    cartOverlay.classList.toggle('active');
};

openCartBtn.addEventListener('click', toggleCart);
closeCartBtn.addEventListener('click', toggleCart);
cartOverlay.addEventListener('click', toggleCart);

// Checkout Toggle
const toggleCheckoutModal = () => {
    checkoutModal.classList.toggle('active');
    checkoutOverlay.classList.toggle('active');
};

goToCheckoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Keranjang Anda masih kosong!');
        return;
    }
    toggleCart(); // Close cart first
    toggleCheckoutModal();
});

closeCheckoutBtn.addEventListener('click', toggleCheckoutModal);
checkoutOverlay.addEventListener('click', toggleCheckoutModal);

// Add to Cart Logic
document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const name = this.getAttribute('data-name');
        const price = parseInt(this.getAttribute('data-price'));
        addToCart(name, price);
        
        const icon = this.querySelector('i');
        icon.style.transform = 'scale(1.5)';
        icon.style.color = '#FFC107';
        setTimeout(() => {
            icon.style.transform = 'scale(1)';
            icon.style.color = '#EE222E';
        }, 300);
    });
});

function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<div class="empty-cart-msg">Keranjang Anda kosong.</div>';
    } else {
        cartItemsList.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="price">Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</span>
                    <div class="cart-item-qty">
                        <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalText.textContent = `Rp ${totalAmount.toLocaleString('id-ID')}`;
}

window.changeQty = (index, delta) => {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
};

// --- CHECKOUT LOGIC ---

// 1. WhatsApp Checkout
waCheckoutBtn.addEventListener('click', () => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let message = `Halo Geprek Maknyus! Saya ingin memesan:\n\n`;
    
    cart.forEach(item => {
        message += `- ${item.name} x${item.quantity} (Rp ${(item.price * item.quantity).toLocaleString('id-ID')})\n`;
    });
    
    message += `\nTotal: *Rp ${total.toLocaleString('id-ID')}*\n\nMohon segera diproses ya!`;
    
    const waUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
});

// 2. Midtrans Checkout
mtCheckoutBtn.addEventListener('click', async () => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (total === 0) return;

    // Tampilkan loading state
    const originalHTML = mtCheckoutBtn.innerHTML;
    mtCheckoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><div class="opt-text"><span>Memproses...</span><p>Mohon tunggu sebentar</p></div>';
    mtCheckoutBtn.style.pointerEvents = 'none';

    try {
        const payload = {
            packageId: 'PKG-' + Date.now().toString().slice(-6),
            packageName: 'Pesanan Geprek Maknyus',
            gross_amount: total
        };

        const response = await fetch('https://myapi-landingweb.vercel.app/api/midtrans/create-transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.token) {
            window.snap.pay(data.token, {
                onSuccess: function(result) { 
                    alert("Pembayaran Berhasil! Pesanan Anda akan segera diproses."); 
                    cart = [];
                    updateCartUI();
                    toggleCheckoutModal();
                },
                onPending: function(result) { 
                    alert("Menunggu pembayaran. Silakan selesaikan pembayaran Anda!"); 
                },
                onError: function(result) { 
                    alert("Pembayaran Gagal. Silakan coba lagi."); 
                },
                onClose: function() {
                    mtCheckoutBtn.innerHTML = originalHTML;
                    mtCheckoutBtn.style.pointerEvents = 'auto';
                }
            });
        } else {
            alert("Gagal memproses pembayaran. Silakan coba lagi nanti.");
            mtCheckoutBtn.innerHTML = originalHTML;
            mtCheckoutBtn.style.pointerEvents = 'auto';
        }

    } catch (error) {
        console.error('Midtrans Checkout Error:', error);
        alert("Terjadi kesalahan saat menghubungi server pembayaran.");
        mtCheckoutBtn.innerHTML = originalHTML;
        mtCheckoutBtn.style.pointerEvents = 'auto';
    }
});

// Animations & Scroll
const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
    });
}, observerOptions);

document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));

document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetSection = document.querySelector(this.getAttribute('href'));
        if (targetSection) {
            window.scrollTo({ top: targetSection.offsetTop - 80, behavior: 'smooth' });
        }
    });
});

// Menu Filtering Logic
const filterBtns = document.querySelectorAll('.filter-btn');
const menuCards = document.querySelectorAll('.menu-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        menuCards.forEach(card => {
            const category = card.getAttribute('data-category');
            if (filterValue === 'semua' || filterValue === category) {
                card.classList.remove('hidden');
                // Small animation reset
                card.style.animation = 'none';
                card.offsetHeight; // trigger reflow
                card.style.animation = null;
            } else {
                card.classList.add('hidden');
            }
        });
    });
});
