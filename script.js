// --- JAVÍTOTT, EGYSÉGESÍTETT SCRIPT BLOKK ---

// --- GLOBÁLIS VÁLTOZÓK ÉS FÜGGVÉNYEK ---
const regionalPriceTiers = {
    "EU": [
        { maxWeight: 15, maxVolume: 0.10, price: 28 }, { maxWeight: 30, maxVolume: 0.20, price: 46 },
        { maxWeight: 50, maxVolume: 0.35, price: 63 }, { maxWeight: 75, maxVolume: 0.55, price: 79 },
        { maxWeight: 100, maxVolume: 0.80, price: 100 }
    ],
    "UK": [
        { maxWeight: 15, maxVolume: 0.10, price: 35 }, { maxWeight: 30, maxVolume: 0.20, price: 55 },
        { maxWeight: 50, maxVolume: 0.35, price: 75 }, { maxWeight: 75, maxVolume: 0.55, price: 95 },
        { maxWeight: 100, maxVolume: 0.80, price: 120 }
    ],
    "CZ": [
        { maxWeight: 15, maxVolume: 0.10, price: 25 }, { maxWeight: 30, maxVolume: 0.20, price: 40 },
        { maxWeight: 50, maxVolume: 0.35, price: 55 }, { maxWeight: 75, maxVolume: 0.55, price: 70 },
        { maxWeight: 100, maxVolume: 0.80, price: 90 }
    ]
};
let currentRegion = localStorage.getItem("caregoRegion") || "EU";
let cart = JSON.parse(localStorage.getItem('caregoCart')) || [];

function addToCart() {
    const width = parseFloat(document.getElementById('width').value) || 0;
    const length = parseFloat(document.getElementById('length').value) || 0;
    const height = parseFloat(document.getElementById('height').value) || 0;
    const weight = parseFloat(document.getElementById('weight').value) || 0;
    if (width > 0 && length > 0 && height > 0 && weight > 0) {
        const volume = (width * length * height) / 1000000;
        cart.push({ id: Date.now(), dims: `${width}x${length}x${height} cm`, weight, volume });
        updateCart();
        document.getElementById('width').value = ''; document.getElementById('length').value = '';
        document.getElementById('height').value = ''; document.getElementById('weight').value = '';
    } else { alert('Kérjük, tölts ki minden mezőt érvényes, pozitív számmal!'); }
}
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCart();
}
function updateCart() {
    localStorage.setItem('caregoCart', JSON.stringify(cart));
    const cartItemsEl = document.getElementById('cart-items');
    if (!cartItemsEl) return;
    
    cartItemsEl.innerHTML = '';
    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<li>A kosár jelenleg üres.</li>';
    } else {
        cart.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span><i class="fa-solid fa-box"></i> ${item.dims} - <strong>${item.weight} kg</strong></span> <span class="remove-item" onclick="removeFromCart(${item.id})">&times;</span>`;
            cartItemsEl.appendChild(li);
        });
    }
    calculateTotals();
}
function calculateTotals() {
    const checkoutBtn = document.getElementById("checkout-btn");
    if (!checkoutBtn) return;

    const totalWeight = cart.reduce((sum, item) => sum + item.weight, 0);
    const totalVolume = cart.reduce((sum, item) => sum + item.volume, 0);
    let priceText = "0 €";
    let finalPrice = 0;
    
    const currentPriceTiers = regionalPriceTiers[currentRegion];

    if (totalWeight > 0 && currentPriceTiers) {
        const topTier = currentPriceTiers[currentPriceTiers.length - 1];
        if (totalWeight <= topTier.maxWeight && totalVolume <= topTier.maxVolume) {
            const weightTier = currentPriceTiers.find(tier => totalWeight <= tier.maxWeight) || {};
            const priceByWeight = weightTier.price || Infinity;
            const volumeTier = currentPriceTiers.find(tier => totalVolume <= tier.maxVolume) || {};
            const priceByVolume = volumeTier.price || Infinity;
            finalPrice = Math.max(priceByWeight, priceByVolume);
            priceText = `~ ${finalPrice} €`;
        } else {
            const proportionalPriceByWeight = totalWeight * (topTier.price / topTier.maxWeight);
            const proportionalPriceByVolume = totalVolume * (topTier.price / topTier.maxVolume);
            finalPrice = Math.max(proportionalPriceByWeight, proportionalPriceByVolume);
            priceText = `~ ${finalPrice.toFixed(2)} € (Becsült díj)`;
        }
    }
    if (cart.length === 0) {
        checkoutBtn.classList.add("disabled");
        checkoutBtn.textContent = "Tovább a foglaláshoz";
        checkoutBtn.href = "#";
    } else if (finalPrice > 200) {
        checkoutBtn.classList.remove("disabled");
        checkoutBtn.textContent = "Egyedi Árajánlat Kérése";
        checkoutBtn.href = "kapcsolat.html";
    } else {
        checkoutBtn.classList.remove("disabled");
        checkoutBtn.textContent = "Tovább a foglaláshoz";
        const cartDetails = cart.map(item => `${item.dims} (${item.weight}kg)`).join("; ");
        const queryParams = new URLSearchParams({ suly: totalWeight.toFixed(2), terfogat: totalVolume.toFixed(3), ar: encodeURIComponent(priceText), reszletek: cartDetails });
        checkoutBtn.href = `lead-order.html?${queryParams.toString()}`;
    }
    document.querySelector("#total-weight span").textContent = `${totalWeight.toFixed(2)} kg`;
    document.querySelector("#total-volume span").textContent = `${totalVolume.toFixed(3)} m³`;
    document.querySelector("#total-price span").textContent = priceText;
}
function setRegion(region) {
    currentRegion = region;
    localStorage.setItem("caregoRegion", region);
    if(typeof calculateTotals === 'function') calculateTotals();
    if(typeof updatePricingTable === 'function') updatePricingTable(region);
}
function updatePricingTable(region) {
    const pricingTableBody = document.querySelector(".pricing-table tbody");
    if (!pricingTableBody) return;
    const tiers = regionalPriceTiers[region];
    pricingTableBody.innerHTML = '';
    
    tiers.forEach(tier => {
        const row = document.createElement('tr');
        const prevTierWeight = tiers.indexOf(tier) > 0 ? tiers[tiers.indexOf(tier)-1].maxWeight : 0;
        row.innerHTML = `
            <td data-label="Csomag tömege">${prevTierWeight}-${tier.maxWeight} kg-ig</td>
            <td data-label="Max. térfogat">${tier.maxVolume} m³</td>
            <td data-label="Bruttó Árak">~ ${tier.price} €</td>
        `;
        pricingTableBody.appendChild(row);
    });
}
async function loadComponent(component, placeholderId) {
    const placeholder = document.getElementById(placeholderId);
    if (placeholder) {
        try {
            const response = await fetch(component);
            if (response.ok) {
                placeholder.innerHTML = await response.text();
            } else {
                console.error(`Error loading ${component}: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Network error loading ${component}:`, error);
        }
    }
}

// --- FŐ INICIALIZÁLÓ FÜGGVÉNY ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. LÉPÉS: VÁRJUK MEG, HOGY A KÖZÖS ELEMEK BETÖLTŐDJENEK
    await Promise.all([
        loadComponent('header.html', 'header-placeholder'),
        loadComponent('footer.html', 'footer-placeholder')
    ]);

    // 2. LÉPÉS: CSAK A BETÖLTÉS UTÁN FUTTATJUK A TÖBBI SCRIPTET
    
    // Régió beállítása
    setRegion(localStorage.getItem("caregoRegion") || 'EU');
    document.querySelectorAll(".region-selector").forEach(selector => {
        selector.value = currentRegion;
        selector.addEventListener("change", (event) => setRegion(event.target.value));
    });

    // Oldal-specifikus inicializálás
    if (document.querySelector(".pricing-table")) { // Árak oldal
        updatePricingTable(currentRegion);
    }
    if (document.getElementById("calculator-modal") || document.querySelector('.calculator')) { // Főoldal vagy Kalkulátor oldal
        updateCart();
    }
    if(document.querySelectorAll(".faq-item").length > 0){ // Információk oldal
        document.querySelectorAll(".faq-item .faq-question").forEach(question => {
            question.addEventListener("click", () => {
                const parent = question.parentElement;
                const wasActive = parent.classList.contains('active');
                document.querySelectorAll(".faq-item").forEach(item => item.classList.remove('active'));
                if (!wasActive) parent.classList.add('active');
            });
        });
    }
    if (document.getElementById("summary-ar")) { // Megrendelés véglegesítése oldal
        const urlParams = new URLSearchParams(window.location.search);
        document.getElementById('summary-suly').textContent = urlParams.get('suly') + ' kg';
        document.getElementById('summary-terfogat').textContent = urlParams.get('terfogat') + ' m³';
        document.getElementById('summary-ar').textContent = decodeURIComponent(urlParams.get('ar'));
        document.getElementById('summary-reszletek').textContent = urlParams.get('reszletek');
        document.getElementById('form-suly').value = urlParams.get('suly') + ' kg';
        document.getElementById('form-terfogat').value = urlParams.get('terfogat') + ' m³';
        document.getElementById('form-ar').value = decodeURIComponent(urlParams.get('ar'));
        document.getElementById('form-reszletek').value = urlParams.get('reszletek');
    }
    
    // Általános eseménykezelők
    const header = document.querySelector("header");
    if (header) {
        window.addEventListener("scroll", () => {
            header.classList.toggle("scrolled", window.scrollY > 10);
        });
    }

    const heroOrderBtn = document.getElementById("hero-order-btn");
    const openCalculatorModalBtn = document.getElementById("open-calculator-modal-btn");
    if (heroOrderBtn && openCalculatorModalBtn) {
        heroOrderBtn.addEventListener('click', (event) => {
            event.preventDefault(); 
            openCalculatorModalBtn.click();
        });
    }

    const calculatorModal = document.getElementById("calculator-modal");
    if (calculatorModal && openCalculatorModalBtn) {
        const closeBtn = calculatorModal.querySelector('.close-button');
        openCalculatorModalBtn.addEventListener('click', () => {
            calculatorModal.style.display = 'flex';
            setTimeout(() => { calculatorModal.style.opacity = '1'; calculatorModal.querySelector('.modal-content').style.transform = 'scale(1)'; }, 10);
        });
        function closeModal() {
            calculatorModal.style.opacity = '0';
            calculatorModal.querySelector('.modal-content').style.transform = 'scale(0.9)';
            setTimeout(() => { calculatorModal.style.display = 'none'; }, 300);
        }
        closeBtn.addEventListener('click', closeModal);
        calculatorModal.addEventListener('click', (event) => { if (event.target === calculatorModal) { closeModal(); } });
    }

    const contactModal = document.getElementById("contact-modal");
    const openContactModalBtn = document.getElementById("open-contact-modal-btn");
    if (contactModal && openContactModalBtn) {
        const closeBtn = contactModal.querySelector('.close-button');
        openContactModalBtn.addEventListener('click', () => {
            contactModal.style.display = 'flex';
            setTimeout(() => { contactModal.style.opacity = '1'; contactModal.querySelector('.modal-content').style.transform = 'scale(1)'; }, 10);
        });
        function closeModal() {
            contactModal.style.opacity = '0';
            contactModal.querySelector('.modal-content').style.transform = 'scale(0.9)';
            setTimeout(() => { contactModal.style.display = 'none'; }, 300);
        }
        closeBtn.addEventListener('click', closeModal);
        contactModal.addEventListener('click', (event) => { if (event.target === contactModal) { closeModal(); } });
    }

    const cookieBanner = document.getElementById("cookie-banner");
    const cookieAcceptBtn = document.getElementById("cookie-accept-btn");
    if (cookieBanner && cookieAcceptBtn) {
        if (!localStorage.getItem("cookieConsent")) {
            cookieBanner.style.display = "flex";
        }
        cookieAcceptBtn.addEventListener("click", () => {
            cookieBanner.style.display = "none";
            localStorage.setItem("cookieConsent", "true");
        });
    }

    const hamburgerBtn = document.getElementById("hamburger-btn");
    const mainNav = document.getElementById("main-nav");
    if (hamburgerBtn && mainNav) {
        hamburgerBtn.addEventListener("click", () => {
            mainNav.classList.toggle("nav-open");
            hamburgerBtn.classList.toggle("open");
        });
    }

    document.querySelectorAll(".has-dropdown > a").forEach(menuItem => {
        menuItem.addEventListener("click", function(event) {
            if (window.innerWidth <= 768) {
                event.preventDefault();
                this.parentElement.classList.toggle("dropdown-open");
            }
        });
    });
    
    // Aktív menüpont jelzése
    const currentPage = window.location.pathname.split('/').pop() || "index.html";
    const mainNavLinks = document.querySelectorAll('#main-nav a');
    if (currentPage === "index.html") {
        const sections = document.querySelectorAll('main > section[id]');
        if (sections.length > 0) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                        mainNavLinks.forEach(link => link.classList.remove('active-link'));
                        const correspondingLink = document.querySelector(`#main-nav a[href$="#${entry.target.id}"]`);
                        if (correspondingLink) {
                            correspondingLink.classList.add('active-link');
                        }
                    }
                });
            }, { rootMargin: '-40% 0px -40% 0px', threshold: 0.5 });
            sections.forEach(section => observer.observe(section));
        }
    } else {
        mainNavLinks.forEach(link => {
            if (link.getAttribute('href').endsWith(currentPage)) {
                link.classList.add('active-link');
                const parentDropdown = link.closest('.has-dropdown');
                if (parentDropdown) {
                    parentDropdown.querySelector('a').classList.add('active-link');
                }
            }
        });
    }
});